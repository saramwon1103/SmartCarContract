import express from "express";
import mysql from "mysql2";
import cors from "cors";
import crypto from "crypto";
import dotenv from "dotenv";
import { ethers } from "ethers";
import BlockchainService from "./blockchain.js";
import { ContractPDFGenerator } from "./contractPDF.js";
import { PinataService } from "./pinataService.js";

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Support form data

// Initialize blockchain service
const blockchainService = new BlockchainService();
const pdfGenerator = new ContractPDFGenerator();
const pinataService = new PinataService();

// SỬA DÒNG NÀY: dùng createConnection + new
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "CarRentalDApp"
});
  
// Pin agreement metadata to IPFS via Pinata and optionally attach to Contracts row
app.post('/api/ipfs/pinAgreement', async (req, res) => {
  try {
    const { contractId, contractAddress, metadata } = req.body;
    if (!metadata) return res.status(400).json({ error: 'Missing metadata in request body' });

    // metadata should be a plain JS object
    const pinResult = await pinJSONToIPFS(metadata);
    const ipfsCid = pinResult.IpfsHash || pinResult.IpfsHash; // compatibility
    const metadataUri = `ipfs://${ipfsCid}`;

    // Try to update Contracts table if contractId or contractAddress provided
    if (contractId || contractAddress) {
      const fieldValue = metadataUri;
      try {
        if (contractId) {
          await query(`UPDATE Contracts SET MetadataURI = ? WHERE ContractId = ?`, [fieldValue, contractId]);
        } else {
          await query(`UPDATE Contracts SET MetadataURI = ? WHERE ContractAddress = ?`, [fieldValue, contractAddress]);
        }
      } catch (err) {
        // If the column doesn't exist, create it then update
        if (err && err.code === 'ER_BAD_FIELD_ERROR') {
          await query(`ALTER TABLE Contracts ADD COLUMN MetadataURI VARCHAR(255) DEFAULT NULL`);
          if (contractId) {
            await query(`UPDATE Contracts SET MetadataURI = ? WHERE ContractId = ?`, [fieldValue, contractId]);
          } else {
            await query(`UPDATE Contracts SET MetadataURI = ? WHERE ContractAddress = ?`, [fieldValue, contractAddress]);
          }
        } else {
          throw err;
        }
      }
    }

    res.json({ success: true, ipfs: pinResult, uri: metadataUri });
  } catch (err) {
    console.error('Error pinning metadata to IPFS:', err?.message || err);
    res.status(500).json({ error: err?.message || String(err) });
  }
});

db.connect(err => {
  if (err) return console.error("MySQL connection error:", err);
  console.log("Connected to MySQL database!");
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    database: "connected"
  });
});

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

function hashPassword(rawPassword) {
  if (!rawPassword) return "";
  return crypto.createHash("sha256").update(String(rawPassword)).digest("hex");
}

async function generateSequentialId(table, column, prefix, padLength = 3) {
  const sql = `SELECT ${column} AS id FROM ${table} ORDER BY ${column} DESC LIMIT 1`;
  const rows = await query(sql);
  
  let nextNum = 1;
  
  if (rows.length && rows[0].id) {
    // Extract number from existing ID (e.g., "CT016" -> 16)
    const match = rows[0].id.match(/(\d+)$/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }
  
  // Generate new ID with padding
  let newId;
  let attempts = 0;
  const maxAttempts = 100;
  
  do {
    newId = `${prefix}${String(nextNum).padStart(padLength, "0")}`;
    
    // Check if this ID already exists
    const existingRows = await query(`SELECT ${column} FROM ${table} WHERE ${column} = ? LIMIT 1`, [newId]);
    
    if (existingRows.length === 0) {
      break; // ID is unique, we can use it
    }
    
    nextNum++;
    attempts++;
    
  } while (attempts < maxAttempts);
  
  if (attempts >= maxAttempts) {
    throw new Error(`Could not generate unique ID after ${maxAttempts} attempts`);
  }
  
  console.log(`Generated unique ID: ${newId} (after ${attempts} attempts)`);
  return newId;
}

async function generateContractId() {
  return generateSequentialId("Contracts", "ContractId", "CT");
}

async function generateUserId() {
  return generateSequentialId("Users", "UserId", "U");
}

async function generateWalletId() {
  return generateSequentialId("Wallets", "WalletId", "W");
}

async function upsertPrimaryWallet(userId, walletAddress, network = "Polygon") {
  if (!walletAddress) return;
  const existing = await query(
    `SELECT WalletId FROM Wallets WHERE UserId = ? ORDER BY LastConnected DESC LIMIT 1`,
    [userId]
  );
  const now = new Date();
  if (existing.length) {
    await query(
      `UPDATE Wallets SET WalletAddress = ?, NetWork = ?, LastConnected = ? WHERE WalletId = ?`,
      [walletAddress, network, now, existing[0].WalletId]
    );
    return;
  }
  const walletId = await generateWalletId();
  await query(
    `INSERT INTO Wallets (WalletId, UserId, WalletAddress, NetWork, LastConnected) VALUES (?, ?, ?, ?, ?)`,
    [walletId, userId, walletAddress, network, now]
  );
}

async function attachUserExtras(users) {
  if (!users.length) return [];
  const userIds = users.map(user => user.UserId);
  const placeholders = userIds.map(() => "?").join(",");

  const [carCounts, contractCounts, wallets] = await Promise.all([
    query(
      `SELECT OwnerId AS UserId, COUNT(*) AS OwnedCarsCount
       FROM Cars
       WHERE OwnerId IN (${placeholders})
       GROUP BY OwnerId`,
      [...userIds]
    ),
    query(
      `SELECT UserId,
              COUNT(*) AS TotalContractsCount,
              SUM(CASE WHEN LOWER(COALESCE(Status, '')) <> 'completed' THEN 1 ELSE 0 END) AS ActiveContractsCount
       FROM Contracts
       WHERE UserId IN (${placeholders})
       GROUP BY UserId`,
      [...userIds]
    ),
    query(
      `SELECT WalletId, UserId, WalletAddress, NetWork, LastConnected
       FROM Wallets
       WHERE UserId IN (${placeholders})
       ORDER BY LastConnected DESC`,
      [...userIds]
    )
  ]);

  const carMap = {};
  carCounts.forEach(row => {
    carMap[row.UserId] = row.OwnedCarsCount;
  });

  const contractMap = {};
  contractCounts.forEach(row => {
    contractMap[row.UserId] = {
      TotalContractsCount: row.TotalContractsCount || 0,
      ActiveContractsCount: row.ActiveContractsCount || 0
    };
  });

  const walletMap = {};
  wallets.forEach(wallet => {
    if (!walletMap[wallet.UserId]) walletMap[wallet.UserId] = [];
    walletMap[wallet.UserId].push(wallet);
  });

  return users.map(user => ({
    ...user,
    OwnedCarsCount: carMap[user.UserId] || 0,
    TotalContractsCount: contractMap[user.UserId]?.TotalContractsCount || 0,
    ActiveContractsCount: contractMap[user.UserId]?.ActiveContractsCount || 0,
    Wallets: walletMap[user.UserId] || []
  }));
}

// Helper function để generate CarId tự động
async function generateCarId() {
  return new Promise((resolve, reject) => {
    const sql = `SELECT CarId FROM Cars ORDER BY CarId DESC LIMIT 1`;
    db.query(sql, (err, results) => {
      if (err) return reject(err);
      
      if (results.length === 0) {
        return resolve("C0001");
      }
      
      const lastId = results[0].CarId;
      const match = lastId.match(/\d+/);
      if (!match) return resolve("C0001");
      
      const nextNum = parseInt(match[0]) + 1;
      const paddedNum = String(nextNum).padStart(4, "0");
      resolve("C" + paddedNum);
    });
  });
}

// ========== ADMIN CARS API ==========

app.get("/api/admin/cars", (req, res) => {
  const search = req.query.search || "";
  let sql = `SELECT CarId, CarName, Brand, ModelYear, PriceRent, PriceBuy, Status, ImageURL, Description, OwnerId 
             FROM Cars`;
  
  const params = [];
  
  if (search) {
    sql += ` WHERE CarName LIKE ? OR Brand LIKE ? OR CarId LIKE ?`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }
  
  sql += ` ORDER BY CarId DESC`;
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching cars:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, cars: results });
  });
});

app.get("/api/admin/cars/:carId", (req, res) => {
  const { carId } = req.params;
  const sql = `SELECT CarId, CarName, Brand, ModelYear, PriceRent, PriceBuy, Status, ImageURL, Description, OwnerId 
               FROM Cars WHERE CarId = ?`;
  
  db.query(sql, [carId], (err, results) => {
    if (err) {
      console.error("Error fetching car:", err);
      return res.status(500).json({ error: err.message });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: "Car not found" });
    }
    
    res.json({ success: true, car: results[0] });
  });
});

app.post("/api/admin/cars", async (req, res) => {
  try {
    const { carName, brand, modelYear, priceRent, priceBuy, status, imageURL, description, ownerId } = req.body;
    
    if (!carName || !brand || !modelYear || !priceRent || !priceBuy || !status || !imageURL || !ownerId) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const carId = await generateCarId();
    
    const sql = `INSERT INTO Cars (CarId, CarName, Brand, ModelYear, PriceRent, PriceBuy, Status, ImageURL, Description, OwnerId) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.query(sql, [carId, carName, brand, modelYear, priceRent, priceBuy, status, imageURL, description || "", ownerId], 
      (err, results) => {
        if (err) {
          console.error("Error creating car:", err);
          return res.status(500).json({ error: err.message });
        }
        
        db.query(`SELECT * FROM Cars WHERE CarId = ?`, [carId], (err2, carResults) => {
          if (err2) {
            return res.status(500).json({ error: err2.message });
          }
          res.status(201).json({ success: true, car: carResults[0] });
        });
      });
  } catch (error) {
    console.error("Error in create car:", error);
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/admin/cars/:carId", (req, res) => {
  const { carId } = req.params;
  const { carName, brand, modelYear, priceRent, priceBuy, status, imageURL, description, ownerId } = req.body;
  
  if (!carName || !brand || !modelYear || !priceRent || !priceBuy || !status || !imageURL || !ownerId) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  
  const sql = `UPDATE Cars 
               SET CarName = ?, Brand = ?, ModelYear = ?, PriceRent = ?, PriceBuy = ?, 
                   Status = ?, ImageURL = ?, Description = ?, OwnerId = ?
               WHERE CarId = ?`;
  
  db.query(sql, [carName, brand, modelYear, priceRent, priceBuy, status, imageURL, description || "", ownerId, carId], 
    (err, results) => {
      if (err) {
        console.error("Error updating car:", err);
        return res.status(500).json({ error: err.message });
      }
      
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: "Car not found" });
      }
      
      db.query(`SELECT * FROM Cars WHERE CarId = ?`, [carId], (err2, carResults) => {
        if (err2) {
          return res.status(500).json({ error: err2.message });
        }
        res.json({ success: true, car: carResults[0] });
      });
    });
});

app.delete("/api/admin/cars/:carId", (req, res) => {
  const { carId } = req.params;
  
  db.query(`SELECT CarId FROM Cars WHERE CarId = ?`, [carId], (err, results) => {
    if (err) {
      console.error("Error checking car:", err);
      return res.status(500).json({ error: err.message });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: "Car not found" });
    }
    
    db.query(`SELECT ContractId FROM Contracts WHERE CarId = ? LIMIT 1`, [carId], (err2, contractResults) => {
      if (err2) {
        console.error("Error checking contracts:", err2);
        return res.status(500).json({ error: err2.message });
      }
      
      if (contractResults.length > 0) {
        return res.status(400).json({ error: "Cannot delete car that has existing contracts" });
      }
      
      db.query(`DELETE FROM CarImage WHERE CarId = ?`, [carId], (err3) => {
        if (err3) console.error("Error deleting car images:", err3);
        
        db.query(`DELETE FROM Cars WHERE CarId = ?`, [carId], (err4, results4) => {
          if (err4) {
            console.error("Error deleting car:", err4);
            return res.status(500).json({ error: err4.message });
          }
          res.json({ success: true, message: "Car deleted successfully" });
        });
      });
    });
  });
});

app.get("/api/cars", (req, res) => {
  const sql = `SELECT CarId, CarName, Brand, ModelYear, PriceRent, PriceBuy, Status, ImageURL, Description, OwnerId FROM Cars`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// =======================================
// ========== ADMIN USERS API ============
// =======================================

app.get("/api/admin/users", async (req, res) => {
  try {
    const search = (req.query.search || "").trim();
    let sql = `SELECT UserId, FullName, Email, WalletAddress, Role, AvatarURL, CreatedAt FROM Users`;
    const params = [];

    if (search) {
      sql += ` WHERE FullName LIKE ? OR Email LIKE ? OR UserId LIKE ?`;
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    sql += ` ORDER BY CreatedAt DESC`;
    const users = await query(sql, params);
    const enriched = await attachUserExtras(users);
    res.json({ success: true, users: enriched });
  } catch (error) {
    console.error("Error fetching admin users:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/admin/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const users = await query(
      `SELECT UserId, FullName, Email, WalletAddress, Role, AvatarURL, CreatedAt FROM Users WHERE UserId = ?`,
      [userId]
    );
    if (!users.length) {
      return res.status(404).json({ error: "User not found" });
    }
    const [enriched] = await attachUserExtras(users);
    res.json({ success: true, user: enriched });
  } catch (error) {
    console.error("Error fetching admin user:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/users", async (req, res) => {
  try {
    const { fullname, email, password, role, walletAddress, avatarURL, network } = req.body;

    if (!fullname || !email || !password || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existing = await query(`SELECT UserId FROM Users WHERE Email = ? LIMIT 1`, [email]);
    if (existing.length) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const userId = await generateUserId();
    const passwordHash = hashPassword(password);

    await query(
      `INSERT INTO Users (UserId, FullName, Email, PasswordHash, WalletAddress, AvatarURL, Role)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, fullname, email, passwordHash, walletAddress || null, avatarURL || null, role]
    );

    if (walletAddress) {
      await upsertPrimaryWallet(userId, walletAddress, network || "Polygon");
    }

    const created = await query(
      `SELECT UserId, FullName, Email, WalletAddress, Role, AvatarURL, CreatedAt FROM Users WHERE UserId = ?`,
      [userId]
    );
    const [enriched] = await attachUserExtras(created);
    res.status(201).json({ success: true, user: enriched });
  } catch (error) {
    console.error("Error creating admin user:", error);
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/admin/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { fullname, email, role, walletAddress, avatarURL, newPassword, network } = req.body;

    if (!fullname || !email || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existingUser = await query(`SELECT UserId FROM Users WHERE UserId = ?`, [userId]);
    if (!existingUser.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const otherEmail = await query(`SELECT UserId FROM Users WHERE Email = ? AND UserId <> ? LIMIT 1`, [email, userId]);
    if (otherEmail.length) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const updates = [];
    const params = [];

    updates.push("FullName = ?");
    params.push(fullname);

    updates.push("Email = ?");
    params.push(email);

    updates.push("Role = ?");
    params.push(role);

    updates.push("WalletAddress = ?");
    params.push(walletAddress || null);

    if (avatarURL !== undefined) {
      updates.push("AvatarURL = ?");
      params.push(avatarURL || null);
    }

    if (newPassword) {
      updates.push("PasswordHash = ?");
      params.push(hashPassword(newPassword));
    }

    params.push(userId);

    await query(`UPDATE Users SET ${updates.join(", ")} WHERE UserId = ?`, params);

    if (walletAddress) {
      await upsertPrimaryWallet(userId, walletAddress, network || "Polygon");
    }

    const updated = await query(
      `SELECT UserId, FullName, Email, WalletAddress, Role, AvatarURL, CreatedAt FROM Users WHERE UserId = ?`,
      [userId]
    );
    const [enriched] = await attachUserExtras(updated);
    res.json({ success: true, user: enriched });
  } catch (error) {
    console.error("Error updating admin user:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/admin/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await query(`SELECT UserId FROM Users WHERE UserId = ?`, [userId]);
    if (!user.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const ownedCars = await query(`SELECT CarId FROM Cars WHERE OwnerId = ? LIMIT 1`, [userId]);
    if (ownedCars.length) {
      return res.status(400).json({ error: "Cannot delete user who owns cars" });
    }

    const relatedContracts = await query(`SELECT ContractId FROM Contracts WHERE UserId = ? LIMIT 1`, [userId]);
    if (relatedContracts.length) {
      return res.status(400).json({ error: "Cannot delete user with contracts" });
    }

    await query(`DELETE FROM Wallets WHERE UserId = ?`, [userId]);
    await query(`DELETE FROM Users WHERE UserId = ?`, [userId]);

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting admin user:", error);
    res.status(500).json({ error: error.message });
  }
});

// =======================================
// ========== USER API (MỚI) ==========
// =======================================

app.get("/api/user/:userId", (req, res) => {
  const { userId } = req.params;
  const sql = `SELECT UserId, FullName, Email, Role, WalletAddress, AvatarURL 
               FROM Users 
               WHERE UserId = ?`;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching user:", err);
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ success: true, user: results[0] });
  });
});

app.put("/api/user/:userId", (req, res) => {
  const { userId } = req.params;
  const { fullName, role, email, walletAddress } = req.body;

  const sql = `UPDATE Users 
               SET FullName = ?, Role = ?, Email = ?, WalletAddress = ?
               WHERE UserId = ?`;

  db.query(sql, [fullName, role, email, walletAddress, userId], (err, results) => {
    if (err) {
      console.error("Error updating user:", err);
      return res.status(500).json({ error: err.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    db.query(`SELECT UserId, FullName, Email, Role, WalletAddress, AvatarURL FROM Users WHERE UserId = ?`, [userId], (err2, userResults) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ success: true, user: userResults[0] });
    });
  });
});

// ==================== ADMIN DASHBOARD API ENDPOINTS ====================

// Get dashboard statistics
app.get("/api/admin/dashboard/stats", async (req, res) => {
  try {
    const [totalCarsResult] = await query(`SELECT COUNT(*) as count FROM Cars`);
    const [totalUsersResult] = await query(`SELECT COUNT(*) as count FROM Users WHERE Role IN ('User', 'Owner')`);
    const [totalOwnersResult] = await query(`SELECT COUNT(*) as count FROM Users WHERE Role = 'Owner'`);
    const [activeContractsResult] = await query(`SELECT COUNT(*) as count FROM Contracts WHERE Status IN ('Active', 'Pending')`);
    
    // Calculate total revenue from completed contracts
    const [totalRevenueResult] = await query(`
      SELECT SUM(TotalPrice) as revenue 
      FROM Contracts 
      WHERE Status = 'Completed'
    `);
    
    const stats = {
      totalCars: totalCarsResult.count,
      totalUsers: totalUsersResult.count,
      totalOwners: totalOwnersResult.count,
      activeContracts: activeContractsResult.count,
      totalRevenue: totalRevenueResult.revenue || 0,
      monthlyGrowth: 12.5 // This could be calculated based on date comparison
    };
    
    res.json({ success: true, stats });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get car types data for chart
app.get("/api/admin/dashboard/car-types", async (req, res) => {
  try {
    const carTypesQuery = `
      SELECT Brand, COUNT(*) as count 
      FROM Cars 
      GROUP BY Brand 
      ORDER BY count DESC
    `;
    const carTypesResult = await query(carTypesQuery);
    
    const labels = carTypesResult.map(row => row.Brand);
    const data = carTypesResult.map(row => row.count);
    const colors = ['#3563E9', '#264BC8', '#85A8F8', '#AEC8FC', '#D6E4FD', '#F1F3F6', '#E74C3C'];
    
    res.json({ 
      success: true, 
      chartData: { labels, data, colors } 
    });
  } catch (error) {
    console.error("Error fetching car types data:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get recent transactions
app.get("/api/admin/dashboard/recent-transactions", async (req, res) => {
  try {
    const transactionsQuery = `
      SELECT 
        c.ContractId,
        cars.CarName,
        cars.Brand as carType,
        c.TotalPrice as amount,
        c.StartDate as date,
        cars.ImageURL
      FROM Contracts c
      JOIN Cars cars ON c.CarId = cars.CarId
      WHERE c.Status IN ('Active', 'Completed')
      ORDER BY c.StartDate DESC
      LIMIT 10
    `;
    
    const transactions = await query(transactionsQuery);
    
    res.json({ 
      success: true, 
      transactions: transactions.map(t => ({
        contractId: t.ContractId,
        carName: t.CarName,
        carType: t.carType,
        amount: parseFloat(t.amount),
        date: t.date,
        imageURL: t.ImageURL
      }))
    });
  } catch (error) {
    console.error("Error fetching recent transactions:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get rental details (latest active rental)
app.get("/api/admin/dashboard/rental-details", async (req, res) => {
  try {
    const rentalQuery = `
      SELECT 
        c.ContractId,
        cars.CarName,
        cars.Brand as carType,
        cars.ImageURL as carImage,
        c.PickupLocation,
        c.DropoffLocation,
        c.StartDate as pickupDate,
        c.EndDate as dropoffDate,
        '09:00' as pickupTime,
        '18:00' as dropoffTime,
        c.TotalPrice as totalPrice,
        u.FullName as renterName,
        c.Status
      FROM Contracts c
      JOIN Cars cars ON c.CarId = cars.CarId
      JOIN Users u ON c.UserId = u.UserId
      WHERE c.Status = 'Active'
      ORDER BY c.StartDate DESC
      LIMIT 1
    `;
    
    const rentalResult = await query(rentalQuery);
    
    if (rentalResult.length > 0) {
      const rental = {
        contractId: rentalResult[0].ContractId,
        carName: rentalResult[0].CarName,
        carType: rentalResult[0].carType,
        carImage: rentalResult[0].carImage,
        pickupLocation: rentalResult[0].PickupLocation,
        dropoffLocation: rentalResult[0].DropoffLocation,
        pickupDate: rentalResult[0].pickupDate,
        dropoffDate: rentalResult[0].dropoffDate,
        pickupTime: rentalResult[0].pickupTime,
        dropoffTime: rentalResult[0].dropoffTime,
        totalPrice: parseFloat(rentalResult[0].totalPrice),
        renterName: rentalResult[0].renterName,
        status: rentalResult[0].Status
      };
      
      res.json({ success: true, rental });
    } else {
      res.json({ success: true, rental: null });
    }
  } catch (error) {
    console.error("Error fetching rental details:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== ADMIN CONTRACT API ENDPOINTS ====================

// Get all contracts with full details
app.get("/api/admin/contracts", async (req, res) => {
  try {
    const contractsQuery = `
      SELECT 
        c.ContractId,
        c.CarId,
        c.UserId,
        c.OwnerId,
        c.Type,
        c.StartDate,
        c.EndDate,
        c.PickupLocation,
        c.DropoffLocation,
        c.Deposit,
        c.TotalPrice,
        c.Status,
        c.TXHash,
        cars.CarName,
        cars.Brand,
        cars.ImageURL,
        u_user.FullName as UserName,
        u_user.Email as UserEmail,
        u_owner.FullName as OwnerName,
        u_owner.Email as OwnerEmail
      FROM Contracts c
      LEFT JOIN Cars cars ON c.CarId = cars.CarId
      LEFT JOIN Users u_user ON c.UserId = u_user.UserId
      LEFT JOIN Users u_owner ON c.OwnerId = u_owner.UserId
      ORDER BY c.StartDate DESC
    `;
    
    const contracts = await query(contractsQuery);
    
    res.json({ 
      success: true, 
      contracts: contracts.map(contract => ({
        ContractId: contract.ContractId,
        CarId: contract.CarId,
        UserId: contract.UserId,
        OwnerId: contract.OwnerId,
        Type: contract.Type,
        StartDate: contract.StartDate,
        EndDate: contract.EndDate,
        PickupLocation: contract.PickupLocation,
        DropoffLocation: contract.DropoffLocation,
        Deposit: parseFloat(contract.Deposit),
        TotalPrice: parseFloat(contract.TotalPrice),
        Status: contract.Status,
        TXHash: contract.TXHash,
        CarName: contract.CarName,
        Brand: contract.Brand,
        ImageURL: contract.ImageURL,
        UserName: contract.UserName,
        UserEmail: contract.UserEmail,
        OwnerName: contract.OwnerName,
        OwnerEmail: contract.OwnerEmail
      }))
    });
  } catch (error) {
    console.error("Error fetching contracts:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get single contract details
app.get("/api/admin/contracts/:contractId", async (req, res) => {
  try {
    const { contractId } = req.params;
    
    const contractQuery = `
      SELECT 
        c.*,
        cars.CarName,
        cars.Brand,
        cars.ImageURL,
        cars.PriceRent,
        u_user.FullName as UserName,
        u_user.Email as UserEmail,
        u_user.WalletAddress as UserWallet,
        u_owner.FullName as OwnerName,
        u_owner.Email as OwnerEmail,
        u_owner.WalletAddress as OwnerWallet
      FROM Contracts c
      LEFT JOIN Cars cars ON c.CarId = cars.CarId
      LEFT JOIN Users u_user ON c.UserId = u_user.UserId
      LEFT JOIN Users u_owner ON c.OwnerId = u_owner.UserId
      WHERE c.ContractId = ?
    `;
    
    const contractResult = await query(contractQuery, [contractId]);
    
    if (contractResult.length === 0) {
      return res.status(404).json({ error: "Contract not found" });
    }
    
    const contract = contractResult[0];
    res.json({
      success: true,
      contract: {
        ...contract,
        Deposit: parseFloat(contract.Deposit),
        TotalPrice: parseFloat(contract.TotalPrice),
        PriceRent: parseFloat(contract.PriceRent)
      }
    });
  } catch (error) {
    console.error("Error fetching contract details:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update contract status
app.put("/api/admin/contracts/:contractId/status", async (req, res) => {
  try {
    const { contractId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['Pending', 'Active', 'Completed', 'Terminated'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Invalid status. Valid values: ${validStatuses.join(', ')}` 
      });
    }
    
    const updateQuery = `
      UPDATE Contracts 
      SET Status = ?, UpdatedAt = NOW() 
      WHERE ContractId = ?
    `;
    
    const result = await query(updateQuery, [status, contractId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Contract not found" });
    }
    
    // Get updated contract
    const updatedContract = await query(`
      SELECT ContractId, Status FROM Contracts WHERE ContractId = ?
    `, [contractId]);
    
    res.json({
      success: true,
      message: `Contract ${contractId} status updated to ${status}`,
      contract: updatedContract[0]
    });
  } catch (error) {
    console.error("Error updating contract status:", error);
    res.status(500).json({ error: error.message });
  }
});

// Terminate contract
app.put("/api/admin/contracts/:contractId/terminate", async (req, res) => {
  try {
    const { contractId } = req.params;
    
    // Check if contract exists and can be terminated
    const contractCheck = await query(`
      SELECT ContractId, Status FROM Contracts WHERE ContractId = ?
    `, [contractId]);
    
    if (contractCheck.length === 0) {
      return res.status(404).json({ error: "Contract not found" });
    }
    
    const currentStatus = contractCheck[0].Status;
    if (currentStatus === 'Completed' || currentStatus === 'Terminated') {
      return res.status(400).json({ 
        error: "Cannot terminate a completed or already terminated contract" 
      });
    }
    
    const terminateQuery = `
      UPDATE Contracts 
      SET Status = 'Terminated', UpdatedAt = NOW() 
      WHERE ContractId = ?
    `;
    
    const result = await query(terminateQuery, [contractId]);
    
    res.json({
      success: true,
      message: `Contract ${contractId} has been terminated`,
      contractId: contractId,
      status: 'Terminated'
    });
  } catch (error) {
    console.error("Error terminating contract:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get contract statistics
app.get("/api/admin/contracts/stats", async (req, res) => {
  try {
    const statsQueries = [
      query(`SELECT COUNT(*) as total FROM Contracts`),
      query(`SELECT COUNT(*) as active FROM Contracts WHERE Status = 'Active'`),
      query(`SELECT COUNT(*) as pending FROM Contracts WHERE Status = 'Pending'`),
      query(`SELECT COUNT(*) as completed FROM Contracts WHERE Status = 'Completed'`),
      query(`SELECT COUNT(*) as terminated FROM Contracts WHERE Status = 'Terminated'`),
      query(`SELECT SUM(TotalPrice) as totalRevenue FROM Contracts WHERE Status = 'Completed'`),
      query(`SELECT AVG(TotalPrice) as avgContractValue FROM Contracts WHERE Status IN ('Active', 'Completed')`)
    ];
    
    const [
      totalResult,
      activeResult,
      pendingResult,
      completedResult,
      terminatedResult,
      revenueResult,
      avgValueResult
    ] = await Promise.all(statsQueries);
    
    const stats = {
      totalContracts: totalResult[0].total,
      activeContracts: activeResult[0].active,
      pendingContracts: pendingResult[0].pending,
      completedContracts: completedResult[0].completed,
      terminatedContracts: terminatedResult[0].terminated,
      totalRevenue: parseFloat(revenueResult[0].totalRevenue) || 0,
      avgContractValue: parseFloat(avgValueResult[0].avgContractValue) || 0
    };
    
    res.json({ success: true, stats });
  } catch (error) {
    console.error("Error fetching contract statistics:", error);
    res.status(500).json({ error: error.message });
  }
});

// Search contracts
app.get("/api/admin/contracts/search", async (req, res) => {
  try {
    const { q, status, type, startDate, endDate } = req.query;
    
    let searchQuery = `
      SELECT 
        c.ContractId,
        c.CarId,
        c.UserId,
        c.OwnerId,
        c.Type,
        c.StartDate,
        c.EndDate,
        c.PickupLocation,
        c.DropoffLocation,
        c.Deposit,
        c.TotalPrice,
        c.Status,
        c.TXHash,
        cars.CarName,
        cars.Brand,
        cars.ImageURL,
        u_user.FullName as UserName,
        u_user.Email as UserEmail,
        u_owner.FullName as OwnerName,
        u_owner.Email as OwnerEmail
      FROM Contracts c
      LEFT JOIN Cars cars ON c.CarId = cars.CarId
      LEFT JOIN Users u_user ON c.UserId = u_user.UserId
      LEFT JOIN Users u_owner ON c.OwnerId = u_owner.UserId
      WHERE 1=1
    `;
    
    const params = [];
    
    if (q) {
      searchQuery += ` AND (
        c.ContractId LIKE ? OR 
        cars.CarName LIKE ? OR 
        cars.Brand LIKE ? OR
        u_user.FullName LIKE ? OR 
        u_user.Email LIKE ? OR
        u_owner.FullName LIKE ? OR 
        u_owner.Email LIKE ? OR
        c.PickupLocation LIKE ? OR
        c.DropoffLocation LIKE ?
      )`;
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    if (status) {
      searchQuery += ` AND c.Status = ?`;
      params.push(status);
    }
    
    if (type) {
      searchQuery += ` AND c.Type = ?`;
      params.push(type);
    }
    
    if (startDate) {
      searchQuery += ` AND c.StartDate >= ?`;
      params.push(startDate);
    }
    
    if (endDate) {
      searchQuery += ` AND c.EndDate <= ?`;
      params.push(endDate);
    }
    
    searchQuery += ` ORDER BY c.StartDate DESC`;
    
    const contracts = await query(searchQuery, params);
    
    res.json({
      success: true,
      contracts: contracts.map(contract => ({
        ...contract,
        Deposit: parseFloat(contract.Deposit),
        TotalPrice: parseFloat(contract.TotalPrice)
      }))
    });
  } catch (error) {
    console.error("Error searching contracts:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== AUTHENTICATION API ENDPOINTS ====================

// Register endpoint
app.post("/api/auth/register", async (req, res) => {
  try {
    const { fullname, email, password, role, phone } = req.body;

    // Validate required fields
    if (!fullname || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required fields: fullname, email, password" 
      });
    }

    // Check if email already exists
    const existing = await query(`SELECT UserId FROM Users WHERE Email = ? LIMIT 1`, [email]);
    if (existing.length) {
      return res.status(409).json({ 
        success: false, 
        error: "Email already exists" 
      });
    }

    // Generate UserId
    const userId = await generateUserId();
    const passwordHash = hashPassword(password);
    
    // Default role is User if not specified, only allow User or Owner for registration
    const userRole = (role === "Owner") ? "Owner" : "User";

    // Insert new user
    await query(
      `INSERT INTO Users (UserId, FullName, Email, PasswordHash, Role, CreatedAt)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [userId, fullname, email, passwordHash, userRole]
    );

    // Get created user
    const [user] = await query(
      `SELECT UserId, FullName, Email, Role, CreatedAt FROM Users WHERE UserId = ?`,
      [userId]
    );

    res.status(201).json({ 
      success: true, 
      message: "Registration successful",
      user: user
    });
  } catch (error) {
    console.error("Error in registration:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Login endpoint
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing email or password" 
      });
    }

    // Get user by email
    const users = await query(
      `SELECT UserId, FullName, Email, PasswordHash, Role, WalletAddress, AvatarURL, CreatedAt 
       FROM Users WHERE Email = ? LIMIT 1`,
      [email]
    );

    if (!users.length) {
      return res.status(401).json({ 
        success: false, 
        error: "Invalid email or password" 
      });
    }

    const user = users[0];
    const passwordHash = hashPassword(password);

    // Verify password
    if (passwordHash !== user.PasswordHash) {
      return res.status(401).json({ 
        success: false, 
        error: "Invalid email or password" 
      });
    }

    // Remove password hash from response
    delete user.PasswordHash;

    res.json({ 
      success: true, 
      message: "Login successful",
      user: user
    });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get current user (check session)
app.get("/api/auth/me", async (req, res) => {
  try {
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "Not authenticated" 
      });
    }

    const users = await query(
      `SELECT UserId, FullName, Email, Role, WalletAddress, AvatarURL, CreatedAt 
       FROM Users WHERE UserId = ? LIMIT 1`,
      [userId]
    );

    if (!users.length) {
      return res.status(404).json({ 
        success: false, 
        error: "User not found" 
      });
    }

    res.json({ 
      success: true, 
      user: users[0]
    });
  } catch (error) {
    console.error("Error getting current user:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Logout endpoint (client-side will handle clearing localStorage)
app.post("/api/auth/logout", (req, res) => {
  res.json({ 
    success: true, 
    message: "Logout successful" 
  });
});

// ==================== USER WALLET MANAGEMENT API ====================

// Get user wallet info
app.get("/api/users/:userId/wallet", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user's wallet information
    const wallets = await query(
      `SELECT w.WalletId, w.WalletAddress, w.NetWork, w.LastConnected, u.FullName, u.Email
       FROM Wallets w
       LEFT JOIN Users u ON w.UserId = u.UserId 
       WHERE w.UserId = ?
       ORDER BY w.LastConnected DESC
       LIMIT 1`,
      [userId]
    );
    
    if (wallets.length === 0) {
      return res.json({ 
        success: true, 
        wallet: null,
        message: "No wallet connected" 
      });
    }
    
    const wallet = wallets[0];
    
    // Get CPT balance if wallet exists
    let cptBalance = 0;
    if (wallet.WalletAddress) {
      try {
        const balance = await blockchainService.getCPTBalance(wallet.WalletAddress);
        cptBalance = parseFloat(balance);
      } catch (error) {
        console.error('Error getting CPT balance:', error);
      }
    }
    
    res.json({ 
      success: true, 
      wallet: {
        ...wallet,
        CPTBalance: cptBalance
      }
    });
    
  } catch (error) {
    console.error("Error getting user wallet:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Update or create user wallet
app.put("/api/users/:userId/wallet", async (req, res) => {
  try {
    const { userId } = req.params;
    const { walletAddress, network } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: "Wallet address is required"
      });
    }
    
    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: "Invalid wallet address format"
      });
    }
    
    // Check if user exists
    const users = await query(`SELECT UserId FROM Users WHERE UserId = ?`, [userId]);
    if (!users.length) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }
    
    // Update or create wallet
    await upsertPrimaryWallet(userId, walletAddress, network || 'Hardhat');
    
    // Update Users table WalletAddress field for backward compatibility
    await query(
      `UPDATE Users SET WalletAddress = ? WHERE UserId = ?`,
      [walletAddress, userId]
    );
    
    // Get updated wallet info
    const updatedWallet = await query(
      `SELECT WalletId, WalletAddress, NetWork, LastConnected
       FROM Wallets WHERE UserId = ? ORDER BY LastConnected DESC LIMIT 1`,
      [userId]
    );
    
    res.json({
      success: true,
      message: "Wallet updated successfully",
      wallet: updatedWallet[0] || null
    });
    
  } catch (error) {
    console.error("Error updating user wallet:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Check wallet eligibility for rental
app.get("/api/users/:userId/rental-eligibility", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user info
    const users = await query(
      `SELECT UserId, FullName, Email, Role, WalletAddress FROM Users WHERE UserId = ?`,
      [userId]
    );
    
    if (!users.length) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }
    
    const user = users[0];
    const eligibility = {
      eligible: false,
      hasWallet: !!user.WalletAddress,
      cptBalance: 0,
      message: ""
    };
    
    if (!eligibility.hasWallet) {
      eligibility.message = "Please connect your wallet to rent a car";
      return res.json({ success: true, eligibility });
    }
    
    // Check CPT balance
    try {
      const balance = await blockchainService.getCPTBalance(user.WalletAddress);
      eligibility.cptBalance = parseFloat(balance);
      
      if (eligibility.cptBalance > 0) {
        eligibility.eligible = true;
        eligibility.message = "Ready to rent! You can proceed with car rental.";
      } else {
        eligibility.message = "Wallet connected but no CPT balance. You may need to buy tokens.";
      }
    } catch (error) {
      console.error('Error checking CPT balance:', error);
      eligibility.message = "Unable to check wallet balance. Please try again.";
    }
    
    res.json({ success: true, eligibility });
    
  } catch (error) {
    console.error("Error checking rental eligibility:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Update user profile
app.put("/api/users/:userId/profile", async (req, res) => {
  try {
    const { userId } = req.params;
    const { fullName, email, phone, walletAddress } = req.body;
    
    // Validate user exists
    const users = await query(`SELECT UserId FROM Users WHERE UserId = ?`, [userId]);
    if (!users.length) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }
    
    // Prepare update fields
    const updateFields = [];
    const updateValues = [];
    
    if (fullName) {
      updateFields.push("FullName = ?");
      updateValues.push(fullName);
    }
    
    if (email) {
      // Check if email is already taken by another user
      const existingEmail = await query(
        `SELECT UserId FROM Users WHERE Email = ? AND UserId != ?`, 
        [email, userId]
      );
      if (existingEmail.length) {
        return res.status(400).json({
          success: false,
          error: "Email is already taken"
        });
      }
      updateFields.push("Email = ?");
      updateValues.push(email);
    }
    
    if (phone) {
      updateFields.push("Phone = ?");
      updateValues.push(phone);
    }
    
    if (walletAddress) {
      // Validate wallet address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        return res.status(400).json({
          success: false,
          error: "Invalid wallet address format"
        });
      }
      updateFields.push("WalletAddress = ?");
      updateValues.push(walletAddress);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No fields to update"
      });
    }
    
    // Add timestamp and userId
    updateFields.push("UpdatedAt = NOW()");
    updateValues.push(userId);
    
    // Execute update
    const updateQuery = `UPDATE Users SET ${updateFields.join(", ")} WHERE UserId = ?`;
    await query(updateQuery, updateValues);
    
    // If wallet address was updated, also update/create wallet record
    if (walletAddress) {
      await upsertPrimaryWallet(userId, walletAddress, 'Hardhat');
    }
    
    // Return updated user data
    const updatedUser = await query(
      `SELECT UserId, FullName, Email, Role, Phone, WalletAddress, AvatarURL, CreatedAt, UpdatedAt 
       FROM Users WHERE UserId = ?`,
      [userId]
    );
    
    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser[0]
    });
    
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ==================== ONCHAIN CONTRACT API ENDPOINTS ====================

// API để tạo hợp đồng onchain mới
app.post("/api/contracts/onchain/create", async (req, res) => {
  try {
    const {
      contractAddress,
      txHash,
      carId,
      renterUserId,   // UserId trong DB (Uxxx)
      ownerUserId,    // OwnerId trong DB (Uxxx)
      type,           // "Rent" hoặc "Buy"
      startDate,      // optional (ISO string)
      endDate,        // optional
      deposit,
      totalPrice
    } = req.body;

    if (!contractAddress || !txHash || !carId || !renterUserId || !ownerUserId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // generate ContractId similar to generateSequentialId()
    const contractId = await generateSequentialId("Contracts", "ContractId", "CT");

    const sql = `INSERT INTO Contracts (ContractId, CarId, UserId, OwnerId, Type, StartDate, EndDate, Deposit, TotalPrice, Status, TXHash)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const status = "Pending signature";
    await query(sql, [contractId, carId, renterUserId, ownerUserId, type || "Rent", startDate || null, endDate || null, deposit || 0, totalPrice || 0, status, txHash]);

    res.json({ success: true, contractId, contractAddress, txHash });
  } catch (err) {
    console.error("Create onchain contract error:", err);
    res.status(500).json({ error: err.message });
  }
});

// API callback khi hợp đồng onchain đã được ký
app.post("/api/contracts/onchain/signed", async (req, res) => {
  try {
    const { contractAddress, txHash, signerUserId, role } = req.body; // role: "owner" | "user"
    if (!contractAddress || !txHash || !signerUserId || !role) return res.status(400).json({ error: "Missing" });

    // Tìm contract bằng contractAddress hoặc TXHash
    const rows = await query(`SELECT ContractId, Status FROM Contracts WHERE ContractAddress = ? LIMIT 1`, [contractAddress]);
    if (!rows.length) return res.status(404).json({ error: "Contract not found" });

    const contractId = rows[0].ContractId;

    // Lưu một cột field để track (ví dụ thêm OwnerSigned, UserSigned) OR lưu activity
    // Nếu không muốn thêm cột, bạn có thể lưu vào một bảng `contract_events` hoặc update Status text.
    // Ví dụ cập nhật Status tạm thời:
    // await query(`INSERT INTO ContractEvents (ContractId, EventType, TxHash, UserId, CreatedAt) VALUES (?, ?, ?, ?, ?)`, [contractId, role === "owner" ? "OwnerSigned" : "UserSigned", txHash, signerUserId, new Date()]);

    res.json({ success: true, contractId });
  } catch (err) {
    console.error("Signed callback error:", err);
    res.status(500).json({ error: err.message });
  }
});

// API endpoint nhận event AgreementCreated từ listener
app.post("/api/contracts/onchain/created_event", async (req, res) => {
  try {
    const { contractAddress, owner, user, txHash } = req.body;
    if (!contractAddress || !txHash) return res.status(400).json({ error: "Missing contractAddress or txHash" });

    // Cập nhật record contract nếu đã tồn tại bằng TXHash
    const result = await query(`UPDATE Contracts SET ContractAddress = ?, UpdatedAt = NOW() WHERE TXHash = ?`, [contractAddress, txHash]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "No contract found with given TXHash to attach contractAddress" });
    }

    // Ghi event vào ContractEvents để audit
    const rows = await query(`SELECT ContractId FROM Contracts WHERE TXHash = ? LIMIT 1`, [txHash]);
    const contractId = rows.length ? rows[0].ContractId : null;
    if (contractId) {
      // await query(`INSERT INTO ContractEvents (ContractId, EventType, TxHash, UserId, CreatedAt) VALUES (?, ?, ?, ?, ?)`, [contractId, 'AgreementCreated', txHash, owner || null, new Date()]);
    }

    res.json({ success: true, contractAddress, txHash, contractId });
  } catch (err) {
    console.error("Error on created_event:", err);
    res.status(500).json({ error: err.message });
  }
});

// API endpoint nhận event AgreementActivated từ listener
app.post("/api/contracts/onchain/activated", async (req, res) => {
  try {
    const { contractAddress, txHash, startDate, endDate } = req.body; // startDate/endDate are unix timestamps (seconds)
    if (!contractAddress && !txHash) return res.status(400).json({ error: "Missing contractAddress or txHash" });

    const params = [contractAddress, txHash, startDate ? new Date(startDate * 1000) : null, endDate ? new Date(endDate * 1000) : null];

    const updateQuery = `
      UPDATE Contracts
      SET Status = 'Active', StartDate = COALESCE(?, StartDate), EndDate = COALESCE(?, EndDate), UpdatedAt = NOW()
      WHERE ContractAddress = ? OR TXHash = ?
    `;

    const result = await query(updateQuery, [params[2], params[3], contractAddress, txHash]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "No contract found to mark Active" });
    }

    // Insert event
    const rows = await query(`SELECT ContractId FROM Contracts WHERE ContractAddress = ? OR TXHash = ? LIMIT 1`, [contractAddress, txHash]);
    const contractId = rows.length ? rows[0].ContractId : null;
    if (contractId) {
      // await query(`INSERT INTO ContractEvents (ContractId, EventType, TxHash, UserId, CreatedAt) VALUES (?, ?, ?, ?, ?)`, [contractId, 'AgreementActivated', txHash || null, null, new Date()]);
    }

    res.json({ success: true, contractId });
  } catch (err) {
    console.error("Error on activated callback:", err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== RENTAL AGREEMENT CREATION API ====================

// Create rental agreement endpoint
app.post("/api/rental/create", async (req, res) => {
  try {
    const {
      carId,
      contractType, // 'rental' or 'purchase'
      startDate,
      endDate,
      startTime,
      endTime,
      rentalAmount,
      paymentType,     // 'full' or 'quarterly' for purchase
      quarters,        // number of quarters for quarterly payment
      quarterlyAmount, // amount per quarter
      totalPurchasePrice, // total purchase price
      walletAddress,
      note
    } = req.body;

    console.log('Rental creation request:', req.body);

    // Validate required fields
    if (!carId || !contractType || !walletAddress || !rentalAmount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Get car information
    const carQuery = `
      SELECT c.*, u.UserId as OwnerId, u.WalletAddress as OwnerWallet
      FROM Cars c 
      LEFT JOIN Users u ON c.OwnerId = u.UserId 
      WHERE c.CarId = ?
    `;

    const cars = await query(carQuery, [carId]);
    if (!cars.length) {
      return res.status(404).json({
        success: false,
        error: 'Car not found'
      });
    }

    const car = cars[0];
    
    // Calculate amounts based on contract type
    let TotalPrice, rentAmountCPT, durationDays;
    
    if (contractType === 'purchase') {
      // For purchase: handle different payment types
      if (paymentType === 'quarterly' && quarters && quarterlyAmount) {
        // Quarterly payment
        TotalPrice = parseFloat(totalPurchasePrice) || parseFloat(car.PriceBuy);
        rentAmountCPT = parseFloat(quarterlyAmount); // First payment amount
        durationDays = parseInt(quarters) * 90; // quarters * 90 days
      } else {
        // Full payment
        TotalPrice = parseFloat(totalPurchasePrice) || parseFloat(car.PriceBuy);
        rentAmountCPT = TotalPrice; // Full purchase amount
        durationDays = 1; // Purchase is instant
      }
    } else {
      // For rental: use PriceRent * duration
      const pricePerDay = parseFloat(car.PriceRent);
      
      // Calculate rental duration in days
      durationDays = 1; // Default 1 day
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        durationDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
      }
      
      rentAmountCPT = parseFloat(rentalAmount) || (pricePerDay * durationDays);
      TotalPrice = rentAmountCPT; // No deposit for rental anymore
    }
    
    console.log(`Contract calculation: Type=${contractType}, Duration=${durationDays} days, RentAmount=${rentAmountCPT}, Total=${TotalPrice}`);
    if (contractType === 'purchase') {
      console.log(`Payment type: ${paymentType}, Quarters: ${quarters}, QuarterlyAmount: ${quarterlyAmount}`);
    }
    
    // Validate amounts
    if (rentAmountCPT <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid rental amount calculated'
      });
    }
    
    // Get user info by wallet address
    const userQuery = `SELECT UserId FROM Users WHERE WalletAddress = ?`;
    const userResult = await query(userQuery, [walletAddress]);
    
    if (!userResult.length) {
      return res.status(404).json({
        success: false,
        error: 'User not found with this wallet address'
      });
    }

    const userId = userResult[0].UserId;
    
    // Use actual Hardhat owner address instead of fake one from database
    const ownerWallet = car.OwnerWallet && ethers.isAddress(car.OwnerWallet) 
      ? car.OwnerWallet 
      : '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'; // Hardhat account #0
    
    console.log('Owner wallet resolved:', ownerWallet);

    // Create blockchain transaction
    const blockchainParams = {
      userAddress: walletAddress,
      ownerAddress: ownerWallet,
      vehicleId: parseInt(carId.replace('C', '')), // Convert C001 -> 1
      rentAmountCPT: rentAmountCPT,
      depositAmountCPT: 0, // No deposit anymore
      carData: car,
      paymentType: paymentType,
      quarters: quarters,
      quarterlyAmount: quarterlyAmount,
      totalPurchasePrice: totalPurchasePrice
    };

    console.log('Creating blockchain agreement with params:', blockchainParams);

    const blockchainResult = await blockchainService.createRentalAgreement(blockchainParams);

    if (!blockchainResult.success) {
      throw new Error('Failed to create blockchain agreement');
    }

    // Prepare dates
    const startDateTime = startDate && startTime ? 
      new Date(`${startDate}T${startTime}:00`) : null;
    const endDateTime = (endDate && endTime && contractType === 'rental') ? 
      new Date(`${endDate}T${endTime}:00`) : null;

    // Generate contract ID with retry mechanism
    let contractId;
    let insertSuccess = false;
    let retryCount = 0;
    const maxRetries = 5;

    while (!insertSuccess && retryCount < maxRetries) {
      try {
        contractId = await generateSequentialId("Contracts", "ContractId", "CT");
        
        // Insert into database (chỉ sử dụng cột có sẵn)
        const insertQuery = `
          INSERT INTO Contracts (
            ContractId, CarId, UserId, OwnerId, Type, 
            StartDate, EndDate, TotalPrice, 
            Status, TXHash
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const contractStatus = 'Pending'; // All contracts start as Pending until owner confirms
        
        await query(insertQuery, [
          contractId,
          carId,
          userId,
          car.OwnerId,
          contractType === 'purchase' ? 'Buy' : 'Rent',
          startDateTime ? startDateTime.toISOString().split('T')[0] : null,
          endDateTime ? endDateTime.toISOString().split('T')[0] : null,
          TotalPrice,
          contractStatus,
          blockchainResult.txHash
        ]);
        
        insertSuccess = true;
        console.log(`Contract ${contractId} inserted successfully`);
        
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          retryCount++;
          console.log(`Duplicate key error for ${contractId}, retrying... (${retryCount}/${maxRetries})`);
          
          if (retryCount >= maxRetries) {
            throw new Error(`Failed to insert contract after ${maxRetries} attempts due to duplicate key`);
          }
        } else {
          throw error; // Re-throw non-duplicate errors
        }
      }
    }

    // Lưu thông tin payment vào note nếu là quarterly payment
    if (contractType === 'purchase' && paymentType === 'quarterly' && quarters && quarterlyAmount) {
      const paymentNote = JSON.stringify({
        paymentType: paymentType,
        quarters: quarters,
        quarterlyAmount: quarterlyAmount,
        totalPurchasePrice: totalPurchasePrice,
        startDate: startDateTime ? startDateTime.toISOString() : null
      });
      
      console.log(`Quarterly payment info saved for contract ${contractId}:`, paymentNote);
    }

    // ===== TẠO PDF CONTRACT VÀ UPLOAD LÊN PINATA =====
    let pdfInfo = null;
    let metadataInfo = null;

    try {
      console.log('Generating contract PDF...');
      
      // Chuẩn bị dữ liệu cho PDF
      const contractPDFData = {
        contractId: contractId,
        contractType: contractType,
        contractAddress: blockchainResult.agreementAddress,
        txHash: blockchainResult.txHash,
        carId: carId,
        carName: car.CarName,
        carBrand: car.Brand,
        carDescription: car.Description,
        totalPrice: TotalPrice,
        rentalAmount: rentAmountCPT,
        startDate: startDate,
        endDate: endDate,
        paymentType: paymentType,
        quarters: quarters,
        quarterlyAmount: quarterlyAmount,
        totalPurchasePrice: totalPurchasePrice,
        userWallet: walletAddress,
        ownerWallet: ownerWallet,
        createdAt: new Date().toISOString()
      };

      // Tạo PDF
      const pdfResult = await pdfGenerator.generateContract(contractPDFData);
      console.log('PDF generated:', pdfResult);

      // Upload PDF lên Pinata
      pdfInfo = await pinataService.uploadContractPDF(pdfResult.filePath, {
        contractId: contractId,
        contractType: contractType,
        carId: carId,
        contractAddress: blockchainResult.agreementAddress,
        txHash: blockchainResult.txHash
      });

      // Upload metadata lên Pinata
      const contractMetadata = {
        contractId: contractId,
        contractType: contractType,
        carInfo: {
          carId: carId,
          carName: car.CarName,
          brand: car.Brand,
          description: car.Description
        },
        blockchain: {
          contractAddress: blockchainResult.agreementAddress,
          txHash: blockchainResult.txHash,
          blockNumber: blockchainResult.blockNumber,
          gasUsed: blockchainResult.gasUsed
        },
        payment: {
          totalPrice: TotalPrice,
          rentalAmount: rentAmountCPT,
          paymentType: paymentType,
          quarters: quarters,
          quarterlyAmount: quarterlyAmount,
          totalPurchasePrice: totalPurchasePrice
        },
        parties: {
          userWallet: walletAddress,
          ownerWallet: ownerWallet,
          userId: userId,
          ownerId: car.OwnerId
        },
        dates: {
          startDate: startDate,
          endDate: endDate,
          createdAt: new Date().toISOString()
        },
        pdf: {
          ipfsHash: pdfInfo.ipfsHash,
          pinataUrl: pdfInfo.pinataUrl,
          fileName: pdfInfo.fileName
        }
      };

      metadataInfo = await pinataService.uploadContractMetadata(contractMetadata);

      // Cleanup temporary PDF file
      ContractPDFGenerator.cleanup(pdfResult.filePath);

      console.log('Contract PDF and metadata uploaded to IPFS:', {
        pdf: pdfInfo,
        metadata: metadataInfo
      });

    } catch (pdfError) {
      console.error('Error generating/uploading PDF:', pdfError);
      // Continue without failing the whole contract creation
    }

    // Note: ContractEvents table will be handled later when payment system is implemented
    // await query(`
    //   INSERT INTO ContractEvents (ContractId, EventType, TxHash, UserId, CreatedAt) 
    //   VALUES (?, ?, ?, ?, ?)
    // `, [contractId, 'ContractCreated', blockchainResult.txHash, userId, new Date()]);

    // Return success response
    res.json({
      success: true,
      data: {
        contractId,
        agreementAddress: blockchainResult.agreementAddress,
        txHash: blockchainResult.txHash,
        blockNumber: blockchainResult.blockNumber,
        gasUsed: blockchainResult.gasUsed,
        status: 'Pending', // All contracts start as Pending until owner confirms
        message: 'Rental agreement created successfully on blockchain',
        // PDF and IPFS info
        pdf: pdfInfo ? {
          ipfsHash: pdfInfo.ipfsHash,
          pinataUrl: pdfInfo.pinataUrl,
          ipfsUrl: pdfInfo.ipfsUrl,
          fileName: pdfInfo.fileName,
          size: pdfInfo.size
        } : null,
        metadata: metadataInfo ? {
          ipfsHash: metadataInfo.ipfsHash,
          pinataUrl: metadataInfo.pinataUrl,
          ipfsUrl: metadataInfo.ipfsUrl
        } : null
      }
    });

  } catch (error) {
    console.error('Rental creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Get CPT balance for a wallet
app.get("/api/wallet/cpt-balance/:address", async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required'
      });
    }

    const balance = await blockchainService.getCPTBalance(address);
    
    res.json({
      success: true,
      balance,
      address
    });
    
  } catch (error) {
    console.error('CPT balance error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get agreement info from blockchain
app.get("/api/contracts/agreement/:address", async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Agreement address is required'
      });
    }

    const agreementInfo = await blockchainService.getAgreementInfo(address);
    
    res.json({
      success: true,
      agreement: agreementInfo
    });
    
  } catch (error) {
    console.error('Agreement info error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Simulate owner signature for testing
app.post("/api/rental/sign-as-owner", async (req, res) => {
  try {
    const { contractAddress } = req.body;
    
    if (!contractAddress) {
      return res.status(400).json({
        success: false,
        error: 'Contract address is required'
      });
    }

    console.log('Simulating owner signature for contract:', contractAddress);

    // Use the blockchain service to sign as owner
    const result = await blockchainService.signAgreementAsOwner(contractAddress);

    res.json({
      success: true,
      txHash: result.txHash,
      gasUsed: result.gasUsed,
      blockNumber: result.blockNumber
    });

  } catch (error) {
    console.error('Error simulating owner signature:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===== OWNER CONTRACT CONFIRMATION ENDPOINTS =====

// Create contract request (without payment)
app.post("/api/contracts/create-request", async (req, res) => {
  try {
    const { 
      carId, 
      userId, 
      contractType, 
      startDate, 
      endDate, 
      startTime, 
      endTime, 
      totalPrice, 
      paymentType,
      quarters,
      quarterlyAmount,
      totalPurchasePrice,
      note 
    } = req.body;

    console.log('Creating contract request:', req.body);

    // Validate required fields
    if (!carId || !userId || !contractType || !startDate || !totalPrice) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: carId, userId, contractType, startDate, totalPrice'
      });
    }

    // Validate contract type - accept both 'rental'/'rent' and 'purchase'
    const normalizedType = contractType.toLowerCase();
    if (!['rent', 'rental', 'purchase'].includes(normalizedType)) {
      return res.status(400).json({
        success: false,
        error: 'Contract type must be "rental", "rent", or "purchase"'
      });
    }

    // Normalize type for database storage
    const dbContractType = normalizedType === 'rental' ? 'rent' : normalizedType;

    // Validate end date for rental contracts
    if (['rent', 'rental'].includes(normalizedType) && !endDate) {
      return res.status(400).json({
        success: false,
        error: 'End date is required for rental contracts'
      });
    }

    // Get car information to find owner
    const cars = await query(
      `SELECT CarId, OwnerId, CarName, Brand, PriceRent, PriceBuy 
       FROM Cars WHERE CarId = ? AND Status = 'Available'`,
      [carId]
    );

    if (!cars.length) {
      return res.status(404).json({
        success: false,
        error: 'Car not found or not available'
      });
    }

    const car = cars[0];

    // Prepare additional data for purchase contracts
    let additionalNote = note || '';
    if (dbContractType === 'purchase') {
      if (paymentType === 'quarterly' && quarters && quarterlyAmount) {
        additionalNote += `\nPayment Plan: ${quarters} quarters, ${quarterlyAmount} CPT per quarter, Total: ${totalPurchasePrice || totalPrice} CPT`;
      } else if (paymentType === 'full') {
        additionalNote += `\nPayment: Full amount (${totalPurchasePrice || totalPrice} CPT)`;
      }
    }

    // Generate contract ID with proper format (5 characters max)
    const contractId = await generateContractId();

    // Create contract with Pending status - wrap in transaction
    await query('START TRANSACTION');
    
    try {
      const insertResult = await query(
        `INSERT INTO Contracts (
          ContractId, CarId, UserId, OwnerId, Type, StartDate, EndDate, 
          StartTime, EndTime, TotalPrice, Note, Status, CreatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', NOW())`,
        [
          contractId,
          carId,
          userId,
          car.OwnerId,
          dbContractType, // Use normalized type
          startDate,
          endDate || null,
          startTime || null,
          endTime || null,
          totalPrice,
          additionalNote || null
        ]
      );

      console.log('Contract created successfully:', contractId);

      // Create notification for owner  
      const notificationId = `NOT${String(Date.now()).slice(-7)}`; // NOT + 7 digits = 10 chars max
      await query(
        `INSERT INTO ContractNotifications (
          NotificationId, ContractId, UserId, Type, Title, Message, IsRead, CreatedAt
        ) VALUES (?, ?, ?, 'pending_confirmation', ?, ?, 0, NOW())`,
        [
          notificationId,
          contractId,
          car.OwnerId,
          'New Contract Requires Confirmation',
          `A new ${dbContractType} contract for ${car.CarName} (${car.Brand}) requires your confirmation. Total: $${totalPrice}`
        ]
      );

      // Commit transaction
      await query('COMMIT');

      res.json({
        success: true,
        message: 'Contract request created successfully',
        contractId: contractId,
        status: 'Pending',
        carName: car.CarName,
        ownerNotified: true
      });

    } catch (innerError) {
      // Rollback transaction on error
      await query('ROLLBACK');
      throw innerError;
    }

  } catch (error) {
    console.error('Error creating contract request:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Owner confirm pending contract
app.post("/api/contracts/:contractId/confirm", async (req, res) => {
  try {
    const { contractId } = req.params;
    const { ownerWalletAddress } = req.body;

    if (!contractId || !ownerWalletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Contract ID and owner wallet address are required'
      });
    }

    // Get contract details
    const contracts = await query(
      `SELECT c.*, car.CarName, u.FullName as UserName 
       FROM Contracts c 
       LEFT JOIN Cars car ON c.CarId = car.CarId 
       LEFT JOIN Users u ON c.UserId = u.UserId 
       WHERE c.ContractId = ? AND c.Status = 'Pending'`,
      [contractId]
    );

    if (contracts.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pending contract not found'
      });
    }

    const contract = contracts[0];

    // Update contract status to Confirmed (waiting for user payment)
    await query(
      `UPDATE Contracts 
       SET Status = 'Confirmed', 
           OwnerConfirmAt = NOW() 
       WHERE ContractId = ?`,
      [contractId]
    );

    // Create notification for user about payment
    const notificationId = `NOT${String(Date.now()).slice(-7)}`;
    await query(
      `INSERT INTO ContractNotifications (
        NotificationId, ContractId, UserId, Type, Title, Message, IsRead, CreatedAt
      ) VALUES (?, ?, ?, 'payment_due', ?, ?, 0, NOW())`,
      [
        notificationId,
        contractId,
        contract.UserId,
        'Payment Required',
        `Your ${contract.Type} contract for ${contract.CarName} has been confirmed by the owner. Please make payment to activate the contract.`
      ]
    );

    res.json({
      success: true,
      message: 'Contract confirmed successfully. User can now make payment.',
      contractId: contractId,
      newStatus: 'Confirmed'
    });

  } catch (error) {
    console.error('Error confirming contract:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// User payment for confirmed contract
app.post("/api/contracts/:contractId/pay", async (req, res) => {
  try {
    const { contractId } = req.params;
    const { userWalletAddress, txHash, paidAmount } = req.body;

    if (!contractId || !userWalletAddress || !txHash || !paidAmount) {
      return res.status(400).json({
        success: false,
        error: 'Contract ID, wallet address, transaction hash, and paid amount are required'
      });
    }

    // Get contract details
    const contracts = await query(
      `SELECT c.*, car.CarName, car.OwnerId 
       FROM Contracts c 
       LEFT JOIN Cars car ON c.CarId = car.CarId 
       WHERE c.ContractId = ? AND c.Status = 'Confirmed'`,
      [contractId]
    );

    if (contracts.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Confirmed contract not found'
      });
    }

    const contract = contracts[0];

    // Update contract with payment info
    await query(
      `UPDATE Contracts 
       SET Status = 'Paid', 
           PaymentTXHash = ?,
           PaymentCompletedAt = NOW(),
           PaidAmount = ?
       WHERE ContractId = ?`,
      [txHash, paidAmount, contractId]
    );

    // Create notification for owner about payment received
    const notificationId = `NOT${String(Date.now()).slice(-7)}`;
    await query(
      `INSERT INTO ContractNotifications (
        NotificationId, ContractId, UserId, Type, Title, Message, IsRead, CreatedAt
      ) VALUES (?, ?, ?, 'payment_received', ?, ?, 0, NOW())`,
      [
        notificationId,
        contractId,
        contract.OwnerId,
        'Payment Received',
        `Payment of $${paidAmount} received for ${contract.CarName}. Please confirm to activate the contract.`
      ]
    );

    res.json({
      success: true,
      message: 'Payment successful. Waiting for owner confirmation.',
      contractId: contractId,
      newStatus: 'Paid',
      txHash: txHash,
      paidAmount: paidAmount
    });

  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Owner final confirmation via MetaMask to activate contract
app.post("/api/contracts/:contractId/activate", async (req, res) => {
  try {
    const { contractId } = req.params;
    const { ownerWalletAddress, txHash } = req.body;

    if (!contractId || !ownerWalletAddress || !txHash) {
      return res.status(400).json({
        success: false,
        error: 'Contract ID, owner wallet address, and transaction hash are required'
      });
    }

    // Get contract details
    const contracts = await query(
      `SELECT c.*, car.CarName, u.FullName as UserName 
       FROM Contracts c 
       LEFT JOIN Cars car ON c.CarId = car.CarId 
       LEFT JOIN Users u ON c.UserId = u.UserId 
       WHERE c.ContractId = ? AND c.Status = 'Paid'`,
      [contractId]
    );

    if (contracts.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Paid contract not found'
      });
    }

    const contract = contracts[0];

    // Update contract status to Active
    await query(
      `UPDATE Contracts 
       SET Status = 'Active', 
           OwnerConfirmTXHash = ?
       WHERE ContractId = ?`,
      [txHash, contractId]
    );

    // Update car status to rented/sold
    const carStatus = contract.Type === 'purchase' ? 'Sold' : 'Rented';
    await query(
      `UPDATE Cars SET Status = ? WHERE CarId = ?`,
      [carStatus, contract.CarId]
    );

    // Create notification for user about contract activation
    const notificationId = `NOT${String(Date.now()).slice(-7)}`;
    await query(
      `INSERT INTO ContractNotifications (
        NotificationId, ContractId, UserId, Type, Title, Message, IsRead, CreatedAt
      ) VALUES (?, ?, ?, 'contract_completed', ?, ?, 0, NOW())`,
      [
        notificationId,
        contractId,
        contract.UserId,
        'Contract Active',
        `Your ${contract.Type} contract for ${contract.CarName} is now active! You can start using the vehicle.`
      ]
    );

    res.json({
      success: true,
      message: 'Contract activated successfully!',
      contractId: contractId,
      newStatus: 'Active',
      carName: contract.CarName,
      carStatus: carStatus
    });

  } catch (error) {
    console.error('Error activating contract:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// User complete payment
app.post("/api/contracts/:contractId/payment", async (req, res) => {
  try {
    const { contractId } = req.params;
    const { userWalletAddress, txHash, paymentAmount } = req.body;

    if (!contractId || !userWalletAddress || !txHash) {
      return res.status(400).json({
        success: false,
        error: 'Contract ID, wallet address, and transaction hash are required'
      });
    }

    // Get contract details
    const contracts = await query(
      `SELECT * FROM Contracts WHERE ContractId = ? AND Status = 'Active'`,
      [contractId]
    );

    if (contracts.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Active contract not found'
      });
    }

    const contract = contracts[0];

    // Verify payment amount matches contract total
    const expectedAmount = parseFloat(contract.TotalPrice);
    const paidAmount = parseFloat(paymentAmount);

    if (Math.abs(expectedAmount - paidAmount) > 0.001) { // Allow small floating point differences
      return res.status(400).json({
        success: false,
        error: `Payment amount (${paidAmount}) does not match contract total (${expectedAmount})`
      });
    }

    // Update contract status to Completed
    await query(
      `UPDATE Contracts 
       SET Status = 'Completed',
           PaymentTXHash = ?,
           PaymentCompletedAt = NOW(),
           PaidAmount = ?
       WHERE ContractId = ?`,
      [txHash, paidAmount, contractId]
    );

    res.json({
      success: true,
      message: 'Payment completed successfully',
      contractId: contractId,
      newStatus: 'Completed',
      paidAmount: paidAmount
    });

  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Quarterly payment endpoint for rental contracts
app.post("/api/contracts/:contractId/quarterly-payment", async (req, res) => {
  try {
    const { contractId } = req.params;
    const { userWalletAddress, txHash, paymentAmount, quarter } = req.body;

    // Validate required fields
    if (!userWalletAddress || !txHash || !paymentAmount || !quarter) {
      return res.status(400).json({
        success: false,
        error: 'Missing required payment information'
      });
    }

    // Get contract details
    const contracts = await query(
      `SELECT * FROM Contracts WHERE ContractId = ?`,
      [contractId]
    );

    if (!contracts.length) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      });
    }

    const contract = contracts[0];

    // Verify contract is active
    if (contract.Status !== 'Active') {
      return res.status(400).json({
        success: false,
        error: 'Contract must be active for quarterly payments'
      });
    }

    // Record quarterly payment in database
    await query(
      `INSERT INTO QuarterlyPayments (ContractId, Quarter, PaymentAmount, TXHash, UserWalletAddress, PaymentDate)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [contractId, quarter, paymentAmount, txHash, userWalletAddress]
    );

    // Update contract with latest payment info
    await query(
      `UPDATE Contracts SET 
         LastPaymentTXHash = ?,
         LastPaymentDate = NOW(),
         LastPaymentAmount = ?
       WHERE ContractId = ?`,
      [txHash, paymentAmount, contractId]
    );

    res.json({
      success: true,
      message: `Quarterly payment ${quarter}/4 completed successfully`,
      contractId: contractId,
      quarter: quarter,
      paymentAmount: paymentAmount,
      txHash: txHash
    });

  } catch (error) {
    console.error('Error processing quarterly payment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get quarterly payment history for a contract
app.get("/api/contracts/:contractId/quarterly-payments", async (req, res) => {
  try {
    const { contractId } = req.params;

    // Get quarterly payments
    const payments = await query(
      `SELECT * FROM QuarterlyPayments 
       WHERE ContractId = ? 
       ORDER BY Quarter ASC`,
      [contractId]
    );

    // Get contract details to calculate total expected payments
    const contracts = await query(
      `SELECT TotalPrice, StartDate, EndDate, Type FROM Contracts WHERE ContractId = ?`,
      [contractId]
    );

    if (!contracts.length) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      });
    }

    const contract = contracts[0];
    const totalPrice = parseFloat(contract.TotalPrice);
    const quarterlyAmount = totalPrice / 4;

    // Calculate payment status
    const paymentStatus = {
      totalQuarters: 4,
      paidQuarters: payments.length,
      totalExpected: totalPrice,
      totalPaid: payments.reduce((sum, payment) => sum + parseFloat(payment.PaymentAmount), 0),
      quarterlyAmount: quarterlyAmount,
      nextQuarter: payments.length < 4 ? payments.length + 1 : null,
      isComplete: payments.length === 4
    };

    res.json({
      success: true,
      payments: payments,
      status: paymentStatus
    });

  } catch (error) {
    console.error('Error getting quarterly payments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get pending contracts for owner
app.get("/api/owners/:ownerId/pending-contracts", async (req, res) => {
  try {
    const { ownerId } = req.params;

    const pendingContracts = await query(
      `SELECT c.*, car.CarName, car.Brand, car.ImageURL,
              u.FullName as UserName, u.Email as UserEmail
       FROM Contracts c
       LEFT JOIN Cars car ON c.CarId = car.CarId
       LEFT JOIN Users u ON c.UserId = u.UserId
       WHERE c.OwnerId = ? AND c.Status = 'Pending'
       ORDER BY c.CreatedAt DESC`,
      [ownerId]
    );

    res.json({
      success: true,
      contracts: pendingContracts
    });

  } catch (error) {
    console.error('Error fetching pending contracts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


app.get('/api/payment/schedule/:contractId', async (req, res) => {
  try {
    const { contractId } = req.params;
    
    const contract = await query(`
      SELECT * FROM Contracts WHERE ContractId = ?
    `, [contractId]);

    if (!contract.length) {
      return res.status(404).json({ success: false, error: 'Contract not found' });
    }

    const contractData = contract[0];

    // Get payment history
    const payments = await query(`
      SELECT * FROM Payments 
      WHERE ContractId = ? 
      ORDER BY PaymentDate DESC
    `, [contractId]);

    // Calculate payment schedule
    const paymentSchedule = [];
    if (contractData.Status === 'Active' && contractData.Type === 'Rent') {
      const intervalDays = contractData.PaymentIntervalDays || 30;
      const startDate = new Date(contractData.StartDate);
      const endDate = new Date(contractData.EndDate);
      
      let currentDate = new Date(startDate);
      let paymentNumber = 1;
      
      while (currentDate <= endDate) {
        const dueDate = new Date(currentDate);
        dueDate.setDate(dueDate.getDate() + intervalDays);
        
        const isPaid = payments.some(p => 
          Math.abs(new Date(p.PaymentDate) - dueDate) < 24 * 60 * 60 * 1000
        );
        
        paymentSchedule.push({
          paymentNumber,
          dueDate: dueDate.toISOString(),
          amount: contractData.TotalPrice - contractData.Deposit,
          status: dueDate < new Date() ? (isPaid ? 'Paid' : 'Overdue') : 'Pending',
          isPaid
        });
        
        currentDate = dueDate;
        paymentNumber++;
      }
    }

    res.json({
      success: true,
      contract: contractData,
      payments,
      paymentSchedule
    });

  } catch (error) {
    console.error('Error getting payment schedule:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Make periodic payment
app.post('/api/payment/make/:contractId', async (req, res) => {
  try {
    const { contractId } = req.params;
    const { userAddress } = req.body;

    const contract = await query(`
      SELECT * FROM Contracts WHERE ContractId = ?
    `, [contractId]);

    if (!contract.length) {
      return res.status(404).json({ success: false, error: 'Contract not found' });
    }

    const contractData = contract[0];

    if (contractData.Status !== 'Active') {
      return res.status(400).json({ success: false, error: 'Contract not active' });
    }

    // Call blockchain to make payment
    const result = await blockchainService.makePayment(contractData.ContractAddress, userAddress);

    // Record payment in database
    const paymentId = await generateSequentialId("Payments", "PaymentId", "PAY");
    
    await query(`
      INSERT INTO Payments (
        PaymentId, ContractId, Amount, PaymentDate, TXHash, 
        PaymentMethod, Status, CreatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      paymentId,
      contractId,
      contractData.TotalPrice - contractData.Deposit,
      new Date(),
      result.txHash,
      'CPT',
      'Completed',
      new Date()
    ]);

    res.json({
      success: true,
      paymentId,
      txHash: result.txHash,
      gasUsed: result.gasUsed,
      message: 'Payment completed successfully'
    });

  } catch (error) {
    console.error('Error making payment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check overdue payments
app.get('/api/payment/overdue/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const overdueContracts = await query(`
      SELECT c.*, 
        DATEDIFF(NOW(), c.NextPaymentDue) as DaysOverdue
      FROM Contracts c
      WHERE c.UserId = ? 
        AND c.Status = 'Active' 
        AND c.Type = 'Rent'
        AND c.NextPaymentDue < NOW()
      ORDER BY DaysOverdue DESC
    `, [userId]);

    res.json({
      success: true,
      overdueContracts,
      totalOverdue: overdueContracts.length
    });

  } catch (error) {
    console.error('Error checking overdue payments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user contracts for My Contracts page
app.get('/api/users/:userId/contracts', async (req, res) => {
  try {
    const { userId } = req.params;
    const { owner } = req.query; // Check if requesting as owner
    
    let whereClause = '';
    let queryParams = [];
    
    if (owner === 'true') {
      // Get contracts where user is the owner
      whereClause = 'WHERE c.OwnerId = ?';
      queryParams = [userId];
    } else {
      // Get contracts where user is the renter OR owner (default behavior)
      whereClause = 'WHERE c.UserId = ? OR c.OwnerId = ?';
      queryParams = [userId, userId];
    }
    
    // Get contracts where user is either renter or owner
    const contracts = await query(`
      SELECT 
        c.*,
        car.CarName,
        car.Brand,
        car.ModelYear,
        car.ImageURL as CarImageURL,
        renter.FullName as RenterName,
        renter.Email as RenterEmail,
        owner.FullName as OwnerName,
        owner.Email as OwnerEmail
      FROM Contracts c
      LEFT JOIN Cars car ON c.CarId = car.CarId
      LEFT JOIN Users renter ON c.UserId = renter.UserId
      LEFT JOIN Users owner ON c.OwnerId = owner.UserId
      ${whereClause}
      ORDER BY c.StartDate DESC
    `, queryParams);

    // Calculate statistics
    const stats = {
      total: contracts.length,
      active: contracts.filter(c => c.Status?.toLowerCase() === 'active').length,
      pending: contracts.filter(c => c.Status?.toLowerCase() === 'pending').length,
      completed: contracts.filter(c => c.Status?.toLowerCase() === 'completed').length,
      terminated: contracts.filter(c => c.Status?.toLowerCase() === 'terminated').length
    };

    res.json({
      success: true,
      contracts,
      stats
    });

  } catch (error) {
    console.error('Error fetching user contracts:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      contracts: [],
      stats: { total: 0, active: 0, pending: 0, completed: 0, terminated: 0 }
    });
  }
});

// ===== CONTRACT PDF ENDPOINTS =====

// Download contract PDF
app.get("/api/contracts/:contractId/download-pdf", async (req, res) => {
  try {
    const { contractId } = req.params;
    
    // Get contract info
    const contractQuery = `
      SELECT c.*, car.CarName, car.Brand, car.Description
      FROM Contracts c
      LEFT JOIN Cars car ON c.CarId = car.CarId
      WHERE c.ContractId = ?
    `;
    const contracts = await query(contractQuery, [contractId]);
    
    if (!contracts.length) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      });
    }

    const contract = contracts[0];

    // Try to find PDF files for this contract on Pinata
    const contractFiles = await pinataService.listContractFiles(contractId);
    const pdfFile = contractFiles.find(file => 
      file.keyvalues?.fileType === 'contract-pdf' && 
      file.keyvalues?.contractId === contractId
    );

    if (pdfFile) {
      // Redirect to Pinata URL
      const downloadUrl = pinataService.getPublicUrl(pdfFile.ipfs_pin_hash);
      return res.redirect(downloadUrl);
    } else {
      // Generate PDF on-the-fly if not found
      console.log('PDF not found on IPFS, generating new one...');
      
      const contractPDFData = {
        contractId: contract.ContractId,
        contractType: contract.Type === 'Buy' ? 'purchase' : 'rental',
        contractAddress: 'N/A', // Historical contract may not have this
        txHash: contract.TXHash || 'N/A',
        carId: contract.CarId,
        carName: contract.CarName,
        carBrand: contract.Brand,
        carDescription: contract.Description,
        totalPrice: contract.TotalPrice,
        rentalAmount: contract.TotalPrice,
        startDate: contract.StartDate,
        endDate: contract.EndDate,
        userWallet: 'N/A',
        ownerWallet: 'N/A',
        createdAt: new Date().toISOString()
      };

      const pdfResult = await pdfGenerator.generateContract(contractPDFData);
      
      // Send file and cleanup
      res.download(pdfResult.filePath, pdfResult.fileName, (err) => {
        ContractPDFGenerator.cleanup(pdfResult.filePath);
        if (err) {
          console.error('Error sending PDF:', err);
        }
      });
    }

  } catch (error) {
    console.error('Error downloading contract PDF:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get contract with IPFS info
app.get("/api/contracts/:contractId/ipfs-info", async (req, res) => {
  try {
    const { contractId } = req.params;
    
    // Get contract info
    const contractQuery = `
      SELECT c.*, car.CarName, car.Brand
      FROM Contracts c
      LEFT JOIN Cars car ON c.CarId = car.CarId
      WHERE c.ContractId = ?
    `;
    const contracts = await query(contractQuery, [contractId]);
    
    if (!contracts.length) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      });
    }

    const contract = contracts[0];

    // Get IPFS files for this contract
    const contractFiles = await pinataService.listContractFiles(contractId);
    
    const pdfFile = contractFiles.find(file => 
      file.keyvalues?.fileType === 'contract-pdf'
    );
    
    const metadataFile = contractFiles.find(file => 
      file.keyvalues?.fileType === 'contract-metadata'
    );

    res.json({
      success: true,
      contract: {
        ContractId: contract.ContractId,
        CarName: `${contract.CarName} (${contract.Brand})`,
        Type: contract.Type,
        TotalPrice: contract.TotalPrice,
        Status: contract.Status,
        StartDate: contract.StartDate,
        EndDate: contract.EndDate,
        TXHash: contract.TXHash
      },
      ipfs: {
        pdf: pdfFile ? {
          ipfsHash: pdfFile.ipfs_pin_hash,
          url: pinataService.getPublicUrl(pdfFile.ipfs_pin_hash),
          fileName: pdfFile.metadata?.name || 'contract.pdf',
          size: pdfFile.size,
          createdAt: pdfFile.date_pinned
        } : null,
        metadata: metadataFile ? {
          ipfsHash: metadataFile.ipfs_pin_hash,
          url: pinataService.getPublicUrl(metadataFile.ipfs_pin_hash),
          size: metadataFile.size,
          createdAt: metadataFile.date_pinned
        } : null
      }
    });

  } catch (error) {
    console.error('Error getting contract IPFS info:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===== QUARTERLY PAYMENT MANAGEMENT =====

// Get contract info with quarterly payment details
app.get("/api/contracts/:contractId/payment-info", async (req, res) => {
  try {
    const { contractId } = req.params;
    
    if (!contractId) {
      return res.status(400).json({
        success: false,
        error: 'Contract ID is required'
      });
    }

    // Get contract info
    const contractQuery = `
      SELECT c.*, car.CarName, car.Brand, car.PriceBuy
      FROM Contracts c
      LEFT JOIN Cars car ON c.CarId = car.CarId
      WHERE c.ContractId = ?
    `;
    const contracts = await query(contractQuery, [contractId]);
    
    if (!contracts.length) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      });
    }

    const contract = contracts[0];
    
    res.json({
      success: true,
      contract: {
        ContractId: contract.ContractId,
        CarName: `${contract.CarName} (${contract.Brand})`,
        Type: contract.Type,
        TotalPrice: contract.TotalPrice,
        PurchasePrice: contract.PriceBuy,
        Status: contract.Status,
        StartDate: contract.StartDate,
        EndDate: contract.EndDate,
        TXHash: contract.TXHash
      }
    });

  } catch (error) {
    console.error('Payment info error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update contract status (for quarterly payment completion)
app.post("/api/contracts/:contractId/complete-payment", async (req, res) => {
  try {
    const { contractId } = req.params;
    const { txHash } = req.body;
    
    if (!contractId) {
      return res.status(400).json({
        success: false,
        error: 'Contract ID is required'
      });
    }

    // Update contract status to completed
    const updateQuery = `
      UPDATE Contracts 
      SET Status = 'Completed', TXHash = COALESCE(?, TXHash)
      WHERE ContractId = ? AND Type = 'Buy'
    `;
    
    const result = await query(updateQuery, [txHash || null, contractId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found or not a purchase contract'
      });
    }

    res.json({
      success: true,
      message: 'Contract completed successfully',
      contractId,
      status: 'Completed'
    });

  } catch (error) {
    console.error('Complete payment error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
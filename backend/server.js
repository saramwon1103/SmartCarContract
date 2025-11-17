import express from "express";
import mysql from "mysql2";
import cors from "cors";
import crypto from "crypto";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Support form data

// SỬA DÒNG NÀY: dùng createConnection + new
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "CarRentalDApp"
});

db.connect(err => {
  if (err) return console.error("MySQL connection error:", err);
  console.log("Connected to MySQL database!");
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
  if (!rows.length || !rows[0].id) {
    return `${prefix}${String(1).padStart(padLength, "0")}`;
  }
  const match = rows[0].id.match(/\d+/);
  const nextNum = match ? parseInt(match[0], 10) + 1 : 1;
  return `${prefix}${String(nextNum).padStart(padLength, "0")}`;
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
      SELECT SUM(TotalAmount) as revenue 
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
        c.TotalAmount as amount,
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
        c.TotalAmount as totalPrice,
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
        c.TotalAmount,
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
        TotalAmount: parseFloat(contract.TotalAmount),
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
        TotalAmount: parseFloat(contract.TotalAmount),
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
      query(`SELECT SUM(TotalAmount) as totalRevenue FROM Contracts WHERE Status = 'Completed'`),
      query(`SELECT AVG(TotalAmount) as avgContractValue FROM Contracts WHERE Status IN ('Active', 'Completed')`)
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
        c.TotalAmount,
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
        TotalAmount: parseFloat(contract.TotalAmount)
      }))
    });
  } catch (error) {
    console.error("Error searching contracts:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
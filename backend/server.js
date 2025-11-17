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

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
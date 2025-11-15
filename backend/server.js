import express from "express";
import mysql from "mysql2";
import cors from "cors";

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
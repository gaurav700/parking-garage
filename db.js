// db.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./garage.db'); // internal file for ProjectIDX

// Create tables if not exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS garages (
    id INTEGER PRIMARY KEY,
    name TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS spots (
    id INTEGER PRIMARY KEY,
    garage_id INTEGER,
    spot_number INTEGER,
    is_occupied INTEGER DEFAULT 0,
    type TEXT DEFAULT 'car',
    FOREIGN KEY (garage_id) REFERENCES garages(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS reservations (
    id TEXT PRIMARY KEY,
    garage_id INTEGER,
    spot_id INTEGER,
    start_time TEXT,
    end_time TEXT,
    FOREIGN KEY (garage_id) REFERENCES garages(id),
    FOREIGN KEY (spot_id) REFERENCES spots(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS users (
    email TEXT PRIMARY KEY,
    password TEXT,
    user_id TEXT
  )`);

  // Populate garages and spots if empty
  db.get(`SELECT COUNT(*) as count FROM garages`, (err, row) => {
    if (row.count === 0) {
      for (let g = 0; g < 3; g++) {
        db.run(`INSERT INTO garages (name) VALUES (?)`, [`Garage ${g + 1}`], function () {
          const garageId = this.lastID;
          for (let i = 1; i <= 24; i++) {
            db.run(`INSERT INTO spots (garage_id, spot_number, is_occupied, type) VALUES (?, ?, 0, ?)`, [garageId, i, 'car']);
          }
        });
      }
    }
  });
});

module.exports = db;

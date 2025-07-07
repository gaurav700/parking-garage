const express = require('express');
const path = require('path')
const app = express();
const db = require('./db');
const { randomUUID } = require('crypto');


app.use(express.json());
const port = parseInt(process.env.PORT) || process.argv[3] || 8080;
const garages = Array.from({ length: 3 }, () =>
  Array.from({ length: 24 }, (_, i) => ({
    spotNumber: i + 1,
    isOccupied: false
  }))
);
const reservations = new Map(); 


app.use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('index');
});


// public endpoints
app.post('/reserve/:id', (req, res) => {
  const garageId = parseInt(req.params.id);

  db.get(`SELECT id FROM garages WHERE id = ?`, [garageId], (err, garage) => {
    if (!garage) return res.status(400).json({ error: 'Invalid garage ID' });

    db.get(`SELECT * FROM spots WHERE garage_id = ? AND is_occupied = 0 LIMIT 1`, [garageId], (err, spot) => {
      if (!spot) return res.status(400).json({ error: 'No available spots' });

      const reservation_id = randomUUID();
      const start = new Date().toISOString();
      const end = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      db.run(`INSERT INTO reservations (id, garage_id, spot_id, start_time, end_time)
              VALUES (?, ?, ?, ?, ?)`, [reservation_id, garageId, spot.id, start, end], (err) => {
        db.run(`UPDATE spots SET is_occupied = 1 WHERE id = ?`, [spot.id]);

        res.json({
          data: {
            start,
            end,
            reservation_id,
            garage_id: garageId,
            spot_id: spot.spot_number
          }
        });
      });
    });
  });
});


app.get('/cancel/:id', (req, res) => {
  const reservationId = req.params.id;

  db.get(`SELECT * FROM reservations WHERE id = ?`, [reservationId], (err, reservation) => {
    if (!reservation) return res.status(400).json({ error: 'Reservation not found' });

    db.run(`DELETE FROM reservations WHERE id = ?`, [reservationId]);
    db.run(`UPDATE spots SET is_occupied = 0 WHERE id = ?`, [reservation.spot_id]);

    res.json({ message: `Reservation ${reservationId} cancelled.` });
  });
});


app.get('/payment/:id', (req, res) => {
  const reservationId = req.params.id;

  db.get(`SELECT * FROM reservations WHERE id = ?`, [reservationId], (err, reservation) => {
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });

    const amount = 100;
    res.json({
      reservation_id: reservationId,
      garage_id: reservation.garage_id,
      spot_id: reservation.spot_id,
      amount,
      status: 'pending'
    });
  });
});






// internal endpoints
app.post('/create-account', (req, res) => {
  const { email, password, id } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
    if (user) return res.status(409).json({ error: 'User already exists' });

    db.run(`INSERT INTO users (email, password, user_id) VALUES (?, ?, ?)`, [email, password, id]);
    res.json({ message: 'Account created successfully' });
  });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({ message: 'Login successful', id: user.user_id });
  });
});


app.get('/calculate-payments/:reservation_id', (req, res) => {
  const reservationId = req.params.reservation_id;

  db.get(`SELECT start_time, end_time FROM reservations WHERE id = ?`, [reservationId], (err, reservation) => {
    if (err || !reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const start = new Date(reservation.start_time);
    const end = reservation.end_time ? new Date(reservation.end_time) : new Date();

    const durationHours = Math.ceil((end - start) / (1000 * 60 * 60));
    const ratePerHour = 10;
    const amount = durationHours * ratePerHour;

    res.json({
      reservation_id: reservationId,
      durationHours,
      amount
    });
  });
});



app.get('/free-spots', (req, res) => {
  const { garage_id, vehicle_type } = req.query;
  const garageId = parseInt(garage_id);

  if (isNaN(garageId)) {
    return res.status(400).json({ error: 'Invalid garage ID' });
  }

  const sql = `
    SELECT spot_number FROM spots 
    WHERE garage_id = ? AND is_occupied = 0 AND 
    (type = ? OR (? = 'bike' AND type = 'car'))
  `;

  db.all(sql, [garageId, vehicle_type, vehicle_type], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    res.json({
      garage_id: garageId,
      vehicle_type,
      available_spots: rows.map(row => row.spot_number)
    });
  });
});



app.post('/allocate-spots', (req, res) => {
  const { id, start_time, end_time } = req.body;
  const garageId = parseInt(id);

  db.get(`SELECT * FROM garages WHERE id = ?`, [garageId], (err, garage) => {
    if (!garage) {
      return res.status(400).json({ error: 'Invalid garage ID' });
    }

    db.get(`SELECT * FROM spots WHERE garage_id = ? AND is_occupied = 0 LIMIT 1`, [garageId], (err, spot) => {
      if (!spot) {
        return res.status(400).json({ error: 'No available spots' });
      }

      const reservation_id = randomUUID();

      db.run(`INSERT INTO reservations (id, garage_id, spot_id, start_time, end_time) VALUES (?, ?, ?, ?, ?)`,
        [reservation_id, garageId, spot.id, start_time, end_time], (err) => {
          if (err) return res.status(500).json({ error: 'Reservation failed' });

          db.run(`UPDATE spots SET is_occupied = 1 WHERE id = ?`, [spot.id], () => {
            res.json({
              reservation_id,
              spot_id: spot.spot_number,
              start: start_time,
              end: end_time
            });
          });
        });
    });
  });
});

















app.get('/api', (req, res) => {
  res.json({"msg": "Hello world"});
});

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
})
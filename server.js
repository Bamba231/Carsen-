const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname)));

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function initializeDB() {
    try {
        const connection = await pool.getConnection();
        await connection.query(`
            CREATE TABLE IF NOT EXISTS cars (
                id INT AUTO_INCREMENT PRIMARY KEY,
                make VARCHAR(255),
                model VARCHAR(255),
                year INT,
                price INT,
                specs JSON,
                images LONGTEXT
            )
        `);
        connection.release();
        console.log("MySQL Database initialized");
    } catch (err) {
        console.error("Error initializing MySQL DB:", err);
    }
}
initializeDB();

app.get('/api/cars', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM cars');
        const cars = rows.map(row => {
            let parsedSpecs = typeof row.specs === 'string' ? JSON.parse(row.specs) : row.specs;
            let parsedImages = typeof row.images === 'string' ? JSON.parse(row.images) : row.images;
            return {
                ...row,
                specs: parsedSpecs,
                images: parsedImages && parsedImages.length > 0 ? [parsedImages[0]] : []
            };
        });
        res.json(cars);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error: " + err.message });
    }
});

app.get('/api/cars/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const [rows] = await pool.query('SELECT * FROM cars WHERE id = ?', [id]);
        if (rows.length > 0) {
            const row = rows[0];
            let parsedSpecs = typeof row.specs === 'string' ? JSON.parse(row.specs) : row.specs;
            let parsedImages = typeof row.images === 'string' ? JSON.parse(row.images) : row.images;
            res.json({
                ...row,
                specs: parsedSpecs,
                images: parsedImages || []
            });
        } else {
            res.status(404).json({ error: "Car not found" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error: " + err.message });
    }
});

app.post('/api/cars', async (req, res) => {
    try {
        const { make, model, year, price, specs, images } = req.body;
        const [result] = await pool.query(
            'INSERT INTO cars (make, model, year, price, specs, images) VALUES (?, ?, ?, ?, ?, ?)',
            [make, model, year, price, JSON.stringify(specs), JSON.stringify(images || [])]
        );
        res.json({ id: result.insertId, make, model, year, price, specs, images });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error: " + err.message });
    }
});

app.put('/api/cars/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { make, model, year, price, specs, images } = req.body;
        const [result] = await pool.query(
            'UPDATE cars SET make=?, model=?, year=?, price=?, specs=?, images=? WHERE id=?',
            [make, model, year, price, JSON.stringify(specs), JSON.stringify(images || []), id]
        );
        if (result.affectedRows > 0) {
            res.json({ id, ...req.body });
        } else {
            res.status(404).json({ error: "Car not found" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

app.delete('/api/cars/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const [result] = await pool.query('DELETE FROM cars WHERE id=?', [id]);
        if (result.affectedRows > 0) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: "Car not found" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

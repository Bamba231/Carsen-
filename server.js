const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname)));

const os = require('os');


let dataDir;
try {
    dataDir = path.join(os.homedir(), '.carsen_app_data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
} catch (e) {
    console.error("Impossible de créer le dossier dans le homedir. Fallback sur le dossier local.", e);
    dataDir = __dirname;
}

const dbPath = path.join(dataDir, 'database.json');

if (!fs.existsSync(dbPath)) {
    try {
        fs.writeFileSync(dbPath, JSON.stringify([], null, 2));
        console.log("Database initialized empty");
    } catch (err) {
        console.error("Error initializing DB:", err);
    }
}

const getCars = () => {
    try {
        const data = fs.readFileSync(dbPath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

const saveCars = (cars) => {
    fs.writeFileSync(dbPath, JSON.stringify(cars, null, 2));
}

app.get('/api/cars', (req, res) => {

    const cars = getCars().map(car => ({
        ...car,
        images: car.images && car.images.length > 0 ? [car.images[0]] : []
    }));
    res.json(cars);
});

app.get('/api/cars/:id', (req, res) => {
    const cars = getCars();
    const id = parseInt(req.params.id, 10);
    const car = cars.find(c => c.id === id);
    if (car) {
        res.json(car);
    } else {
        res.status(404).json({ error: "Car not found" });
    }
});

app.post('/api/cars', (req, res) => {
    const cars = getCars();
    const newCar = req.body;
    const maxId = cars.length > 0 ? Math.max(...cars.map(c => c.id)) : 0;
    newCar.id = maxId + 1;
    cars.push(newCar);
    saveCars(cars);
    res.json(newCar);
});

app.put('/api/cars/:id', (req, res) => {
    const cars = getCars();
    const id = parseInt(req.params.id, 10);
    const index = cars.findIndex(c => c.id === id);
    if (index !== -1) {
        cars[index] = { ...cars[index], ...req.body, id };
        saveCars(cars);
        res.json(cars[index]);
    } else {
        res.status(404).json({ error: "Car not found" });
    }
});

app.delete('/api/cars/:id', (req, res) => {
    let cars = getCars();
    const id = parseInt(req.params.id, 10);
    const initialLen = cars.length;
    cars = cars.filter(c => c.id !== id);
    if (cars.length < initialLen) {
        saveCars(cars);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "Car not found" });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

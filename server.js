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

const vm = require('vm');

const dbPath = path.join(__dirname, 'database.json');
const carsDataPath = path.join(__dirname, 'cars-data.js');

if (!fs.existsSync(dbPath)) {
    try {
        if (fs.existsSync(carsDataPath)) {
            const carsDataContent = fs.readFileSync(carsDataPath, 'utf8');
            const sandbox = { window: {} };
            vm.createContext(sandbox);
            vm.runInContext(carsDataContent, sandbox);
            const initialCars = sandbox.window.cars || [];
            fs.writeFileSync(dbPath, JSON.stringify(initialCars, null, 2));
            console.log("Database initialized from cars-data.js with", initialCars.length, "cars");

        } else {
            fs.writeFileSync(dbPath, JSON.stringify([], null, 2));
            console.log("Database initialized empty");
        }
    } catch (err) {
        console.error("Error initializing DB:", err);
        fs.writeFileSync(dbPath, JSON.stringify([], null, 2));
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
    res.json(getCars());
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

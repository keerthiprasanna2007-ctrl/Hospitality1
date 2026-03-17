const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Atlas Connection (using your specific URI)
const mongoURI = "mongodb+srv://keerthiprasanna2007_db_user:OTxkTPHp7W9NFawe@hack.jk3iuy1.mongodb.net/hospital_db?retryWrites=true&w=majority";

mongoose.connect(mongoURI)
    .then(() => console.log('✅ Connected to MongoDB Atlas!'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Patient Schema
const patientSchema = new mongoose.Schema({
    id: Number,
    name: String,
    age: Number,
    disease: String,
    floor: Number,
    daysAdmitted: Number,
    stage: String,
    caseHistory: String,
    hr: Number, 
    o2: Number, 
    status: String,
    emergency: { type: Boolean, default: false }
});

const Patient = mongoose.model('Patient', patientSchema);

// INITIAL SEED DATA
const seedData = [
    { id: 1, floor: 1, name: "Siri", age: 45, disease: "Asthma", stage: "Stage 2", caseHistory: "History of hypertension.", daysAdmitted: 3, hr: 75, o2: 98, emergency: false },
    { id: 2, floor: 1, name: "Alice Smith", age: 30, disease: "Fever", stage: "Stable", caseHistory: "Monitoring temperature spikes.", daysAdmitted: 1, hr: 80, o2: 96, emergency: false },
    { id: 3, floor: 2, name: "Bob Johnson", age: 55, disease: "Heart Problem", stage: "Critical", caseHistory: "Post-cardiac arrest recovery.", daysAdmitted: 7, hr: 110, o2: 89, emergency: false },
    { id: 4, floor: 2, name: "Mary Williams", age: 25, disease: "COVID-19", stage: "Moderate", caseHistory: "Breathing difficulties.", daysAdmitted: 5, hr: 105, o2: 92, emergency: false },
    { id: 5, floor: 3, name: "David Brown", age: 55, disease: "Hypertension", stage: "Stable", caseHistory: "Blood pressure regulation.", daysAdmitted: 4, hr: 90, o2: 96, emergency: false },
    { id: 6, floor: 3, name: "Sarah Davis", age: 80, disease: "Pneumonia", stage: "Acute", caseHistory: "Severe lung infection.", daysAdmitted: 10, hr: 120, o2: 85, emergency: false }
];

// WIPING DB ON STARTUP TO FIX THE "UNDEFINED" ISSUES
async function initDB() {
    try {
        await Patient.deleteMany({}); // Clear old broken data
        await Patient.insertMany(seedData);
        console.log('🚀 Database refreshed with correct patient fields!');
    } catch (err) {
        console.error('Error during DB init:', err);
    }
}
initDB();

// Health Classification
const getStatus = (hr, o2) => {
    if (hr > 110 || o2 < 90) return "critical";
    if (hr > 100 || o2 <= 94) return "moderate";
    return "safe";
};

// Serve static frontend
app.use(express.static(path.join(__dirname, '../')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Update Vitals every 3 seconds
setInterval(async () => {
    try {
        const patients = await Patient.find();
        for (let p of patients) {
            // Heart Rate Range 60-130
            let hrChange = Math.floor(Math.random() * 11) - 5;
            let newHr = Math.max(60, Math.min(130, (p.hr || 80) + hrChange));
            
            // Oxygen Range 85-100
            let o2Change = Math.floor(Math.random() * 5) - 2;
            let newO2 = Math.max(85, Math.min(100, (p.o2 || 95) + o2Change));
            
            let newStatus = getStatus(newHr, newO2);
            
            await Patient.updateOne({ _id: p._id }, { 
                $set: { hr: newHr, o2: newO2, status: newStatus } 
            });
        }
    } catch (err) {
        console.error('Update Error:', err);
    }
}, 3000);

// API: Get Patients
app.get('/patients', async (req, res) => {
    try {
        const patients = await Patient.find().sort({ floor: 1, name: 1 });
        res.json(patients);
    } catch (err) {
        res.status(500).json({ error: 'Fetch failed' });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🌍 Server active at http://localhost:${PORT}`));

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 1. Isku xidhka MongoDB (Render Environment Variables)
const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
  .then(() => console.log("✅ MongoDB Connected Successfully!"))
  .catch(err => console.log("❌ MongoDB Connection Error:", err));

// 2. Samee Qaabka (Schema) ardayga
const studentSchema = new mongoose.Schema({
    name: String,
    class: String,
    createdAt: { type: Date, default: Date.now }
});

const Student = mongoose.model('Student', studentSchema);

// 3. API Route: In arday cusub lagu daro (POST)
app.post('/api/students', async (req, res) => {
    try {
        const { name, class: className } = req.body;
        const newStudent = new Student({ name, class: className });
        await newStudent.save();
        res.status(201).json({ message: "Ardayga waa la keydiyey!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. API Route: In la arko dhammaan ardayda (GET)
app.get('/api/students', async (req, res) => {
    try {
        const students = await Student.find().sort({ createdAt: -1 });
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. U dirista bogga hore (index.html)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Port-ka Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
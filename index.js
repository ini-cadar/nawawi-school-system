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

// Isku xidhka MongoDB
const uri = process.env.MONGODB_URI;
mongoose.connect(uri)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err));

// Schema-ka Ardayda
const studentSchema = new mongoose.Schema({
    name: String,
    class: String,
    createdAt: { type: Date, default: Date.now }
});
const Student = mongoose.model('Student', studentSchema);

// API Routes
app.post('/api/students', async (req, res) => {
    try {
        const newStudent = new Student(req.body);
        await newStudent.save();
        res.status(201).json({ message: "Waa la keydiyey" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/students', async (req, res) => {
    const students = await Student.find().sort({ createdAt: -1 });
    res.json(students);
});

// Ku soo celi bogga hore haddii meel kale la tago
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Port: ${PORT}`));
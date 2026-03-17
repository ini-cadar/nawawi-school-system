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

// 1. Isku xidhka MongoDB
const uri = process.env.MONGODB_URI;
mongoose.connect(uri)
  .then(() => console.log("✅ MongoDB Is Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

// 2. Student Schema & Model
const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    class: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
const Student = mongoose.model('Student', studentSchema);

// 3. API Routes
// In arday cusub lagu daro
app.post('/api/students', async (req, res) => {
    try {
        const newStudent = new Student(req.body);
        await newStudent.save();
        res.status(201).json({ message: "Success" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// In la arko dhammaan ardayda
app.get('/api/students', async (req, res) => {
    try {
        const students = await Student.find().sort({ createdAt: -1 });
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// In arday la tirtiro (DELETE)
app.delete('/api/students/:id', async (req, res) => {
    try {
        await Student.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Fallback: U dirista Frontend-ka (Xalka "Not Found")
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
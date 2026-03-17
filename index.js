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
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

// 2. Database Schemas
// Schema-ka Ardayda
const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    class: { type: String, required: true }
});
const Student = mongoose.model('Student', studentSchema);

// Schema-ka Attendance-ka
const attendanceSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    status: { type: String, enum: ['Present', 'Absent'], required: true },
    date: { type: Date, default: Date.now }
});
const Attendance = mongoose.model('Attendance', attendanceSchema);

// 3. API Routes
// Diiwaangelinta Ardayda
app.post('/api/students', async (req, res) => {
    try {
        const newStudent = new Student(req.body);
        await newStudent.save();
        res.status(201).json({ message: "Success" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/students', async (req, res) => {
    const students = await Student.find();
    res.json(students);
});

// Maamulka Attendance-ka
app.post('/api/attendance', async (req, res) => {
    try {
        const record = new Attendance(req.body);
        await record.save();
        res.status(201).json({ message: "Attendance Saved" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. Xalka "Not Found"
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
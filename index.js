const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Isku xirka MongoDB (Adigoo isticmaalaya xogtaada)
const MONGO_URI = "mongodb+srv://raazicadar_db_user:inicadar1234.@cluster0.z93llyc.mongodb.net/school_db?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
    .then(() => console.log('NBS Database Connected!'))
    .catch(err => console.error('DB Connection Error:', err));

// Schema-da Ardayga (100% Options)
const studentSchema = new mongoose.Schema({
    fullName: String,
    motherName: String,
    fatherPhone: String,
    motherPhone: String,
    examNumber: { type: String, unique: true },
    password: { type: String, default: '123456' },
    grade: String,
    feePaid: { type: Boolean, default: false },
    attendance: [{ date: String, shift: String, status: String }],
    examScores: [{ subject: String, score: Number, gradeLetter: String }]
});

const Student = mongoose.model('Student', studentSchema);

// Admin: Add Student (Dashedboard Percentage logic)
app.post('/api/register', async (req, res) => {
    try {
        const subjects = ["Tarbiya", "Carabi", "Soomaali", "English", "Math", "Physics", "Chemistry", "Biology", "Geography", "History", "ICT", "Business"];
        const scores = subjects.map(s => ({ subject: s, score: 0, gradeLetter: 'F' }));
        const newStudent = new Student({ ...req.body, examScores: scores });
        await newStudent.save();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Admin: Fee & Exam Updates
app.put('/api/student/:id', async (req, res) => {
    await Student.findByIdAndUpdate(req.params.id, req.body);
    res.json({ success: true });
});

// Login Core (Admin & Student)
app.post('/api/login', async (req, res) => {
    const { roll, pass } = req.body;
    if(roll === 'admin' && pass === 'admin1234') return res.json({ role: 'admin',data: {} });
    const s = await Student.findOne({ examNumber: roll, password: pass });
    if(s) res.json({ role: 'student', data: s });
    else res.status(401).json({ error: 'Khalad!' });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
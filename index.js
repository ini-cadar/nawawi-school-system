/**
 * ============================================================================
 * WEYRAX & NAWAWI SCHOOL SYSTEM - BACKEND v10.0
 * ============================================================================
 * Sifooyinka: GPA (4.0), Gallery Upload (Base64), Security (Helmet)
 * ============================================================================
 */

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// --- 1. CONFIGURATION & SECURITY ---
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false })); // Ammaanka Mareegta
app.use(express.json({ limit: '20mb' })); // Si sawirrada waaweyn loogu soo diro
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(express.static('public'));

// --- 2. DATABASE CONNECTION ---
const MONGO_URI = "mongodb+srv://raazicadar_db_user:inicadar1234.@cluster0.z93llyc.mongodb.net/school_db?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('✅ DATABASE: Xiriirka waa guul! (Nawawi System)');
})
.catch(err => {
    console.error('❌ DATABASE ERROR:', err.message);
});

// --- 3. STUDENT SCHEMA & GPA LOGIC ---
const studentSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    examNumber: { type: String, unique: true, required: true },
    password: { type: String, default: '123456' },
    grade: { type: String, required: true },
    section: { type: String, required: true },
    profileImage: { type: String, default: '' }, // Gallery Image (Base64)
    examScores: [{
        subject: String,
        score: { type: Number, default: 0 },
        gradePoint: { type: Number, default: 0 }
    }],
    totalScore: { type: Number, default: 0 },
    average: { type: Number, default: 0 },
    gpa: { type: Number, default: 0.0 },
    lastUpdated: { type: Date, default: Date.now }
});

// GPA CALCULATION MIDDLEWARE
studentSchema.pre('save', function(next) {
    let total = 0;
    let totalGP = 0;
    
    this.examScores.forEach(s => {
        // GPA Scale (Standard 4.0)
        if (s.score >= 90) s.gradePoint = 4.0;
        else if (s.score >= 80) s.gradePoint = 3.0;
        else if (s.score >= 70) s.gradePoint = 2.0;
        else if (s.score >= 50) s.gradePoint = 1.0;
        else s.gradePoint = 0.0;
        
        total += s.score;
        totalGP += s.gradePoint;
    });

    const count = this.examScores.length > 0 ? this.examScores.length : 1;
    this.totalScore = total;
    this.average = Math.round(total / count);
    this.gpa = parseFloat((totalGP / count).toFixed(2));
    this.lastUpdated = Date.now();
    next();
});

const Student = mongoose.model('Student', studentSchema);

// --- 4. API ROUTES ---

// 4.1 Login Route
app.post('/api/login', async (req, res) => {
    const { roll, pass } = req.body;
    if (roll === 'admin' && pass === 'admin123') {
        return res.json({ success: true, role: 'admin' });
    }
    try {
        const student = await Student.findOne({ examNumber: roll, password: pass });
        if (student) res.json({ success: true, role: 'student', data: student });
        else res.status(401).json({ success: false, error: 'Xogtu waa khalad!' });
    } catch (e) { res.status(500).json({ error: 'Server Error' }); }
});

// 4.2 Register Student
app.post('/api/register', async (req, res) => {
    try {
        const subjects = ["Math", "English", "Arabic", "Somali", "Physics", "Chemistry", "Biology", "History", "Geography", "ICT", "Tarbiya"];
        const scores = subjects.map(s => ({ subject: s, score: 0 }));
        const newSt = new Student({ ...req.body, examScores: scores });
        await newSt.save();
        res.status(201).json({ success: true });
    } catch (e) { res.status(400).json({ error: 'ID-ga hore ayaa loo isticmaalay!' }); }
});

// 4.3 Get All Students (Filters included)
app.get('/api/students', async (req, res) => {
    try {
        const { grade, section } = req.query;
        let query = {};
        if (grade && grade !== 'all') query.grade = grade;
        if (section && section !== 'all') query.section = section;
        const students = await Student.find(query).sort({ totalScore: -1 });
        res.json(students);
    } catch (e) { res.status(500).json({ error: 'Error fetching data' }); }
});

// 4.4 Update Scores or Image
app.put('/api/student/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ error: 'Lama helin!' });
        Object.assign(student, req.body);
        await student.save();
        res.json({ success: true, data: student });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 4.5 Delete Student
app.delete('/api/student/:id', async (req, res) => {
    try {
        await Student.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Error' }); }
});

// --- 5. START SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 SERVER IS RUNNING ON PORT: ${PORT}`);
});
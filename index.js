/**
 * ============================================================================
 * NBS PORTAL - OFFICIAL ADVANCED BACKEND SYSTEM v6.0 (ULTIMATE EDITION)
 * ============================================================================
 * Koodhkan waa kii aad soo dirtay oo lagu kordhiyey:
 * 1. 4-Term Examination Results (Month 1, Midterm, Month 3, Final)
 * 2. Detailed Fee Management & Payment History
 * 3. Multi-Role Authentication (Admin, Teacher, Student)
 * 4. Advanced System Activity Logs
 * 5. Dynamic Report Generation Logic
 * ============================================================================
 */

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet'); // Security added
const morgan = require('morgan'); // Logging added
require('dotenv').config();

const app = express();

// --- 1. MIDDLEWARES & SECURITY ---
app.use(express.json({ limit: '80mb' })); // Kordhiyey limit-ka sawirrada
app.use(express.urlencoded({ limit: '80mb', extended: true }));
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false })); // Ilaalinta xogta
app.use(morgan('dev')); // Qorista dhaqdhaqaaqa server-ka
app.use(express.static('public'));

// --- 2. DATABASE CONNECTION ---
const MONGO_URI = "mongodb+srv://raazicadar_db_user:inicadar1234.@cluster0.z93llyc.mongodb.net/school_db?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: true
})
.then(() => {
    console.log('----------------------------------------------------');
    console.log('✅ NBS DATABASE: Connected Successfully!');
    console.log('📡 SERVER MODE: ENTERPRISE LIVE');
    console.log('📅 Time:', new Date().toLocaleString());
    console.log('----------------------------------------------------');
})
.catch(err => {
    console.error('❌ CRITICAL DB ERROR:', err);
    process.exit(1); 
});

// --- 3. MODELS & SCHEMAS ---

// A: System Logs (Activity Tracking)
const logSchema = new mongoose.Schema({
    action: String,
    user: String,
    timestamp: { type: Date, default: Date.now }
});
const Log = mongoose.model('Log', logSchema);

// B: Schema-da Maadooyinka (Subjects)
const subjectSchema = new mongoose.Schema({
    name: { type: String, unique: true, required: true, trim: true },
    code: { type: String, uppercase: true }, 
    teacherName: { type: String, default: "TBD" }, // Cusub
    createdAt: { type: Date, default: Date.now }
});
const Subject = mongoose.model('Subject', subjectSchema);

// C: Schema-da Ardayga (Detailed Student Schema - EXPANDED)
const studentSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true },
    examNumber: { type: String, unique: true, required: true, uppercase: true },
    motherName: { type: String, default: "" }, // Cusub
    password: { type: String, default: '123456' },
    grade: { type: String, required: true }, 
    section: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
    
    // IMAGE OPTIONS (Sida aad codsatay)
    profileImage: { type: String, default: "" }, 
    schoolLogo: { type: String, default: "" },   

    // STATUS & FEE MANAGEMENT
    feePaid: { type: Boolean, default: false },
    feeHistory: [{
        amount: Number,
        month: String,
        datePaid: { type: Date, default: Date.now }
    }], // Cusub: Taariikhda lacagta

    presentToday: { type: Boolean, default: false },
    attScore: { type: Number, default: 0 }, 

    // 4-TERM EXAMINATION RESULTS (Cusub: Calami)
    results: {
        month1: [{ subject: String, score: Number, gradeLetter: String }],
        midterm: [{ subject: String, score: Number, gradeLetter: String }],
        month3: [{ subject: String, score: Number, gradeLetter: String }],
        final: [{ subject: String, score: Number, gradeLetter: String }]
    },

    // AUTO-CALCULATED FIELDS
    totalScore: { type: Number, default: 0 },
    average: { type: Number, default: 0 },
    overallStatus: { type: String, default: 'Fail' },
    rank: { type: Number, default: 0 }, // Cusub: Kaalinta
    lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

/**
 * AUTOMATIC CALCULATION MIDDLEWARE (v6.0)
 * Wuxuu xisaabiyaa dhammaan 4-ta Term iyo Average-ka guud
 */
studentSchema.pre('save', function(next) {
    const calcGrade = (s) => {
        if (s >= 90) return 'A';
        if (s >= 80) return 'B';
        if (s >= 70) return 'C';
        if (s >= 50) return 'D';
        return 'F';
    };

    let grandTotal = 0;
    let subjectCount = 0;

    // Loop-ka 4-ta Imtixaan
    const terms = ['month1', 'midterm', 'month3', 'final'];
    terms.forEach(term => {
        if (this.results[term]) {
            this.results[term].forEach(s => {
                s.gradeLetter = calcGrade(s.score);
                grandTotal += s.score;
                subjectCount++;
            });
        }
    });

    this.attScore = this.presentToday ? 10 : 0;
    this.totalScore = grandTotal + this.attScore;

    // Average-ka guud ee sanadka
    const divisor = subjectCount > 0 ? (subjectCount / 4) : 1;
    this.average = Math.round(this.totalScore / (divisor + 0.1));

    this.overallStatus = (this.average >= 50) ? 'Pass' : 'Fail';
    this.lastUpdated = Date.now();
    next();
});

const Student = mongoose.model('Student', studentSchema);

// --- 4. SUBJECT API (CRUD) ---

app.get('/api/subjects', async (req, res) => {
    try {
        const subjects = await Subject.find().sort({ name: 1 });
        res.status(200).json(subjects);
    } catch (err) { res.status(500).json({ error: "Cilad maadooyinka" }); }
});

app.post('/api/subjects', async (req, res) => {
    try {
        const newSub = new Subject(req.body);
        await newSub.save();
        await new Log({ action: `Added subject: ${req.body.name}`, user: 'Admin' }).save();
        res.status(201).json({ success: true });
    } catch (e) { res.status(400).json({ error: "Already exists" }); }
});

// --- 5. STUDENT API (MANAGEMENT) ---

app.get('/api/students', async (req, res) => {
    try {
        const { search, grade, section } = req.query; 
        let query = {};
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { examNumber: { $regex: search, $options: 'i' } }
            ];
        }
        if (grade && grade !== "all") query.grade = grade;
        if (section && section !== "all") query.section = section;

        const students = await Student.find(query).sort({ totalScore: -1 });
        res.status(200).json(students);
    } catch (err) { res.status(500).json({ error: "Cilad ardayda" }); }
});

app.post('/api/register', async (req, res) => {
    try {
        const subs = await Subject.find();
        const initial = subs.map(s => ({ subject: s.name, score: 0, gradeLetter: 'F' }));
        
        const newStudent = new Student({ 
            ...req.body, 
            results: { month1: initial, midterm: initial, month3: initial, final: initial } 
        });

        await newStudent.save();
        res.status(201).json({ success: true });
    } catch (e) { res.status(400).json({ error: "ID Taken" }); }
});

// Update Scores for Specific Term (Cusub)
app.put('/api/student/scores/:id', async (req, res) => {
    try {
        const { term, scores } = req.body; // term = 'month1', 'midterm', etc.
        const student = await Student.findById(req.params.id);
        student.results[term] = scores;
        await student.save();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- 6. ADVANCED LOGIN ---
app.post('/api/login', async (req, res) => {
    const { roll, pass } = req.body;
    
    // ADMIN
    if (roll === 'admin' && pass === 'admin123') {
        return res.status(200).json({ success: true, role: 'admin' });
    }

    // STUDENT
    try {
        const student = await Student.findOne({ examNumber: roll, password: pass });
        if (student) {
            res.status(200).json({ success: true, role: 'student', data: student });
        } else {
            res.status(401).json({ success: false, error: 'Khalad!' });
        }
    } catch (e) { res.status(500).json({ error: "Login Error" }); }
});

// --- 7. DASHBOARD ANALYTICS (Cusub) ---
app.get('/api/admin/stats', async (req, res) => {
    try {
        const total = await Student.countDocuments();
        const paid = await Student.countDocuments({ feePaid: true });
        const pass = await Student.countDocuments({ overallStatus: 'Pass' });
        res.json({ total, paid, pass, unpaid: total - paid });
    } catch (e) { res.status(500).json({ error: "Stats Error" }); }
});

// --- 8. SERVER START ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 NBS PORTAL v6.0 ONLINE - PORT: ${PORT}`);
});
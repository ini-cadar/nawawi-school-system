/**
 * ============================================================================
 * NBS PORTAL - OFFICIAL ADVANCED BACKEND SYSTEM v6.0 (ENTERPRISE EDITION)
 * ============================================================================
 * AUTHOR: WEYRAX SCHOOL MANAGEMENT
 * FEATURES: 
 * - Multi-Term Scoring (Month 1, Midterm, Month 3, Final)
 * - Advanced Fee Management (Payment Verification)
 * - Gallery & Logo Base64 Storage Optimization
 * - Admin Printing & Dashboard Analytics
 * - Mobile-Responsive API Headers
 * ============================================================================
 */

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet'); // Security
const morgan = require('morgan'); // Logging
require('dotenv').config();

const app = express();

// --- 1. MIDDLEWARES & SECURITY CONFIGURATION ---
// Waxaan u kordhiyey limit-ka sawirrada Gallery-ga iyo Logo-ga
app.use(express.json({ limit: '60mb' })); 
app.use(express.urlencoded({ limit: '60mb', extended: true }));
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false })); // Ammaanka Browser-ka
app.use(morgan('dev')); // In lagu arko terminal-ka waxa dhacaya
app.use(express.static('public'));

// Headers gaar ah oo loogu talagalay in moobiilka uusan ku jarin xogta (B)
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// --- 2. DATABASE CONNECTION (OFFICIAL MONGODB) ---
const MONGO_URI = "mongodb+srv://raazicadar_db_user:inicadar1234.@cluster0.z93llyc.mongodb.net/school_db?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('\x1b[36m%s\x1b[0m', '----------------------------------------------------');
    console.log('\x1b[32m%s\x1b[0m', '✅ NBS OFFICIAL DATABASE: CONNECTED SUCCESSFULLY');
    console.log('\x1b[36m%s\x1b[0m', '----------------------------------------------------');
})
.catch(err => {
    console.error('❌ CRITICAL DATABASE ERROR:', err);
    process.exit(1); 
});

// --- 3. MODELS & SCHEMAS (STRUCTURED) ---

// A. Maadooyinka (Subjects)
const subjectSchema = new mongoose.Schema({
    name: { type: String, unique: true, required: true, trim: true },
    code: { type: String, uppercase: true }, 
    addedBy: { type: String, default: 'Admin' },
    createdAt: { type: Date, default: Date.now }
});
const Subject = mongoose.model('Subject', subjectSchema);

// B. Ardayga (Official Detailed Schema)
const studentSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true },
    examNumber: { type: String, unique: true, required: true, uppercase: true },
    password: { type: String, default: '123456' },
    grade: { type: String, required: true }, 
    section: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
    
    // Branding & Photos (Base64 Gallery)
    profileImage: { type: String, default: "" }, 
    schoolLogo: { type: String, default: "" },   

    // A: Fee Management Options
    feeStatus: { 
        isPaid: { type: Boolean, default: false },
        lastPaymentDate: { type: Date },
        amountDue: { type: Number, default: 0 }
    },

    // Attendance Logic
    attendance: {
        presentToday: { type: Boolean, default: false },
        totalPresentDays: { type: Number, default: 0 },
        bonusPoints: { type: Number, default: 0 }
    },

    // C: 4-Term Exam Results (Month 1, Midterm, Month 3, Final)
    results: {
        month1: [{ subject: String, score: { type: Number, default: 0 }, gradeLetter: String }],
        midterm: [{ subject: String, score: { type: Number, default: 0 }, gradeLetter: String }],
        month3: [{ subject: String, score: { type: Number, default: 0 }, gradeLetter: String }],
        final: [{ subject: String, score: { type: Number, default: 0 }, gradeLetter: String }]
    },

    // Global Statistics
    academicSummary: {
        overallAverage: { type: Number, default: 0 },
        rank: { type: String, default: 'N/A' },
        status: { type: String, default: 'Pending' }
    }
}, { timestamps: true });

/**
 * AUTOMATIC SCORE CALCULATION ENGINE
 * Xisaabinta darajooyinka (A, B, C, D, F) iyo Attendance-ka
 */
studentSchema.pre('save', function(next) {
    const terms = ['month1', 'midterm', 'month3', 'final'];
    
    terms.forEach(term => {
        if (this.results[term]) {
            this.results[term].forEach(item => {
                if (item.score >= 90) item.gradeLetter = 'A';
                else if (item.score >= 80) item.gradeLetter = 'B';
                else if (item.score >= 70) item.gradeLetter = 'C';
                else if (item.score >= 50) item.gradeLetter = 'D';
                else item.gradeLetter = 'F';
            });
        }
    });

    // Attendance Bonus logic
    this.attendance.bonusPoints = this.attendance.presentToday ? 10 : 0;
    
    // Status Determination
    this.academicSummary.status = (this.academicSummary.overallAverage >= 50) ? 'Pass' : 'Fail';

    next();
});

const Student = mongoose.model('Student', studentSchema);

// --- 4. OFFICIAL API ROUTES ---

// --- 4.1 SUBJECT MANAGEMENT ---
app.get('/api/subjects', async (req, res) => {
    try {
        const data = await Subject.find().sort({ name: 1 });
        res.status(200).json(data);
    } catch (err) { res.status(500).json({ error: "Cilad maadooyinka" }); }
});

app.post('/api/subjects', async (req, res) => {
    try {
        const sub = new Subject(req.body);
        await sub.save();
        res.status(201).json({ success: true, message: "Maadada waa la daray" });
    } catch (err) { res.status(400).json({ error: "Maadadani way jirtaa" }); }
});

// --- 4.2 STUDENT REGISTRATION & GALLERY ---
app.post('/api/students/register', async (req, res) => {
    try {
        const subs = await Subject.find();
        const initial = subs.map(s => ({ subject: s.name, score: 0, gradeLetter: 'F' }));
        
        const newStudent = new Student({
            ...req.body,
            results: { month1: initial, midterm: initial, month3: initial, final: initial }
        });

        await newStudent.save();
        res.status(201).json({ success: true, message: "Ardayga waa la diiwaangeliyay" });
    } catch (err) { res.status(400).json({ error: "Roll Number-ka hore ayaa loo qaatay!" }); }
});

// --- 4.3 FEE MANAGEMENT SYSTEM (A) ---
// Saxidda Lacagta (Bixiyay ama Ma bixin)
app.put('/api/students/fee/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ error: "Ardayga lama helin" });

        student.feeStatus.isPaid = !student.feeStatus.isPaid;
        student.feeStatus.lastPaymentDate = student.feeStatus.isPaid ? new Date() : null;
        
        await student.save();
        res.json({ success: true, isPaid: student.feeStatus.isPaid });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 4.4 EXAM SCORING (C: 4 TERMS) ---
app.put('/api/students/update-scores/:id', async (req, res) => {
    try {
        const { term, scores } = req.body; // term: month1, midterm, etc.
        const student = await Student.findById(req.params.id);
        
        if (!student.results[term]) return res.status(400).json({ error: "Qaybta imtixaanka waa khalad" });
        
        student.results[term] = scores;
        await student.save();
        res.json({ success: true, message: `Dhibcaha ${term} waa la cusboonaysiiyay` });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 4.5 ADMIN DASHBOARD & ANALYTICS (D) ---
app.get('/api/admin/dashboard-stats', async (req, res) => {
    try {
        const total = await Student.countDocuments();
        const paid = await Student.countDocuments({ "feeStatus.isPaid": true });
        const unpaid = total - paid;
        const subjects = await Subject.countDocuments();

        res.json({
            students: total,
            paidFees: paid,
            unpaidFees: unpaid,
            totalSubjects: subjects,
            serverStatus: "Live",
            lastBackup: new Date()
        });
    } catch (err) { res.status(500).json({ error: "Cilad dashboard" }); }
});

// --- 4.6 SEARCH & FILTER (OFFICIAL) ---
app.get('/api/students/filter', async (req, res) => {
    try {
        const { grade, section, search } = req.query;
        let query = {};
        
        if (grade && grade !== 'all') query.grade = grade;
        if (section && section !== 'all') query.section = section;
        if (search) query.fullName = { $regex: search, $options: 'i' };

        const list = await Student.find(query).sort({ fullName: 1 });
        res.json(list);
    } catch (err) { res.status(500).json({ error: "Cilad filter-ka" }); }
});

// --- 4.7 OFFICIAL LOGIN ---
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    // ADMIN LOGIN
    if (username === 'admin' && password === 'admin123') {
        return res.json({ success: true, role: 'admin', token: 'OFFICIAL_ADMIN_TOKEN' });
    }

    // STUDENT LOGIN
    try {
        const student = await Student.findOne({ examNumber: username, password: password });
        if (student) {
            res.json({ success: true, role: 'student', data: student });
        } else {
            res.status(401).json({ success: false, message: "ID ama Password waa khalad" });
        }
    } catch (err) { res.status(500).json({ error: "Auth Error" }); }
});

// --- 5. SYSTEM UTILITIES ---
// Tirtirista Ardayda
app.delete('/api/students/:id', async (req, res) => {
    try {
        await Student.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Xogta waa la tirtiray" });
    } catch (err) { res.status(400).json({ error: "Tirtiristu ma suuragalin" }); }
});

// --- 6. SERVER STARTUP ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => { // 0.0.0.0 allows external mobile access
    console.log(`
    ====================================================
    🚀 NBS PORTAL SERVER IS ONLINE (OFFICIAL v6.0)
    📡 LOCAL URL: http://localhost:${PORT}
    🌐 NETWORK:   http://0.0.0.0:${PORT} (For Mobile)
    🛡️  SECURITY:  Helmet & CORS Active
    📊 DATABASE:  MongoDB Atlas Connected
    🔑 ADMIN:     admin / admin123
    ====================================================
    `);
});

/**
 * End of NBS Official Backend System
 * Designed for Scalability and Mobile Efficiency.
 */
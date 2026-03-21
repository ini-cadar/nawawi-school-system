/**
 * ============================================================================
 * NBS PORTAL - OFFICIAL ADVANCED BACKEND SYSTEM v4.0 (UPDATED)
 * ============================================================================
 * Features:
 * 1. Admin Login (Username: admin / Password: admin123)
 * 2. Dynamic Subject Management (CRUD)
 * 3. Student Management (Grade & Section Filtering)
 * 4. Automatic Attendance Bonus (10 Points)
 * 5. Auto-Calculation (Total, Average, Grade Letter)
 * 6. Official Database Connectivity (MongoDB Atlas)
 * 7. NEW: School Logo Support (Base64 Option)
 * 8. NEW: Student Gallery Image Support (Base64 Option)
 * ============================================================================
 */

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();

// --- 1. MIDDLEWARES & SECURITY ---
// Waxaan kordhiyey limit-ka JSON si sawirrada Base64 ay si xor ah ugu gudbaan
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());
app.use(express.static('public'));

// --- 2. DATABASE CONNECTION ---
// Hubi in xogtaada MongoDB ay si sax ah ugu xidhan tahay Cluster-kaaga
const MONGO_URI = "mongodb+srv://raazicadar_db_user:inicadar1234.@cluster0.z93llyc.mongodb.net/school_db?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: true
})
.then(() => {
    console.log('----------------------------------------------------');
    console.log('✅ NBS DATABASE: Connected Successfully!');
    console.log('📅 Time:', new Date().toLocaleString());
    console.log('----------------------------------------------------');
})
.catch(err => {
    console.error('❌ CRITICAL DB ERROR:', err);
    process.exit(1); // Jooji server-ka haddii database-ku diido
});

// --- 3. MODELS & SCHEMAS ---

// Schema-da Maadooyinka (Subjects)
const subjectSchema = new mongoose.Schema({
    name: { type: String, unique: true, required: true, trim: true },
    code: { type: String, uppercase: true }, 
    createdAt: { type: Date, default: Date.now }
});
const Subject = mongoose.model('Subject', subjectSchema);

// Schema-da Ardayga (Detailed Student Schema)
const studentSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true },
    examNumber: { type: String, unique: true, required: true, uppercase: true },
    password: { type: String, default: '123456' },
    grade: { type: String, required: true }, // Grade 9, 10, 11, 12
    section: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
    
    // --- NEW OPTIONS ADDED BELOW (Sida aad codsatay) ---
    profileImage: { type: String, default: "" }, // Gallery image option (Base64)
    schoolLogo: { type: String, default: "" },   // School Logo option (Base64)
    // --------------------------------------------------

    // Status & Academic Performance
    feePaid: { type: Boolean, default: false },
    presentToday: { type: Boolean, default: false },
    attScore: { type: Number, default: 0 }, // Attendance Bonus logic

    // Results Array
    examScores: [{ 
        subject: String, 
        score: { type: Number, default: 0 }, 
        gradeLetter: { type: String, default: 'F' } 
    }],

    // Auto-Calculated Fields
    totalScore: { type: Number, default: 0 },
    average: { type: Number, default: 0 },
    overallStatus: { type: String, default: 'Fail' },
    lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

/**
 * AUTOMATIC CALCULATION MIDDLEWARE
 * Logic-gan wuxuu xisaabiyaa natiijada mar kasta oo arday xogtiisa la kaydinayo
 */
studentSchema.pre('save', function(next) {
    let totalMarks = 0;
    
    // 1. Loop dhexmar maado kasta si loo helo Grade-ka (A, B, C...)
    this.examScores.forEach(s => {
        if (s.score >= 90) s.gradeLetter = 'A';
        else if (s.score >= 80) s.gradeLetter = 'B';
        else if (s.score >= 70) s.gradeLetter = 'C';
        else if (s.score >= 50) s.gradeLetter = 'D';
        else s.gradeLetter = 'F';
        
        totalMarks += s.score;
    });

    // 2. Ku dar Attendance Bonus (haddii uu 'Present' yahay)
    this.attScore = this.presentToday ? 10 : 0;
    this.totalScore = totalMarks + this.attScore;

    // 3. Xisaabi Average-ka (Isugeyn / Maadooyinka)
    const subCount = this.examScores.length > 0 ? this.examScores.length : 1;
    this.average = Math.round(this.totalScore / (subCount + 0.1));

    // 4. Go'aami Pass ama Fail (Official pass mark is 50)
    this.overallStatus = (this.average >= 50) ? 'Pass' : 'Fail';
    this.lastUpdated = Date.now();

    next();
});

const Student = mongoose.model('Student', studentSchema);

// --- 4. SUBJECT API (CRUD OPERATIONS) ---

app.get('/api/subjects', async (req, res) => {
    try {
        const subjects = await Subject.find().sort({ name: 1 });
        res.status(200).json(subjects);
    } catch (err) {
        res.status(500).json({ error: "Maadooyinka lama soo kicin karo" });
    }
});

app.post('/api/subjects', async (req, res) => {
    try {
        const newSub = new Subject(req.body);
        await newSub.save();
        res.status(201).json({ success: true, message: "Maadada waa la daray!" });
    } catch (e) { 
        res.status(400).json({ error: "Maadadani way jirtaa ama xogta waa khalad!" }); 
    }
});

app.delete('/api/subjects/:id', async (req, res) => {
    try {
        await Subject.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Maadada waa la tirtiray" });
    } catch (err) {
        res.status(400).json({ error: "Tirtiristu ma suuragalin" });
    }
});

// --- 5. STUDENT API (MANAGEMENT & SEARCH) ---

// Filtered Search (Grade, Section, Name)
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
    } catch (err) { 
        res.status(500).json({ error: "Cilad ayaa ku timid soo kicinta ardayda" }); 
    }
});

// Registration with Auto-Subject Mapping
app.post('/api/register', async (req, res) => {
    try {
        const subs = await Subject.find();
        // Ardayga cusub si otomaatig ah ayaa loogu darayaa maadooyinka jira iyagoo eber ah
        const initialScores = subs.map(s => ({ 
            subject: s.name, 
            score: 0, 
            gradeLetter: 'F' 
        }));
        
        const newStudent = new Student({ 
            ...req.body, 
            examScores: initialScores 
        });

        await newStudent.save();
        res.status(201).json({ success: true, message: "Ardayga waa la keydiyay!" });
    } catch (e) { 
        res.status(400).json({ error: "ID-ga ardayga hore ayaa loo isticmaalay!" }); 
    }
});

// Multi-Purpose Update (Attendance, Exam, Profile)
app.put('/api/student/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if(!student) return res.status(404).json({ error: "Ardayga lama helin" });

        // Cusboonaysii xogta la soo diray (Profile, Exam, Attendance, or New Options)
        Object.assign(student, req.body);
        
        // Middleware-ka kore ayaa xisaabinaya natiijada markale ka hor save-ka
        await student.save(); 
        res.status(200).json({ success: true, data: student });
    } catch (e) { 
        res.status(500).json({ error: "Cusboonaysiintu ma suuragalin: " + e.message }); 
    }
});

app.delete('/api/student/:id', async (req, res) => {
    try {
        await Student.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Ardayga waa la tirtiray" });
    } catch (err) {
        res.status(400).json({ error: "Cilad baa dhacday" });
    }
});

// --- 6. OFFICIAL LOGIN CORE ---
app.post('/api/login', async (req, res) => {
    const { roll, pass } = req.body;
    
    // --- OFFICIAL ADMIN CREDENTIALS ---
    // Sidii aad codsatay: Password-ka waa admin123
    if (roll === 'admin' && pass === 'admin123') {
        console.log('🔑 Admin logged in at:', new Date().toLocaleTimeString());
        return res.status(200).json({ 
            success: true, 
            role: 'admin', 
            message: "Welcome Admin" 
        });
    }

    // --- STUDENT CREDENTIALS CHECK ---
    try {
        const student = await Student.findOne({ examNumber: roll, password: pass });
        if (student) {
            res.status(200).json({ 
                success: true, 
                role: 'student', 
                data: student 
            });
        } else {
            res.status(401).json({ 
                success: false, 
                error: 'Aqoonsigaagu waa khalad! Hubi ID-ga iyo Password-ka.' 
            });
        }
    } catch (e) { 
        res.status(500).json({ error: "Server Login Error" }); 
    }
});

// --- 7. SERVER INITIALIZATION ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
    ===============================================
    🚀 NBS PORTAL SERVER IS ONLINE & OFFICIAL
    📡 URL: http://localhost:${PORT}
    🛡️  ADMIN ACCESS: admin / admin123
    💾 DATABASE: MongoDB Connected
    📸 NEW FEATURES: Logo & Gallery Supported
    ===============================================
    `);
});

/**
 * Dhamaad: Koodhkan wuxuu diyaar u yahay in loo isticmaalo 
 * nidaamka rasmiga ah ee Nawawi School Portal.
 */
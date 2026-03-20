/**
 * ============================================================
 * NBS PORTAL - ADVANCED BACKEND SYSTEM v3.0
 * ============================================================
 * Features Included:
 * 1. Subject Management (CRUD)
 * 2. Student Management (Grade & Section Filtering)
 * 3. Automatic Attendance Bonus (10 Points)
 * 4. Auto-Calculation (Total, Average, Grade Letter)
 * 5. Admin Password Management
 * 6. Detailed Login Logic (Admin & Student)
 * ============================================================
 */

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();

// --- MIDDLEWARES ---
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// --- 1. DATABASE CONNECTION ---
// Hubi in xogtaada MongoDB ay sax tahay
const MONGO_URI = "mongodb+srv://raazicadar_db_user:inicadar1234.@cluster0.z93llyc.mongodb.net/school_db?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ NBS DATABASE: Connected Successfully!'))
.catch(err => console.error('❌ DB ERROR:', err));

// --- 2. MODELS & SCHEMAS ---

// Schema-da Maadooyinka
const subjectSchema = new mongoose.Schema({
    name: { type: String, unique: true, required: true },
    code: String // Tusaale: MATH101
});
const Subject = mongoose.model('Subject', subjectSchema);

// Schema-da Ardayga (Improved)
const studentSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    examNumber: { type: String, unique: true, required: true },
    password: { type: String, default: '123456' },
    grade: { type: String, required: true }, // 9, 10, 11, 12
    section: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
    
    // Family Info
    fatherPhone: String,
    motherName: String,

    // Status & Attendance
    feePaid: { type: Boolean, default: false },
    presentToday: { type: Boolean, default: false },
    attScore: { type: Number, default: 0 }, // Bonus 10 points

    // Results Array
    examScores: [{ 
        subject: String, 
        score: { type: Number, default: 0 }, 
        gradeLetter: { type: String, default: 'F' } 
    }],

    // Auto-Calculated Fields
    totalScore: { type: Number, default: 0 },
    average: { type: Number, default: 0 },
    overallStatus: { type: String, default: 'Fail' }
}, { timestamps: true });

/**
 * AUTOMATIC CALCULATION MIDDLEWARE
 * Qaybtani waxay xisaabisaa natiijada ka hor intaan la keydin ardayga
 */
studentSchema.pre('save', function(next) {
    let totalMarks = 0;
    
    // 1. Xisaabi Maado kasta Grade-keeda
    this.examScores.forEach(s => {
        if (s.score >= 90) s.gradeLetter = 'A';
        else if (s.score >= 80) s.gradeLetter = 'B';
        else if (s.score >= 70) s.gradeLetter = 'C';
        else if (s.score >= 50) s.gradeLetter = 'D';
        else s.gradeLetter = 'F';
        
        totalMarks += s.score;
    });

    // 2. Ku dar Attendance Bonus (haddii uu joogo)
    this.totalScore = totalMarks + (this.attScore || 0);

    // 3. Xisaabi Average-ka (Isugeyn / Maadooyinka + Attendance weight)
    const subCount = this.examScores.length || 1;
    this.average = Math.round(this.totalScore / (subCount + 0.1));

    // 4. Go'aami Pass/Fail
    this.overallStatus = (this.average >= 50) ? 'Pass' : 'Fail';

    next();
});

const Student = mongoose.model('Student', studentSchema);

// --- 3. SUBJECT API (CRUD) ---

app.get('/api/subjects', async (req, res) => {
    const subjects = await Subject.find().sort({ name: 1 });
    res.json(subjects);
});

app.post('/api/subjects', async (req, res) => {
    try {
        const newSub = new Subject(req.body);
        await newSub.save();
        res.json({ success: true, message: "Maadada waa la daray!" });
    } catch (e) { res.status(400).json({ error: "Maadadani way jirtaa!" }); }
});

app.delete('/api/subjects/:id', async (req, res) => {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

// --- 4. STUDENT API (MANAGEMENT) ---

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

        const students = await Student.find(query).sort({ fullName: 1 });
        res.json(students);
    } catch (err) { res.status(500).json({ error: "Cilad raadinta ah" }); }
});

// Registration with Auto-Subject mapping
app.post('/api/register', async (req, res) => {
    try {
        const subs = await Subject.find();
        const initial = subs.map(s => ({ subject: s.name, score: 0, gradeLetter: 'F' }));
        
        const newStudent = new Student({ 
            ...req.body, 
            examScores: initial 
        });

        await newStudent.save();
        res.json({ success: true, message: "Ardayga waa la keydiyay!" });
    } catch (e) { res.status(400).json({ error: "ID-ga hore ayaa loo isticmaalay!" }); }
});

// Multi-Purpose Update (Attendance, Exam, Profile)
app.put('/api/student/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if(!student) return res.status(404).json({ error: "Ardayga lama helin" });

        // Haddii xadirin la soo diray (Attendance logic)
        if (req.body.presentToday !== undefined) {
            student.presentToday = req.body.presentToday;
            student.attScore = req.body.presentToday ? 10 : 0;
        }

        // Cusboonaysii xogta kale
        Object.assign(student, req.body);
        
        await student.save(); // Middleware-ka kore ayaa xisaabinaya natiijada
        res.json({ success: true, data: student });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Password Change Route
app.post('/api/change-password', async (req, res) => {
    const { id, newPassword } = req.body;
    try {
        await Student.findByIdAndUpdate(id, { password: newPassword });
        res.json({ success: true, message: "Password-ka waa la beddelay!" });
    } catch (e) { res.status(500).json({ error: "Cilad beddelka password-ka" }); }
});

app.delete('/api/student/:id', async (req, res) => {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

// --- 5. LOGIN CORE ---
app.post('/api/login', async (req, res) => {
    const { roll, pass } = req.body;
    
    // ADMIN CREDENTIALS
    if(roll === 'admin' && pass === 'admin1234') {
        return res.json({ role: 'admin' });
    }

    // STUDENT CREDENTIALS
    try {
        const s = await Student.findOne({ examNumber: roll, password: pass });
        if(s) res.json({ role: 'student', data: s });
        else res.status(401).json({ error: 'Aqoonsigaagu waa khalad!' });
    } catch (e) { res.status(500).json({ error: "Server Error" }); }
});

// --- 6. SERVER INITIALIZATION ---
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`
    ***********************************************
    🚀 NBS PORTAL SERVER IS ONLINE
    📡 ADDRESS: http://localhost:${PORT}
    🛡️  ADMIN: admin / admin1234
    ***********************************************
    `);
});
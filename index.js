/**
 * ============================================================================
 * NBS PORTAL - OFFICIAL ADVANCED BACKEND SYSTEM v5.5
 * ============================================================================
 * DEVELOPER: RAZIC ADAR & GEMINI COLLABORATION
 * LINES: 300+ (Professional Architecture)
 * FEATURES: 
 * - Secure Login (Admin/Student)
 * - Real-time GPA Calculation (Scale 4.0)
 * - Base64 Gallery Image Upload Support
 * - MongoDB Atlas Integration
 * - Global CORS & 0.0.0.0 IP Binding
 * ============================================================================
 */

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet'); // Security enhancement
require('dotenv').config();

const app = express();

// --- 1. MIDDLEWARE CONFIGURATION ---
// Waxaan u oggolaanray in moobiladu ay sawirro waaweyn soo dhigi karaan (Gallery Upload)
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false })); // Protections against web attacks
app.use(express.json({ limit: '20mb' })); // Kordhinta xadka sawirka gallery-ga
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(express.static('public'));

// --- 2. DATABASE CONNECTIVITY ---
// NBS Official MongoDB Connection String
const MONGO_URI = "mongodb+srv://raazicadar_db_user:inicadar1234.@cluster0.z93llyc.mongodb.net/school_db?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: true
})
.then(() => {
    console.log('====================================================');
    console.log('✅ NBS DATABASE: Connection Established!');
    console.log('📡 Status: Ready for Mobile & Desktop Requests');
    console.log('📅 Date:', new Date().toString());
    console.log('====================================================');
})
.catch(err => {
    console.error('❌ CRITICAL ERROR: Database connection failed!');
    console.error('Reason:', err.message);
    process.exit(1); 
});

// --- 3. DATA MODELS (SCHEMAS) ---

// Subject Schema: Maareynta Maadooyinka
const subjectSchema = new mongoose.Schema({
    name: { type: String, unique: true, required: true, trim: true },
    code: { type: String, uppercase: true }, 
    createdAt: { type: Date, default: Date.now }
});
const Subject = mongoose.model('Subject', subjectSchema);

// Student Schema: Maareynta Ardayda (GPA & Image Support)
const studentSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true },
    examNumber: { type: String, unique: true, required: true, uppercase: true },
    password: { type: String, default: '123456' },
    grade: { type: String, required: true }, 
    section: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
    
    // IMAGE SUPPORT: Halkan waxaa lagu kaydiyaa sawirka Gallery-ga
    profileImage: { type: String, default: '' }, 
    
    // Status Fields
    feePaid: { type: Boolean, default: false },
    presentToday: { type: Boolean, default: false },
    attScore: { type: Number, default: 0 }, 

    // Academic Performance Data
    examScores: [{ 
        subject: String, 
        score: { type: Number, default: 0 }, 
        gradeLetter: { type: String, default: 'F' },
        gradePoint: { type: Number, default: 0 } 
    }],

    totalScore: { type: Number, default: 0 },
    average: { type: Number, default: 0 },
    gpa: { type: Number, default: 0.0 }, // 4.0 Scale GPA
    overallStatus: { type: String, default: 'Fail' },
    lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

/**
 * NBS CALCULATION ENGINE (Middleware)
 * Midkani wuxuu xisaabiyaa Average-ka iyo GPA-ga si otomaatig ah
 */
studentSchema.pre('save', function(next) {
    console.log('🔄 Calculating academic results for:', this.fullName);
    
    let totalMarks = 0;
    let totalGPAUnits = 0;
    
    this.examScores.forEach(s => {
        // GPA & Grade Letter Logic (Standard Scale)
        if (s.score >= 90) { s.gradeLetter = 'A'; s.gradePoint = 4.0; }
        else if (s.score >= 80) { s.gradeLetter = 'B'; s.gradePoint = 3.0; }
        else if (s.score >= 70) { s.gradeLetter = 'C'; s.gradePoint = 2.0; }
        else if (s.score >= 50) { s.gradeLetter = 'D'; s.gradePoint = 1.0; }
        else { s.gradeLetter = 'F'; s.gradePoint = 0.0; }
        
        totalMarks += s.score;
        totalGPAUnits += s.gradePoint;
    });

    // Attendance Bonus Logic
    this.attScore = this.presentToday ? 10 : 0;
    this.totalScore = totalMarks + this.attScore;

    // Averages and Final GPA calculation
    const subCount = this.examScores.length > 0 ? this.examScores.length : 1;
    this.average = Math.round(this.totalScore / (subCount + 0.1));
    this.gpa = parseFloat((totalGPAUnits / subCount).toFixed(2));

    // Status: Pass or Fail
    this.overallStatus = (this.average >= 50) ? 'Pass' : 'Fail';
    this.lastUpdated = Date.now();

    next();
});

const Student = mongoose.model('Student', studentSchema);

// --- 4. SUBJECT API ROUTES ---

app.get('/api/subjects', async (req, res) => {
    try {
        const subjects = await Subject.find().sort({ name: 1 });
        res.status(200).json(subjects);
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post('/api/subjects', async (req, res) => {
    try {
        const newSub = new Subject(req.body);
        await newSub.save();
        res.status(201).json({ success: true, message: "Maadada waa la keydiyay!" });
    } catch (e) { 
        res.status(400).json({ error: "Maadadani horey ayay u jirtay!" }); 
    }
});

app.delete('/api/subjects/:id', async (req, res) => {
    try {
        await Subject.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: "Maadada lama tirtiri karo" });
    }
});

// --- 5. STUDENT MANAGEMENT API ---

// Faahfaahin: Soo kicinta ardayda leh Search & Filter
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
        res.status(500).json({ error: "Cilad xogta ardayda ah" }); 
    }
});

// Faahfaahin: Diiwaangelinta Arday Cusub
app.post('/api/register', async (req, res) => {
    try {
        console.log('📝 Registering new student:', req.body.fullName);
        const subs = ["Math", "English", "Arabic", "Tarbiya", "Chemistry", "Physics", "History", "Geography", "Somali", "ICT", "Biology"];
        const initialScores = subs.map(s => ({ 
            subject: s, 
            score: 0, 
            gradeLetter: 'F',
            gradePoint: 0
        }));
        
        const newStudent = new Student({ 
            ...req.body, 
            examScores: initialScores 
        });

        await newStudent.save();
        res.status(201).json({ success: true });
    } catch (e) { 
        res.status(400).json({ error: "ID-ga ardayga ama xogta waa khalad" }); 
    }
});

// Faahfaahin: Wax ka beddelka (Sawirka Gallery-ga, Dhibcaha, ama Profile-ka)
app.put('/api/student/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if(!student) return res.status(404).json({ error: "Ardayga lama helin" });

        // Tani waxay aqbashaa sawirka Base64 ee Gallery-ga laga soo upload gareeyey
        Object.assign(student, req.body);
        
        await student.save(); 
        console.log('✅ Student updated:', student.fullName);
        res.status(200).json({ success: true, data: student });
    } catch (e) { 
        res.status(500).json({ error: "Error: " + e.message }); 
    }
});

// Faahfaahin: Tirtirista Ardayga
app.delete('/api/student/:id', async (req, res) => {
    try {
        await Student.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Ardayga waa la tirtiray" });
    } catch (err) {
        res.status(400).json({ error: "Tirtiristu ma suuragalin" });
    }
});

// --- 6. AUTHENTICATION SYSTEM ---

app.post('/api/login', async (req, res) => {
    const { roll, pass } = req.body;
    
    // Admin Override
    if (roll === 'admin' && pass === 'admin123') {
        return res.status(200).json({ 
            success: true, 
            role: 'admin', 
            message: "NBS Admin Access Granted" 
        });
    }

    // Student Login Lookup
    try {
        const student = await Student.findOne({ examNumber: roll, password: pass });
        if (student) {
            console.log('🎓 Student Login:', student.fullName);
            res.status(200).json({ 
                success: true, 
                role: 'student', 
                data: student 
            });
        } else {
            res.status(401).json({ 
                success: false, 
                error: 'ID-ga ama Password-ka waa khalad!' 
            });
        }
    } catch (e) { 
        res.status(500).json({ error: "Authentication Failure" }); 
    }
});

// --- 7. SERVER INITIALIZATION & LISTENING ---

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Inay moobiladu u furan tahay

app.listen(PORT, HOST, () => {
    console.log('====================================================');
    console.log('🚀 NBS PORTAL BACKEND IS LIVE & SECURE');
    console.log(`📡 URL: http://${HOST}:${PORT}`);
    console.log('🛠️  Ready for: Registration, Grading, & GPA');
    console.log('====================================================');
});

// --- END OF CODE (OFFICIAL NBS SYSTEM) ---
/**
 * NBS PORTAL - BACKEND CORE SYSTEM
 * Features: Student Management, Subject Management, 
 * Auto-Grading, Attendance with Bonus Points.
 */

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors'); // Lagu daray si uu ula shaqeeyo front-end kasta
require('dotenv').config();

const app = express();

// --- MIDDLEWARES ---
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// --- 1. MONGODB CONNECTION ---
// Hubi in URI-gaagu sax yahay, waxaan ku daray xulashooyin adag
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://raazicadar_db_user:inicadar1234.@cluster0.z93llyc.mongodb.net/school_db?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ NBS Database Connected Successfully!'))
.catch(err => console.error('❌ DB Connection Error:', err));

// --- 2. SCHEMAS & MODELS ---

// Schema-da Maadooyinka
const subjectSchema = new mongoose.Schema({
    name: { type: String, unique: true, required: true },
    addedAt: { type: Date, default: Date.now }
});
const Subject = mongoose.model('Subject', subjectSchema);

// Schema-da Ardayga (Waa la kordhiyey)
const studentSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true },
    examNumber: { type: String, unique: true, required: true },
    password: { type: String, default: '123456' },
    grade: { type: String, required: true }, // 9, 10, 11, 12
    section: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
    
    // Fee & Attendance
    feePaid: { type: Boolean, default: false },
    presentToday: { type: Boolean, default: false },
    attScore: { type: Number, default: 0, max: 10 }, // 10 dhibcood ee xadirinta
    
    // Exam Results
    examScores: [{ 
        subject: String, 
        score: { type: Number, default: 0 }, 
        gradeLetter: { type: String, default: 'F' } 
    }],
    
    // Calculated Totals (Optional but good for performance)
    totalScore: { type: Number, default: 0 },
    average: { type: Number, default: 0 },
    overallGrade: { type: String, default: 'F' }
}, { timestamps: true });

// Function otomaatig u xisaabinaya Grade-ka ka hor intaan la keydin (Middleware)
studentSchema.pre('save', function(next) {
    let sum = 0;
    this.examScores.forEach(s => {
        // Maado kasta Grade-keeda gooni u xisaabi
        if (s.score >= 90) s.gradeLetter = 'A';
        else if (s.score >= 80) s.gradeLetter = 'B';
        else if (s.score >= 60) s.gradeLetter = 'C';
        else if (s.score >= 50) s.gradeLetter = 'D';
        else s.gradeLetter = 'F';
        
        sum += s.score;
    });

    // Total = Dhibcaha Imtixaanka + Dhibcaha Xadirinta
    this.totalScore = sum + (this.attScore || 0);
    
    // Average (11 Maado + Attendance)
    const count = this.examScores.length > 0 ? this.examScores.length : 1;
    this.average = Math.round(this.totalScore / (count + 0.1)); // 0.1 waa attendance weight

    if (this.average >= 90) this.overallGrade = 'A';
    else if (this.average >= 80) this.overallGrade = 'B';
    else if (this.average >= 60) this.overallGrade = 'C';
    else if (this.average >= 50) this.overallGrade = 'D';
    else this.overallGrade = 'F';

    next();
});

const Student = mongoose.model('Student', studentSchema);

// --- 3. API ROUTES (SUBJECTS) ---

app.get('/api/subjects', async (req, res) => {
    try {
        const subjects = await Subject.find().sort({ name: 1 });
        res.json(subjects);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/subjects', async (req, res) => {
    try {
        const newSub = new Subject(req.body);
        await newSub.save();
        res.status(201).json({ success: true, message: "Maadada waa la daray!" });
    } catch (e) { res.status(400).json({ error: "Maadadani horey ayay u jirtay." }); }
});

app.delete('/api/subjects/:id', async (req, res) => {
    try {
        await Subject.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Maadada waa la tirtiray!" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- 4. API ROUTES (STUDENTS) ---

// Soo saarida Ardayda iyadoo la isticmaalayo FILTER adag
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
        if (grade && grade !== "") query.grade = grade;
        if (section && section !== "") query.section = section;

        const students = await Student.find(query).sort({ fullName: 1 });
        res.json(students);
    } catch (err) { res.status(500).json({ error: "Cilad baa ka dhacday raadinta." }); }
});

// Diiwaangelinta Arday cusub
app.post('/api/register', async (req, res) => {
    try {
        // Marka arday la diiwaangelinayo, soo qaad dhamaan maadooyinka jira
        const currentSubjects = await Subject.find();
        const initialScores = currentSubjects.map(s => ({ 
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
        res.status(400).json({ error: "Roll Number-kan horey ayaa loo isticmaalay!" }); 
    }
});

/**
 * UPDATE STUDENT (Xogta, Exams, iyo Attendance)
 * Qaybtan waxay automatic u xisaabisaa natiijada cusub
 */
app.put('/api/student/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ error: "Ardayga lama helin" });

        // Cusboonaysii xogta timi (Scores, Fee, Attendance, etc.)
        Object.assign(student, req.body);
        
        // Keydi (Tani waxay kicinaysaa 'pre-save' middleware-ka kore ee xisaabinta)
        await student.save();
        
        res.json({ success: true, message: "Xogta waa la cusboonaysiiyay!", data: student });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Tirtir arday
app.delete('/api/student/:id', async (req, res) => {
    try {
        await Student.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Ardayga waa la tirtiray!" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- 5. LOGIN LOGIC ---
app.post('/api/login', async (req, res) => {
    try {
        const { roll, pass } = req.body;
        
        // Admin Login
        if(roll === 'admin' && pass === 'admin1234') {
            return res.json({ role: 'admin' });
        }

        // Student Login
        const student = await Student.findOne({ examNumber: roll, password: pass });
        if(student) {
            res.json({ role: 'student', data: student });
        } else {
            res.status(401).json({ error: 'ID-ga ama Password-ka waa khaldan yahay!' });
        }
    } catch (e) { res.status(500).json({ error: "Server error" }); }
});

// --- 6. SERVER START ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
    ===========================================
    🚀 NBS PORTAL SERVER IS RUNNING
    🔗 URL: http://localhost:${PORT}
    📅 Date: ${new Date().toLocaleString()}
    ===========================================
    `);
});
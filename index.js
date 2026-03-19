const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static('public'));

// 1. Isku xirka MongoDB (Xogtaada gaarka ah)
const MONGO_URI = "mongodb+srv://raazicadar_db_user:inicadar1234.@cluster0.z93llyc.mongodb.net/school_db?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
    .then(() => console.log('NBS Database Connected Successfully!'))
    .catch(err => console.error('DB Connection Error:', err));

// 2. Schema-da Ardayga (Dhammaystiran)
const studentSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    motherName: String,
    fatherPhone: String,
    motherPhone: String,
    examNumber: { type: String, unique: true, required: true },
    password: { type: String, default: '123456' },
    grade: { type: String, required: true },
    feePaid: { type: Boolean, default: false },
    attendance: [{ date: String, shift: String, status: String }],
    examScores: [{ 
        subject: String, 
        score: { type: Number, default: 0 }, 
        gradeLetter: { type: String, default: 'F' } 
    }]
});

const Student = mongoose.model('Student', studentSchema);

// --- 3. API-ga RAADINTA (SEARCH LOGIC) ---
// Kani waa qaybtii aad codsatay si ardayda loo raadiyo
app.get('/api/students', async (req, res) => {
    try {
        const { search } = req.query; 
        let query = {};

        if (search) {
            query = {
                $or: [
                    { fullName: { $regex: search, $options: 'i' } },
                    { examNumber: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const students = await Student.find(query);
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: "Cilad ayaa ku timid raadinta ardayda." });
    }
});

// 4. Admin: Diiwaangelinta Arday Cusub
app.post('/api/register', async (req, res) => {
    try {
        const subjects = ["Tarbiya", "Carabi", "Soomaali", "English", "Math", "Physics", "Chemistry", "Biology", "Geography", "History", "ICT", "Business"];
        const initialScores = subjects.map(s => ({ subject: s, score: 0, gradeLetter: 'F' }));
        
        const newStudent = new Student({ 
            ...req.body, 
            examScores: initialScores 
        });

        await newStudent.save();
        res.json({ success: true, message: "Ardayga waa la diiwaangeliyay!" });
    } catch (e) { 
        res.status(500).json({ error: e.message }); 
    }
});

// 5. Admin: Cusboonaysiinta Lacagta & Imtixaanka
app.put('/api/student/:id', async (req, res) => {
    try {
        await Student.findByIdAndUpdate(req.params.id, req.body);
        res.json({ success: true, message: "Xogta waa la cusboonaysiiyay!" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 6. Login Core (Admin & Student)
app.post('/api/login', async (req, res) => {
    try {
        const { roll, pass } = req.body;

        // Admin Login
        if(roll === 'admin' && pass === 'admin1234') {
            return res.json({ role: 'admin' });
        }

        // Student Login
        const s = await Student.findOne({ examNumber: roll, password: pass });
        if(s) {
            res.json({ role: 'student', data: s });
        } else {
            res.status(401).json({ error: 'Aqoonsigaagu waa khaldan yahay!' });
        }
    } catch (e) {
        res.status(500).json({ error: "Cilad ayaa dhacday." });
    }
});

// 7. Frontend Routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 8. Server Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`NBS System is running on port ${PORT}`);
});
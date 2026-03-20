const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static('public'));

// 1. Isku xirka MongoDB
const MONGO_URI = "mongodb+srv://raazicadar_db_user:inicadar1234.@cluster0.z93llyc.mongodb.net/school_db?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
    .then(() => console.log('NBS Database Connected!'))
    .catch(err => console.error('DB Connection Error:', err));

// 2. Schema-da Maadooyinka (Si maadooyinka loo kordhiyo ama looga yareeyo)
const subjectSchema = new mongoose.Schema({
    name: { type: String, unique: true, required: true }
});
const Subject = mongoose.model('Subject', subjectSchema);

// 3. Schema-da Ardayga (Updated)
const studentSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    motherName: String,
    fatherPhone: String,
    motherPhone: String,
    examNumber: { type: String, unique: true, required: true },
    password: { type: String, default: '123456' },
    grade: { type: String, required: true }, // Tusaale: 12aad
    section: { type: String, enum: ['A', 'B', 'C', 'D'], required: true }, // Fasalka (A, B, C)
    feePaid: { type: Boolean, default: false },
    examScores: [{ 
        subject: String, 
        score: { type: Number, default: 0 }, 
        gradeLetter: { type: String, default: 'F' } 
    }]
});

const Student = mongoose.model('Student', studentSchema);

// --- 4. MAAMULKA MAADOOYINKA (SUBJECT MANAGEMENT) ---

// Soo saar dhamaan maadooyinka jira
app.get('/api/subjects', async (req, res) => {
    const subjects = await Subject.find();
    res.json(subjects);
});

// Ku dar maado cusub
app.post('/api/subjects', async (req, res) => {
    try {
        const newSub = new Subject(req.body);
        await newSub.save();
        res.json({ success: true, message: "Maadada waa la daray!" });
    } catch (e) { res.status(500).json({ error: "Maadadani horey ayay u jirtay." }); }
});

// Tirtir maado
app.delete('/api/subjects/:id', async (req, res) => {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Maadada waa la tirtiray!" });
});

// --- 5. MAAMULKA ARDAYDA (STUDENT MANAGEMENT) ---

// Raadinta Ardayda (Filtering by Grade/Section/Name)
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
        if (grade) query.grade = grade;
        if (section) query.section = section;

        const students = await Student.find(query);
        res.json(students);
    } catch (err) { res.status(500).json({ error: "Cilad baa dhacday." }); }
});

// Diiwaangelinta Arday cusub (Isagoo wata maadooyinka hadda jira)
app.post('/api/register', async (req, res) => {
    try {
        const currentSubjects = await Subject.find();
        const initialScores = currentSubjects.map(s => ({ subject: s.name, score: 0, gradeLetter: 'F' }));
        
        const newStudent = new Student({ 
            ...req.body, 
            examScores: initialScores 
        });

        await newStudent.save();
        res.json({ success: true, message: "Ardayga iyo maadooyinkiisaba waa la keydiyay!" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// EDIT: Wax ka bedelka xogta ardayga (Xataa fasalka iyo magaca)
app.put('/api/student/:id', async (req, res) => {
    try {
        const updatedStudent = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: updatedStudent });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE: Tirtir arday
app.delete('/api/student/:id', async (req, res) => {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Ardayga waa la tirtiray!" });
});

// 6. Login Core
app.post('/api/login', async (req, res) => {
    const { roll, pass } = req.body;
    if(roll === 'admin' && pass === 'admin1234') return res.json({ role: 'admin' });

    const s = await Student.findOne({ examNumber: roll, password: pass });
    if(s) res.json({ role: 'student', data: s });
    else res.status(401).json({ error: 'Aqoonsigu waa khaldan yahay!' });
});

// 7. Server Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on: http://localhost:${PORT}`));
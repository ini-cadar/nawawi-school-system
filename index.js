const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Isku xidhka MongoDB
mongoose.connect("mongodb+srv://raaziwayrax_db_user:raasi1234@cluster0.cvcctca.mongodb.net/NawawiDB?retryWrites=true&w=majority")
.then(() => console.log("✅ NBS Official Database Connected"));

// Schema-ka rasmiga ah (12 Maado + Password + Attendance History)
const StudentSchema = new mongoose.Schema({
    nbsCode: { type: String, unique: true },
    password: { type: String, default: "123456" },
    fullName: String,
    class: { type: String, enum: ['9', '10', '11', '12'] },
    section: { type: String, enum: ['A', 'B', 'C', 'D'] },
    fees: { paid: { type: Number, default: 0 }, total: { type: Number, default: 1200 } },
    attendance: [{
        date: String,
        month: String,
        status: String, // 'P' ama 'A'
        session: String // 'Pre-Break' ama 'Post-Break'
    }],
    exam: {
        subjects: [
            { name: "Math", score: Number }, { name: "English", score: Number },
            { name: "Arabic", score: Number }, { name: "Islamic", score: Number },
            { name: "Physics", score: Number }, { name: "Chemistry", score: Number },
            { name: "Biology", score: Number }, { name: "History", score: Number },
            { name: "Geography", score: Number }, { name: "Somali", score: Number },
            { name: "ICT", score: Number }, { name: "Business", score: Number }
        ],
        total: Number, average: Number, grade: String
    }
});

const Student = mongoose.model('Student', StudentSchema);

// Official Authentication
app.post('/api/login', async (req, res) => {
    const { role, id, pass } = req.body;
    if (role === 'admin') {
        if (id === 'nawawi_admin' && pass === '7209379') return res.json({ success: true, role: 'admin' });
        return res.status(401).json({ message: "Admin details incorrect" });
    }
    const s = await Student.findOne({ nbsCode: id, password: pass });
    if (s) res.json({ success: true, role: 'student', data: s });
    else res.status(404).json({ message: "NBS Code ama Password waa khalad" });
});

// Admin: Save/Edit Student with 12 Subjects Auto-Calculation
app.post('/api/students', async (req, res) => {
    let d = req.body;
    if (d.exam && d.exam.subjects) {
        let total = d.exam.subjects.reduce((a, b) => a + Number(b.score || 0), 0);
        d.exam.total = total;
        d.exam.average = (total / 12).toFixed(2);
        d.exam.grade = d.exam.average >= 90 ? 'A' : d.exam.average >= 80 ? 'B' : d.exam.average >= 50 ? 'Pass' : 'Fail';
    }
    const s = await Student.findOneAndUpdate({ nbsCode: d.nbsCode }, d, { upsert: true, new: true });
    res.json(s);
});

app.get('/api/students/:c/:s', async (req, res) => {
    res.json(await Student.find({ class: req.params.c, section: req.params.s }));
});

app.listen(process.env.PORT || 3000);
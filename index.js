const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Isku xidhka Database-ka
mongoose.connect("mongodb+srv://raaziwayrax_db_user:raasi1234@cluster0.cvcctca.mongodb.net/NawawiDB?retryWrites=true&w=majority")
.then(() => console.log("✅ NBS System Online"));

// Schema dhammaystiran (12 Maado + Parent Info)
const StudentSchema = new mongoose.Schema({
    nbsCode: { type: String, unique: true },
    password: { type: String, default: "123456" },
    fullName: String,
    motherName: String,
    parentPhone1: String,
    parentPhone2: String,
    class: { type: String, enum: ['9', '10', '11', '12'] },
    section: { type: String, enum: ['A', 'B', 'C'] },
    fees: { paid: { type: Number, default: 0 }, total: { type: Number, default: 1200 } },
    attendance: [{ date: String, status: String }],
    exam: {
        subjects: [
            { name: String, score: Number }, { name: String, score: Number },
            { name: String, score: Number }, { name: String, score: Number },
            { name: String, score: Number }, { name: String, score: Number },
            { name: String, score: Number }, { name: String, score: Number },
            { name: String, score: Number }, { name: String, score: Number },
            { name: String, score: Number }, { name: String, score: Number }
        ],
        average: Number,
        rank: Number
    }
});

const Student = mongoose.model('Student', StudentSchema);

// Admin & Student Login
app.post('/api/login', async (req, res) => {
    const { role, id, pass } = req.body;
    if (role === 'admin' && id === 'nawawi_admin' && pass === '7209379') return res.json({ success: true, role: 'admin' });
    const s = await Student.findOne({ nbsCode: id, password: pass });
    if (s) res.json({ success: true, role: 'student', data: s });
    else res.status(401).send("Xog khaldan");
});

// Save/Update Student
app.post('/api/students/save', async (req, res) => {
    let d = req.body;
    if (d.exam && d.exam.subjects) {
        let total = d.exam.subjects.reduce((a, b) => a + Number(b.score || 0), 0);
        d.exam.average = (total / 12).toFixed(2);
    }
    const s = await Student.findOneAndUpdate({ nbsCode: d.nbsCode }, d, { upsert: true, new: true });
    res.json(s);
});

// Get Students by Class/Section
app.get('/api/students/:c/:s', async (req, res) => {
    const list = await Student.find({ class: req.params.c, section: req.params.s });
    res.json(list);
});

app.listen(process.env.PORT || 3000);
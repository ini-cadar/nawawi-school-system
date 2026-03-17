const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection
mongoose.connect("mongodb+srv://raaziwayrax_db_user:raasi1234@cluster0.cvcctca.mongodb.net/NawawiDB?retryWrites=true&w=majority")
.then(() => console.log("✅ NBS System Connected"));

const StudentSchema = new mongoose.Schema({
    nbsCode: { type: String, unique: true },
    password: { type: String, default: "123456" },
    fullName: String,
    motherName: String,
    parentPhone1: String,
    parentPhone2: String,
    class: String,
    section: String,
    fees: { paid: { type: Number, default: 0 }, total: { type: Number, default: 1200 } },
    attendance: [{ date: String, status: String }],
    exam: {
        subjects: [
            { name: { type: String, default: "Math" }, score: { type: Number, default: 0 } },
            { name: { type: String, default: "English" }, score: { type: Number, default: 0 } },
            { name: { type: String, default: "Arabic" }, score: { type: Number, default: 0 } },
            { name: { type: String, default: "Islamic" }, score: { type: Number, default: 0 } },
            { name: { type: String, default: "Physics" }, score: { type: Number, default: 0 } },
            { name: { type: String, default: "Chemistry" }, score: { type: Number, default: 0 } },
            { name: { type: String, default: "Biology" }, score: { type: Number, default: 0 } },
            { name: { type: String, default: "History" }, score: { type: Number, default: 0 } },
            { name: { type: String, default: "Geography" }, score: { type: Number, default: 0 } },
            { name: { type: String, default: "Somali" }, score: { type: Number, default: 0 } },
            { name: { type: String, default: "ICT" }, score: { type: Number, default: 0 } },
            { name: { type: String, default: "Business" }, score: { type: Number, default: 0 } }
        ],
        average: { type: Number, default: 0 }
    }
});

const Student = mongoose.model('Student', StudentSchema);

// Admin & Student Login
app.post('/api/login', async (req, res) => {
    const { role, id, pass } = req.body;
    if (role === 'admin' && id === 'nawawi_admin' && pass === '7209379') return res.json({ success: true, role: 'admin' });
    const s = await Student.findOne({ nbsCode: id, password: pass });
    if (s) res.json({ success: true, role: 'student', data: s });
    else res.status(401).json({ success: false });
});

// Admin Update Power - Bedel kasta halkan ayuu soo maraa
app.post('/api/admin/save', async (req, res) => {
    try {
        const { nbsCode, ...updateData } = req.body;
        const s = await Student.findOneAndUpdate({ nbsCode }, { $set: updateData }, { upsert: true, new: true });
        res.json({ success: true, data: s });
    } catch (err) { res.status(500).json({ success: false }); }
});

app.get('/api/students/:c/:s', async (req, res) => {
    res.json(await Student.find({ class: req.params.c, section: req.params.s }));
});

app.get('/api/student/:id', async (req, res) => {
    res.json(await Student.findOne({ nbsCode: req.params.id }));
});

app.listen(process.env.PORT || 3000);
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 1. ISKU-XIRKA MONGO-DB
const mongoURI = "mongodb+srv://raaziwayrax_db_user:raasi1234@cluster0.cvcctca.mongodb.net/NawawiDB?retryWrites=true&w=majority";
mongoose.connect(mongoURI).then(() => console.log("✅ Database Connected Successfully"));

// 2. SCHEMA-KA ARDAYGA
const StudentSchema = new mongoose.Schema({
    nbsCode: { type: String, unique: true, required: true },
    password: { type: String, default: "1234" },
    fullName: { type: String, required: true },
    class: { type: String, required: true }, 
    section: { type: String, required: true },
    fees: { paid: { type: Number, default: 0 }, total: { type: Number, default: 1200 } },
    attendance: [{ date: String, status: String }],
    exams: {
        exam1: [{ subject: String, score: { type: Number, default: 0 } }],
        exam2: [{ subject: String, score: { type: Number, default: 0 } }],
        exam3: [{ subject: String, score: { type: Number, default: 0 } }],
        exam4: [{ subject: String, score: { type: Number, default: 0 } }]
    }
});

const Student = mongoose.model('Student', StudentSchema);

// 3. API-YADA
// Login API
app.post('/api/login', async (req, res) => {
    const { username, password, role } = req.body;
    if (role === 'admin') {
        if (username === 'admin' && password === 'admin123') return res.json({ success: true, role: 'admin' });
    } else {
        const student = await Student.findOne({ nbsCode: username, password: password });
        if (student) return res.json({ success: true, role: 'student', data: student });
    }
    res.json({ success: false, message: "Xog khaldan!" });
});

// Admin: Save/Update Student
app.post('/api/admin/save', async (req, res) => {
    try {
        const { nbsCode, ...data } = req.body;
        await Student.findOneAndUpdate({ nbsCode }, data, { upsert: true });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

// Admin: Get Students (Fetch)
app.get('/api/students/:c/:s', async (req, res) => {
    const list = await Student.find({ class: req.params.c, section: req.params.s }).sort({fullName: 1});
    res.json(list);
});

// Admin: Delete Student
app.delete('/api/students/:id', async (req, res) => {
    await Student.deleteOne({ nbsCode: req.params.id });
    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server is Live on Port ${PORT}`));
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Isku xidhka Database-ka
const mongoURI = "mongodb+srv://raaziwayrax_db_user:raasi1234@cluster0.cvcctca.mongodb.net/NawawiDB?retryWrites=true&w=majority";

mongoose.connect(mongoURI, { maxPoolSize: 10 })
    .then(() => console.log("✅ NBS Database Connected - Full System Mode"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Ardayga Schema
const StudentSchema = new mongoose.Schema({
    nbsCode: { type: String, unique: true, required: true, index: true },
    password: { type: String, default: "123456" },
    fullName: { type: String, required: true },
    class: String,
    section: String,
    fees: { 
        paid: { type: Number, default: 0 }, 
        total: { type: Number, default: 1200 } 
    },
    attendance: [{ 
        date: { type: String, default: () => new Date().toLocaleDateString() }, 
        status: String 
    }],
    exam: {
        subjects: [{ name: String, score: Number }],
        average: { type: Number, default: 0 }
    }
});

const Student = mongoose.model('Student', StudentSchema);

// Login Logic
app.post('/api/login', async (req, res) => {
    try {
        const { role, id, pass } = req.body;
        if (role === 'admin' && id === 'nawawi_admin' && pass === '7209379') {
            return res.json({ success: true, role: 'admin' });
        }
        const s = await Student.findOne({ nbsCode: id, password: pass }).lean();
        if (s) res.json({ success: true, role: 'student', data: s });
        else res.status(401).json({ success: false });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// Admin Save - (Update Attendance, Fees, and Exams)
app.post('/api/admin/save', async (req, res) => {
    try {
        const { nbsCode, attendance, ...updateData } = req.body;
        let query = { $set: updateData };
        
        // Haddii attendance la soo diro, ku dar (Push)
        if (attendance) {
            query.$push = { attendance: attendance[0] };
        }

        const s = await Student.findOneAndUpdate({ nbsCode }, query, { upsert: true, new: true });
        res.json({ success: true, data: s });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// List by Class
app.get('/api/students/:c/:s', async (req, res) => {
    try {
        const list = await Student.find({ class: req.params.c, section: req.params.s }).sort({fullName: 1}).lean();
        res.json(list);
    } catch (err) {
        res.json([]);
    }
});

// Get Single Student
app.get('/api/student/:id', async (req, res) => {
    try {
        const s = await Student.findOne({ nbsCode: req.params.id }).lean();
        res.json(s);
    } catch (err) {
        res.json(null);
    }
});

// PORT Management (Render Fix)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 System running on Port ${PORT}`));
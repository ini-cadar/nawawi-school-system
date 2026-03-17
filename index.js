const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- 1. DATABASE CONNECTION ---
// Hubi in xogtan ay tahay midda saxda ah ee Cluster-kaaga
const mongoURI = "mongodb+srv://raaziwayrax_db_user:raasi1234@cluster0.cvcctca.mongodb.net/NawawiDB?retryWrites=true&w=majority";

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ NAWAWI SYSTEM: MongoDB is Connected!"))
    .catch(err => console.error("❌ CONNECTION ERROR:", err));

// --- 2. STUDENT DATA SCHEMA ---
const StudentSchema = new mongoose.Schema({
    nbsCode: { type: String, unique: true, required: true },
    password: { type: String, default: "123456" },
    fullName: { type: String, required: true },
    class: { type: String, required: true },
    section: { type: String, required: true },
    fees: { 
        paid: { type: Number, default: 0 }, 
        total: { type: Number, default: 1200 } 
    },
    attendance: [{ 
        date: String, 
        status: String 
    }],
    exam: { 
        subjects: [{ name: String, score: Number }], 
        average: { type: Number, default: 0 } 
    }
});

const Student = mongoose.model('Student', StudentSchema);

// --- 3. ADMIN & STUDENT LOGIN ---
app.post('/api/login', async (req, res) => {
    try {
        const { role, id, pass } = req.body;
        if (role === 'admin' && id === 'nawawi_admin' && pass === '7209379') {
            return res.json({ success: true, role: 'admin' });
        }
        const s = await Student.findOne({ nbsCode: id, password: pass }).lean();
        if (s) res.json({ success: true, role: 'student', data: s });
        else res.status(401).json({ success: false });
    } catch (err) { res.status(500).json({ success: false }); }
});

// --- 4. FETCH STUDENTS (Xogta soo dabacashada) ---
app.get('/api/students/:c/:s', async (req, res) => {
    try {
        const list = await Student.find({ class: req.params.c, section: req.params.s }).sort({fullName: 1});
        res.json(list);
    } catch (err) { res.status(500).json([]); }
});

// --- 5. GLOBAL SAVE SYSTEM (Keydinta Options-ka oo dhan) ---
app.post('/api/admin/save', async (req, res) => {
    try {
        const { nbsCode, attendance, exam, fees, ...rest } = req.body;
        let update = { $set: rest };

        if (attendance) update.$push = { attendance: attendance[0] };
        if (exam) update.$set.exam = exam;
        if (fees) update.$set.fees = fees;

        const result = await Student.findOneAndUpdate({ nbsCode }, update, { upsert: true, new: true });
        res.json({ success: true, data: result });
    } catch (err) {
        console.error("Save Error:", err);
        res.status(500).json({ success: false });
    }
});

// --- 6. SERVER START ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 NAWAWI SERVER IS RUNNING ON PORT ${PORT}`);
});
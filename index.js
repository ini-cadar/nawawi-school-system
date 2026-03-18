const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 1. ISKU-XIRKA DATABASE-KA
const mongoURI = "mongodb+srv://raaziwayrax_db_user:raasi1234@cluster0.cvcctca.mongodb.net/NawawiDB?retryWrites=true&w=majority";

mongoose.connect(mongoURI)
    .then(() => console.log("✅ DATABASE CONNECTED"))
    .catch(err => console.error("❌ DATABASE ERROR:", err));

// 2. SCHEMA-KA ARDAYGA
const StudentSchema = new mongoose.Schema({
    nbsCode: { type: String, unique: true, required: true },
    fullName: { type: String, required: true },
    class: { type: String, required: true },
    section: { type: String, required: true },
    fees: { paid: { type: Number, default: 0 }, total: { type: Number, default: 1200 } },
    attendance: [{ date: String, status: String }],
    exam: { 
        subjects: [{ name: String, score: Number }], 
        average: { type: Number, default: 0 } 
    }
});

const Student = mongoose.model('Student', StudentSchema);

// 3. API-YADA
// Soo saarista ardayda (Fetch)
app.get('/api/students/:c/:s', async (req, res) => {
    try {
        const list = await Student.find({ class: req.params.c, section: req.params.s }).sort({fullName: 1});
        res.json(list);
    } catch (err) { res.status(500).json([]); }
});

// Keydinta xogta (Save)
app.post('/api/admin/save', async (req, res) => {
    try {
        const { nbsCode, ...data } = req.body;
        await Student.findOneAndUpdate({ nbsCode }, data, { upsert: true, new: true });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// 4. KICINTA SERVER-KA
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
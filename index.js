const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- ISKU-XIRKA DATABASE-KA (HALKAN AYAA LA SAXAY) ---
// Hubi in password-ka 'admin123' uu yahay kan aad MongoDB Atlas u sameysay
const mongoURI = "mongodb+srv://raaziwayrax_db_user:<db_password>@cluster0.cvcctca.mongodb.net/?appName=Cluster0";
mongoose.connect(mongoURI)
    .then(() => console.log("✅ Database-ka waa lagu guulaystay!"))
    .catch(err => console.error("❌ Cilad xiriirka DB:", err));

// --- SCHEMA-KA ARDAYGA ---
const StudentSchema = new mongoose.Schema({
    nbsCode: { type: String, unique: true, required: true },
    password: { type: String, default: "1234" },
    fullName: { type: String, required: true },
    class: { type: String, required: true },
    section: { type: String, required: true },
    fees: { 
        paid: { type: Number, default: 0 }, 
        total: { type: Number, default: 1200 } 
    },
    attendance: [{ date: String, status: String }],
    exams: {
        exam1: [{ subject: String, score: Number }],
        exam2: [{ subject: String, score: Number }],
        exam3: [{ subject: String, score: Number }],
        exam4: [{ subject: String, score: Number }]
    }
});

const Student = mongoose.model('Student', StudentSchema);

// --- API-YADA (ROUTES) ---

// 1. LOGIN (Password-ka halkan ayaan ka beddelay)
app.post('/api/login', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        if (role === 'admin') {
            if (username === 'admin' && password === 'admin123') {
                return res.json({ success: true, role: 'admin' });
            }
        } else {
            const student = await Student.findOne({ nbsCode: username, password: password });
            if (student) return res.json({ success: true, role: 'student', data: student });
        }
        res.status(401).json({ success: false, message: "Username ama Password khaldan!" });
    } catch (err) { res.status(500).json({ success: false }); }
});

// 2. SAVE/UPDATE
app.post('/api/admin/save', async (req, res) => {
    try {
        const { nbsCode } = req.body;
        const updatedStudent = await Student.findOneAndUpdate(
            { nbsCode }, 
            req.body, 
            { upsert: true, new: true }
        );
        res.json({ success: true, data: updatedStudent });
    } catch (err) { res.status(500).json({ success: false }); }
});

// 3. FETCH BY CLASS
app.get('/api/students/:class/:section', async (req, res) => {
    try {
        const list = await Student.find({ class: req.params.class, section: req.params.section }).sort({ fullName: 1 });
        res.json(list);
    } catch (err) { res.status(500).json([]); }
});

// 4. DELETE
app.delete('/api/admin/student/:nbsCode', async (req, res) => {
    try {
        await Student.findOneAndDelete({ nbsCode: req.params.nbsCode });
        res.json({ success: true, message: "Ardayga waa la tirtiray" });
    } catch (err) { res.status(500).json({ success: false }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server: http://localhost:${PORT}`));
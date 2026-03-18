const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- ISKU-XIRKA DATABASE-KA ---
const mongoURI = "mongodb+srv://raaziwayrax_db_user:raasi1234@cluster0.cvcctca.mongodb.net/NawawiDB?retryWrites=true&w=majority";

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

// 1. LOGIN (Admin & Student)
app.post('/api/login', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        
        if (role === 'admin') {
            if (username === 'admin' && password === 'admin123') {
                return res.json({ success: true, role: 'admin' });
            }
        } else {
            const student = await Student.findOne({ nbsCode: username, password: password });
            if (student) {
                return res.json({ success: true, role: 'student', data: student });
            }
        }
        res.status(401).json({ success: false, message: "Username ama Password waa khaldan yihiin!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// 2. SAVE/UPDATE (Diiwaangelinta & Wax ka bedelka)
app.post('/api/admin/save', async (req, res) => {
    try {
        const { nbsCode } = req.body;
        if (!nbsCode) return res.status(400).json({ success: false, message: "NBS Code waa lagama maarmaan!" });

        // 'upsert' waxay u samaysaa arday cusub haduusan jirin, hadii kalena way u cusubaysaa
        const updatedStudent = await Student.findOneAndUpdate(
            { nbsCode }, 
            req.body, 
            { upsert: true, new: true }
        );
        res.json({ success: true, data: updatedStudent });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Khalad baa ka dhacay keydinta." });
    }
});

// 3. FETCH BY CLASS (Soo saarista liiska fasalka si loo daabaco)
app.get('/api/students/:class/:section', async (req, res) => {
    try {
        const { class: cls, section: sec } = req.params;
        const list = await Student.find({ class: cls, section: sec }).sort({ fullName: 1 });
        res.json(list);
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching students" });
    }
});

// 4. GET SINGLE STUDENT (Warqadda natiijada ama profile-ka gaarka ah)
app.get('/api/student/:nbsCode', async (req, res) => {
    try {
        const student = await Student.findOne({ nbsCode: req.params.nbsCode });
        if (student) {
            res.json({ success: true, data: student });
        } else {
            res.status(404).json({ success: false, message: "Ardayga lama helin" });
        }
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// 5. DELETE STUDENT (Hadii arday la tirtirayo)
app.delete('/api/admin/student/:nbsCode', async (req, res) => {
    try {
        await Student.findOneAndDelete({ nbsCode: req.params.nbsCode });
        res.json({ success: true, message: "Ardayga waa la tirtiray" });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// --- SERVER START ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server-ku wuxuu si fiican uga shaqaynayaa: http://localhost:${PORT}`);
});
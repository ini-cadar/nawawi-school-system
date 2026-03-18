const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ISKU-XIRKA DATABASE-KA
const mongoURI = "mongodb+srv://raaziwayrax_db_user:raasi1234@cluster0.cvcctca.mongodb.net/NawawiDB?retryWrites=true&w=majority";

mongoose.connect(mongoURI)
    .then(() => console.log("✅ DATABASE: Isku-xirka MongoDB waa guul!"))
    .catch(err => console.log("❌ DATABASE ERROR:", err));

// SCHEMA-KA ARDAYGA
const StudentSchema = new mongoose.Schema({
    nbsCode: { type: String, unique: true, required: true },
    password: { type: String, default: "1234" },
    fullName: { type: String, required: true },
    class: { type: String, required: true },
    section: { type: String, required: true },
    fees: { paid: { type: Number, default: 0 }, total: { type: Number, default: 1200 } },
    attendance: [{ date: String, status: String }],
    exams: {
        exam1: [{ subject: String, score: Number }],
        exam2: [{ subject: String, score: Number }],
        exam3: [{ subject: String, score: Number }],
        exam4: [{ subject: String, score: Number }]
    }
});

const Student = mongoose.model('Student', StudentSchema);

// --- API-YADA ---

// 1. LOGIN
app.post('/api/login', async (req, res) => {
    const { username, role } = req.body;
    console.log(`🔑 LOGIN ATTEMPT: Role: ${role}, User: ${username}`);
    
    const { password } = req.body;
    if (role === 'admin') {
        if (username === 'admin' && password === 'admin123') {
            console.log("✅ Admin si sax ah ayuu u soo galay");
            return res.json({ success: true, role: 'admin' });
        }
    } else {
        const student = await Student.findOne({ nbsCode: username, password: password });
        if (student) {
            console.log(`✅ Ardayga ${student.fullName} waa uu soo galay`);
            return res.json({ success: true, role: 'student', data: student });
        }
    }
    console.log("❌ Login Failed: Macluumaad qaldan");
    res.json({ success: false, message: "Xogtu waa khaldan tahay!" });
});

// 2. SAVE (Keydinta oo Server-ku sheegayo)
app.post('/api/admin/save', async (req, res) => {
    console.log("📥 REQUEST: Keydin arday cusub...");
    console.log("Xogta soo gaartay:", req.body);
    
    try {
        const { nbsCode, ...data } = req.body;
        const student = await Student.findOneAndUpdate(
            { nbsCode }, 
            data, 
            { upsert: true, new: true }
        );
        console.log(`✅ SUCCESS: Ardayga ${student.fullName} (ID: ${nbsCode}) waa la keydiyey!`);
        res.json({ success: true });
    } catch (err) {
        console.log("❌ SAVE ERROR:", err.message);
        res.status(500).json({ success: false });
    }
});

// 3. FETCH (Soo saarista ardayda oo Server-ku sheegayo)
app.get('/api/students/:c/:s', async (req, res) => {
    const { c, s } = req.params;
    console.log(`🔍 SEARCH: Raadinaya ardayda Fasalka: ${c}, Section: ${s}`);
    
    try {
        const list = await Student.find({ class: c, section: s }).sort({ fullName: 1 });
        console.log(`📊 RESULT: Waxaa la helay ${list.length} arday.`);
        res.json(list);
    } catch (err) {
        console.log("❌ FETCH ERROR:", err.message);
        res.json([]);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log("-----------------------------------------");
    console.log(`🚀 SERVER IS LIVE: http://localhost:${PORT}`);
    console.log(`📅 DATE: ${new Date().toLocaleString()}`);
    console.log("-----------------------------------------");
});
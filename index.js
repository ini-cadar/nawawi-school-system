const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// HUBI: Database-kaagu waa kan, hubi in password-ku sax yahay
const mongoURI = "mongodb+srv://raaziwayrax_db_user:raasi1234@cluster0.cvcctca.mongodb.net/NawawiDB?retryWrites=true&w=majority";

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ DATABASE-KU WAA SHUQAYNAYAA (MONGODB CONNECTED)"))
.catch(err => console.error("❌ DATABASE-KA AYAA DIIDAN:", err));

// Student Schema - 12 Maado, Attendance, Fees (Waxba lagama jarin)
const StudentSchema = new mongoose.Schema({
    nbsCode: { type: String, unique: true, required: true },
    password: { type: String, default: "123456" },
    fullName: { type: String, required: true },
    class: String,
    section: String,
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

// Admin Login Logic
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

// GET STUDENT LIST (Xallinta dhibka ardayda la weynayo)
app.get('/api/students/:c/:s', async (req, res) => {
    try {
        const list = await Student.find({ class: req.params.c, section: req.params.s }).sort({fullName: 1});
        res.json(list);
    } catch (err) { res.status(500).json([]); }
});

// GET SINGLE STUDENT
app.get('/api/student/:id', async (req, res) => {
    try {
        const s = await Student.findOne({ nbsCode: req.params.id }).lean();
        res.json(s);
    } catch (err) { res.status(500).json(null); }
});

// SAVE/UPDATE POWER (Halkan ayaa ah wadnaha nidaamka)
app.post('/api/admin/save', async (req, res) => {
    try {
        const { nbsCode, attendance, exam, fees, ...rest } = req.body;
        let updateQuery = { $set: rest };

        // Haddii uu yahay attendance, ku dar (Push) liiska
        if (attendance) {
            updateQuery.$push = { attendance: attendance[0] };
        }
        // Haddii uu yahay Exam ama Fee, update garee qaybtaas
        if (exam) updateQuery.$set.exam = exam;
        if (fees) updateQuery.$set.fees = fees;

        const updatedStudent = await Student.findOneAndUpdate(
            { nbsCode }, 
            updateQuery, 
            { upsert: true, new: true }
        );
        res.json({ success: true, data: updatedStudent });
    } catch (err) {
        console.error("Save Error:", err);
        res.status(500).json({ success: false });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 System Online on Port ${PORT}`));
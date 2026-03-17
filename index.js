const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection
const uri = "mongodb+srv://raaziwayrax_db_user:raasi1234@cluster0.cvcctca.mongodb.net/NawawiDB?retryWrites=true&w=majority";
mongoose.connect(uri).then(() => console.log("✅ NBS DB Active")).catch(err => console.error(err));

// --- Schema ---
const StudentSchema = new mongoose.Schema({
    nbsCode: { type: String, unique: true },
    fullName: String,
    motherName: String,
    class: { type: String, enum: ['9', '10', '11', '12'] },
    section: { type: String, enum: ['A', 'B', 'C', 'D'] },
    parent1: String,
    parent2: String,
    fees: { paid: { type: Number, default: 0 }, total: { type: Number, default: 1200 } },
    attendance: [{
        date: String,
        preBreak: { type: String, default: '×' },
        postBreak: { type: String, default: '×' }
    }],
    exam: {
        subjects: [
            { name: { type: String, default: 'Math' }, score: { type: Number, default: 0 } },
            { name: { type: String, default: 'English' }, score: { type: Number, default: 0 } },
            { name: { type: String, default: 'Science' }, score: { type: Number, default: 0 } }
        ],
        total: { type: Number, default: 0 },
        average: { type: Number, default: 0 },
        grade: { type: String, default: 'F' }
    }
});

const Student = mongoose.model('Student', StudentSchema);

// --- Routes ---
app.post('/api/admin/login', (req, res) => {
    if (req.body.username === 'nawawi_admin' && req.body.password === '7209379') res.json({ success: true });
    else res.status(401).send("Khalad");
});

app.post('/api/student/login', async (req, res) => {
    const s = await Student.findOne({ nbsCode: req.body.nbsCode });
    if (s) res.json({ success: true, data: s });
    else res.status(404).send("Lama helin");
});

app.post('/api/students', async (req, res) => {
    let data = req.body;
    // Automatic Exam Calculation
    if (data.exam && data.exam.subjects) {
        let total = data.exam.subjects.reduce((a, b) => a + Number(b.score || 0), 0);
        let avg = total / (data.exam.subjects.length || 1);
        data.exam.total = total;
        data.exam.average = avg.toFixed(2);
        data.exam.grade = avg >= 90 ? 'A' : avg >= 80 ? 'B' : avg >= 70 ? 'C' : avg >= 50 ? 'D' : 'F';
    }
    const s = await Student.findOneAndUpdate({ nbsCode: data.nbsCode }, data, { upsert: true, new: true });
    res.json(s);
});

app.get('/api/students/:class/:section', async (req, res) => {
    const list = await Student.find({ class: req.params.class, section: req.params.section });
    res.json(list);
});

app.delete('/api/students/:id', async (req, res) => {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(process.env.PORT || 3000);
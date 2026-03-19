const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// Isku xirka MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB Successfully'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Schema-ka Ardayga oo aad u dheer
const studentSchema = new mongoose.Schema({
    fullName: { type: String, required: true },     // Magaca Saddexan
    motherName: { type: String, required: true },   // Magaca Hooyada
    examNumber: { type: String, unique: true },     // Lambarka Imtixaanka
    grade: { type: String, enum: ['9', '10', '11', '12'] }, // Fasalka
    section: { type: String, enum: ['A', 'B', 'C'] },      // Qolka
    parentPhone1: String,   // Lambarka Waalidka 1
    parentPhone2: String,   // Lambarka Waalidka 2
    attendance: [{
        date: { type: String }, // Taariikhda (YYYY-MM-DD)
        status: { type: String, enum: ['Present', 'Absent'] }
    }]
});

const Student = mongoose.model('Student', studentSchema);

// API: Diiwaangelinta Arday Cusub
app.post('/api/register', async (req, res) => {
    try {
        const student = new Student(req.body);
        await student.save();
        res.json({ success: true, message: 'Ardayga waa la kaydiyay!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// API: Soo saarista Ardayda Fasal iyo Qol gaar ah
app.get('/api/filter', async (req, res) => {
    const { grade, section } = req.query;
    try {
        const students = await Student.find({ grade, section });
        res.json(students);
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// API: Kaydinta Xadirinta (Attendance)
app.post('/api/attendance', async (req, res) => {
    const { studentId, status, date } = req.body;
    try {
        await Student.findByIdAndUpdate(studentId, {
            $push: { attendance: { status, date } }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
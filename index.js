const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// 1. ISKU XIDHKA DATABASE-KA (MongoDB Atlas)
const mongoURI = 'mongodb+srv://ayrax_db_user:keWCHJqKZI9D7W6Y@cluster0.mongodb.net/nawawi_db?retryWrites=true&w=majority';

mongoose.connect(mongoURI)
  .then(() => console.log("✅ Database-kii MongoDB Atlas waa diyaar!"))
  .catch(err => console.log("❌ Database Error:", err));

// 2. QAABKA XOGTA (Student Schema)
const studentSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  pass: { type: String, default: "123" },
  magaca: { type: String, required: true },
  meel: String,
  aaboTel: String,
  hooyoTel: String,
  fasalka: String,
  fee: { type: String, default: "Ma bixin" },
  exams: { type: Object, default: {} },
  att: { type: Object, default: {} } // Tusaale: {"Sabti": "√", "Axad": "X"}
});

const Student = mongoose.model('Student', studentSchema);

// 3. API-YADA (Endpoints)
app.post('/api/login', async (req, res) => {
  const { id, pass } = req.body;
  // Admin Login
  if (id === "admin" && pass === "admin1234") {
    return res.json({ role: 'admin', magaca: "Maamulaha Nawawi" });
  }
  // Student Login
  try {
    const s = await Student.findOne({ id, pass });
    if (s) return res.json({ ...s._doc, role: 'student' });
    res.status(401).send("ID ama Password khaldan!");
  } catch (e) { res.status(500).send("Server Error"); }
});

app.get('/api/data', async (req, res) => {
  const data = await Student.find();
  res.json(data);
});

app.post('/api/update-student', async (req, res) => {
  try {
    await Student.findOneAndUpdate({ id: req.body.id }, req.body, { upsert: true, new: true });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/student/:id', async (req, res) => {
  await Student.findOneAndDelete({ id: req.params.id });
  res.json({ ok: true });
});

// 4. U ADEEGIDDA FRONT-END (Wixii Render loogu talagalay)
app.use(express.static(path.join(__dirname, 'frontend-dugsi/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend-dugsi/build', 'index.html'));
});

const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => console.log(`🚀 Server-ku wuxuu ku shaqaynayaa Port ${PORT}`));
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// 1. ISKU XIDHKA MONGODB
// Haddii aad MongoDB ku rakibtay computer-ka, isticmaal link-gan hoose
mongoose.connect('mongodb://localhost:27017/nawawi_db')
  .then(() => console.log("✅ Database-kii Nawawi waa diyaar!"))
  .catch(err => console.error("❌ Database-ka ma xidhna:", err));

// 2. QAABKA XOGTA (Student Schema)
const studentSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  pass: { type: String, default: "123" },
  magaca: String,
  meel: String,
  aaboTel: String,
  hooyoTel: String,
  fasalka: String,
  fee: { type: String, default: "Ma bixin" },
  exams: { type: Object, default: {} },
  att: { type: Object, default: {} }
});

const Student = mongoose.model('Student', studentSchema);

// 3. API-YADA (Endpoints)
app.post('/api/login', async (req, res) => {
  const { id, pass } = req.body;
  if (id === "admin" && pass === "admin1234") return res.json({ role: 'admin', magaca: "Maamulaha Nawawi" });
  const s = await Student.findOne({ id, pass });
  if (s) return res.json({ ...s._doc, role: 'student' });
  res.status(401).send("Khalad!");
});

app.get('/api/data', async (req, res) => {
  const data = await Student.find();
  res.json(data);
});

app.post('/api/update-student', async (req, res) => {
  await Student.findOneAndUpdate({ id: req.body.id }, req.body, { upsert: true });
  res.json({ ok: true });
});

app.delete('/api/student/:id', async (req, res) => {
  await Student.findOneAndDelete({ id: req.params.id });
  res.json({ ok: true });
});
const PORT = process.env.PORT||3000;
app.listen(3000, () => console.log("🚀 Server-ku wuxuu ku shaqaynayaa Port 3000"));
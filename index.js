const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Haddii aad leedahay folder 'public'

// Isku xidhka MongoDB (Waxay ka akhrisanaysaa Render Environment Variables)
const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
  .then(() => console.log("✅ MongoDB Connected Successfully!"))
  .catch(err => console.log("❌ MongoDB Connection Error:", err));

// Routes
app.get('/', (req, res) => {
  res.send('Nawawi School System is Live and Running!');
});

// Halkan ku dar Routes-kaaga kale (sida /api/students) laakiin hubi qoraalka
// Tusaale:
// app.use('/api/students', require('./routes/students'));

// Port-ka Render (Aad u muhiim ah)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
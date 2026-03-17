const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 1. Tani waa midda muhiimka ah: Hubi in magaca folder-ka uu yahay 'public'
app.use(express.static(path.join(__dirname, 'public')));

// 2. MongoDB Connection (Password-kaadi waa sax)
const uri = "mongodb+srv://raaziwayrax_db_user:raasi1234@cluster0.cvcctca.mongodb.net/NawawiDB?retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(() => console.log("✅ Database Connected"))
  .catch(err => console.error("❌ Database Error:", err));

// 3. API Routes (Students & Attendance)
// ... (Halkan ku dar koodhkii API-yada ee hore)

// 4. XALKA "NOT FOUND":
// Haddii wax walba fashilmaan, kani wuxuu si khasab ah u furayaa index.html
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server is running`));
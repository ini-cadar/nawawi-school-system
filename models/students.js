const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    magaca: { type: String, required: true },
    aqoonsi_id: { type: String, unique: true, required: true },
    fasalka: { type: String, required: true },
    meesha_dhalashada: { type: String, required: true },
    waalid_tel: { type: String, required: true },
    // Halkan waxaa lagu keydinayaa taariikhda iyo hadduu joogo (true/false)
    attendance: [
        {
            taariikh: { type: Date, default: Date.now },
            xaadir: { type: Boolean, default: false } 
        }
    ]
});

module.exports = mongoose.model('Student', studentSchema);
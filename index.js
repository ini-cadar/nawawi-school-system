/**
 * WEYRAX PORTAL v10.0 - CORE ENGINE
 * Developer: Weyrax
 */

// --- GLOBAL VARIABLES & CONFIG ---
const API_URL = "http://localhost:5000/api/v1"; // Bedel marka aad Deploy garayso
const SUBJECTS = ["Math", "English", "Arabic", "Tarbiya", "Chemistry", "Physics", "History", "Geography", "Somali", "ICT", "Biology"];
let currentUser = null;
let allStudents = [];

// --- 1. AUTHENTICATION (LOGIN) ---
async function attemptLogin() {
    const role = document.getElementById('loginRole').value;
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const errorBtn = document.getElementById('loginError');

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role, username: user, password: pass })
        });

        const result = await response.json();

        if (result.success) {
            currentUser = result.data;
            startSystem(result.role, result.data);
        } else {
            errorBtn.innerText = "❌ ID ama Password khaldan!";
        }
    } catch (err) {
        errorBtn.innerText = "⚠️ Server-ka ma shaqaynayo!";
        console.error(err);
    }
}

function startSystem(role, data) {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('mainSidebar').style.display = 'flex';
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('userRoleDisplay').innerText = role.toUpperCase();

    if (role === 'admin') {
        document.getElementById('adminLinks').classList.remove('hidden');
        showPage('dashPage');
        fetchAllStudents();
    } else {
        document.getElementById('studentLinks').classList.remove('hidden');
        renderStudentPortal(data);
        showPage('resultPage');
    }
}

// --- 2. DATA MANAGEMENT (FETCH & REGISTER) ---
async function fetchAllStudents() {
    const res = await fetch(`${API_URL}/students/all`);
    allStudents = await res.json();
    updateStats();
    updateDashContacts();
}

async function registerNewStudent() {
    const studentData = {
        fullName: document.getElementById('regName').value,
        roll: document.getElementById('regRoll').value,
        grade: document.getElementById('regGrade').value,
        section: document.getElementById('regSection').value,
        motherName: document.getElementById('regMother').value,
        phones: [document.getElementById('regP1').value, document.getElementById('regP2').value],
        photo: document.getElementById('previewImg').src, // Base64
        password: document.getElementById('regPass').value || "123456"
    };

    if(!studentData.fullName || !studentData.roll) return alert("Fadlan buuxi magaca iyo ID-ga!");

    const res = await fetch(`${API_URL}/students/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData)
    });

    if (res.ok) {
        alert("✅ Ardayga waa la diiwaangeliyey!");
        showPage('dashPage');
        fetchAllStudents();
    }
}

// --- 3. ACADEMICS & EXAMS ---
function renderExamTable() {
    const tbody = document.getElementById('examTableBody');
    const gradeVal = document.getElementById('exGrade').value;
    const searchVal = document.getElementById('searchExam').value.toLowerCase();

    const filtered = allStudents.filter(s => 
        (gradeVal === 'all' || s.grade === gradeVal) && 
        s.fullName.toLowerCase().includes(searchVal)
    );

    tbody.innerHTML = filtered.map(s => {
        const total = Object.values(s.scores).reduce((a, b) => a + b, 0);
        const avg = Math.round(total / SUBJECTS.length);
        return `
            <tr>
                <td>${s.roll}</td>
                <td>${s.fullName}</td>
                <td>${total}</td>
                <td>${s.attendancePoints || 0}</td>
                <td>${avg}%</td>
                <td><span class="badge ${avg >= 50 ? 'bg-a' : 'bg-f'}">${avg >= 50 ? 'PASS' : 'FAIL'}</span></td>
                <td><button onclick="openScoreModal('${s._id}')" style="width:auto; padding:5px 10px;">GELI</button></td>
            </tr>
        `;
    }).join('');
}

async function saveStudentScores() {
    const inputs = document.querySelectorAll('.sc-in');
    const scores = {};
    inputs.forEach(i => scores[i.dataset.s] = parseInt(i.value) || 0);

    const res = await fetch(`${API_URL}/students/update-scores/${currentEditingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores })
    });

    if (res.ok) {
        closeScoreModal();
        fetchAllStudents();
        renderExamTable();
        alert("Dhibcaha waa la keydiyey!");
    }
}

// --- 4. UTILS & UI ---
function updateStats() {
    document.getElementById('countStudents').innerText = allStudents.length;
}

function showPage(pageId, element = null) {
    document.querySelectorAll('.page-view').forEach(p => p.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');

    if (element) {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('nav-active'));
        element.classList.add('nav-active');
    }

    if (pageId === 'examPage') renderExamTable();
    if (pageId === 'managePage') renderManageTable();
}

// --- 5. INITIALIZATION ---
document.getElementById('currentDate').innerText = new Date().toDateString();
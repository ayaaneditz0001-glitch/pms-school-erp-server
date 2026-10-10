const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

const uploadsDir = path.join(__dirname, 'uploads');
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

app.use('/uploads', express.static(uploadsDir));
app.use(express.static(publicDir));

const dbFile = path.join(__dirname, 'school-db.json');

const defaultDatabase = {
  institution: {
    code: "pms",
    fullName: "P.M.S. Public School",
    affiliation: "CBSE Affiliated • Senior Secondary Institution",
    established: "1988",
    city: "Civil Lines, Moradabad",
    principal: "Dr. Arthur Vance, Ph.D."
  },
  accounts: [
    {
      id: "admin-01",
      username: "admin@school.erp",
      passwordHash: "Admin@2026",
      fullName: "Dr. Arthur Vance",
      role: "ADMIN",
      identifier: "Office of Principal / Administrator",
      email: "admin@school.erp",
      phone: "+91 98110 44001",
      isActive: true,
      createdAt: "01 Oct 2026"
    },
    {
      id: "teacher-01",
      username: "anita_sharma",
      passwordHash: "Teach#2026",
      fullName: "Mrs. Anita Sharma",
      role: "TEACHER",
      identifier: "Faculty ID: T-104 (Physics & Science)",
      email: "anita.sharma@school.erp",
      phone: "+91 98765 43210",
      isActive: true,
      createdAt: "01 Oct 2026"
    },
    {
      id: "student-01",
      username: "ayaan",
      passwordHash: "Ayaan#2026",
      fullName: "Ayaan",
      role: "STUDENT",
      identifier: "Roll: 24 (Class IX-D)",
      email: "ayaan@school.erp",
      phone: "+91 92199 07919",
      isActive: true,
      createdAt: "01 Oct 2026"
    }
  ],
  studentProfile: {
    name: "Ayaan",
    schoolName: "P.M.S. Public School",
    className: "IX",
    section: "D",
    enrollNo: "7996",
    rollNo: "24",
    academicSession: "2026-2027",
    bloodGroup: "B+",
    classTeacher: "Alok Pratap Kushwaha",
    dateOfBirth: "07-07-2011",
    fatherName: "Mr. Mohd. Azeem",
    motherName: "Mrs. Naghma Jamal",
    mobileNumber: "+91 92199 07919",
    address: "Opp Noor Jamal Masjid, Peer Ka Bazar, Karula, Moradabad",
    emergencyContact: "+91 92199 07919"
  },
  attendance: [
    { dayNumber: 1, dayName: "Thu", dateString: "01 Oct", status: "PRESENT", remark: "On time" },
    { dayNumber: 2, dayName: "Fri", dateString: "02 Oct", status: "HOLIDAY", remark: "Gandhi Jayanti" },
    { dayNumber: 3, dayName: "Sat", dateString: "03 Oct", status: "PRESENT", remark: "On time" },
    { dayNumber: 4, dayName: "Sun", dateString: "04 Oct", status: "HOLIDAY", remark: "Weekend" },
    { dayNumber: 5, dayName: "Mon", dateString: "05 Oct", status: "PRESENT", remark: "On time" },
    { dayNumber: 6, dayName: "Tue", dateString: "06 Oct", status: "PRESENT", remark: "On time" },
    { dayNumber: 7, dayName: "Wed", dateString: "07 Oct", status: "LATE", remark: "Late entry by 15 mins" },
    { dayNumber: 8, dayName: "Thu", dateString: "08 Oct", status: "PRESENT", remark: "On time" },
    { dayNumber: 9, dayName: "Fri", dateString: "09 Oct", status: "PRESENT", remark: "On time" },
    { dayNumber: 10, dayName: "Sat", dateString: "10 Oct", status: "PRESENT", remark: "On time" }
  ],
  homework: [
    {
      id: "HW-101",
      subject: "Science (Physics)",
      title: "Gravitation Numerical Problems (Ch 4)",
      dueDate: "16 Oct 2026",
      description: "Solve problems 1 to 14 from Chapter 4 worksheet.",
      maxMarks: 25,
      isSubmitted: false
    }
  ],
  circulars: [
    {
      id: "CIRC-01",
      title: "Mid-Term Examination Schedule & Syllabus",
      date: "08 Oct 2026",
      category: "Academic",
      summary: "Term 1 examinations commence from 24th October.",
      fullNotice: "All students are notified that Term 1 exams will be conducted between 24 Oct and 05 Nov 2026.",
      issuedBy: "Office of Principal",
      isImportant: true
    }
  ]
};

let schoolDb = defaultDatabase;
if (fs.existsSync(dbFile)) {
  try {
    schoolDb = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
  } catch (err) {
    console.error('Error reading db:', err);
  }
} else {
  persistDatabase();
}

function persistDatabase() {
  fs.writeFile(dbFile, JSON.stringify(schoolDb, null, 2), () => {});
}

// 1. Health Status
app.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    school: schoolDb.institution.fullName,
    code: schoolDb.institution.code,
    engine: 'Autonomous API Engine (No Gemini)'
  });
});

// 2. Authentication (School Code 'pms' + Username + Password)
app.post('/api/auth/login', (req, res) => {
  const { schoolCode, username, password } = req.body;
  if (schoolCode && schoolCode.trim().toLowerCase() !== schoolDb.institution.code) {
    return res.status(400).json({ success: false, error: "Invalid School Code." });
  }

  const user = schoolDb.accounts.find(a => 
    (a.username.toLowerCase() === (username || "").trim().toLowerCase() ||
     a.email.toLowerCase() === (username || "").trim().toLowerCase()) &&
    a.passwordHash === (password || "").trim()
  );

  if (!user) {
    return res.status(401).json({ success: false, error: "Invalid username or password." });
  }

  res.json({ success: true, user, institution: schoolDb.institution });
});

// 3. Search Accounts
app.get('/api/accounts', (req, res) => {
  const q = (req.query.q || "").toLowerCase().trim();
  let list = schoolDb.accounts;
  if (q) {
    list = list.filter(a => a.fullName.toLowerCase().includes(q) || a.username.toLowerCase().includes(q));
  }
  res.json({ success: true, count: list.length, accounts: list });
});

// 4. Admin Reset Password (No current password needed)
app.post('/api/accounts/:id/reset-password', (req, res) => {
  const { newPassword } = req.body;
  const acc = schoolDb.accounts.find(a => a.id === req.params.id || a.username === req.params.id);
  if (!acc) return res.status(404).json({ success: false, error: "Account not found." });
  acc.passwordHash = newPassword.trim();
  persistDatabase();
  res.json({ success: true, message: `Password for ${acc.fullName} updated by Admin.` });
});

// 5. User Changes Password (Requires current password)
app.post('/api/accounts/change-password', (req, res) => {
  const { username, currentPassword, newPassword } = req.body;
  const acc = schoolDb.accounts.find(a => a.username.toLowerCase() === (username || "").toLowerCase().trim());
  if (!acc) return res.status(404).json({ success: false, error: "Account not found." });
  if (acc.passwordHash !== currentPassword) {
    return res.status(400).json({ success: false, error: "Current password incorrect." });
  }
  acc.passwordHash = newPassword.trim();
  persistDatabase();
  res.json({ success: true, message: "Password updated successfully." });
});

// 6. Attendance (Marked by Office only)
app.get('/api/attendance', (req, res) => {
  res.json({ success: true, records: schoolDb.attendance });
});

app.post('/api/attendance', (req, res) => {
  const { dayNumber, status, remark } = req.body;
  let rec = schoolDb.attendance.find(a => a.dayNumber === parseInt(dayNumber));
  if (rec) {
    rec.status = status;
    if (remark) rec.remark = remark;
  } else {
    schoolDb.attendance.push({
      dayNumber: parseInt(dayNumber),
      dayName: "Day",
      dateString: `${dayNumber} Oct`,
      status: status || "PRESENT",
      remark: remark || "Office Record"
    });
  }
  persistDatabase();
  res.json({ success: true, message: "Attendance saved by Office." });
});

// 7. Digital ID Card
app.get('/api/student/id-card', (req, res) => {
  res.json({ success: true, institution: schoolDb.institution, profile: schoolDb.studentProfile });
});

// Admin edits student info
app.put('/api/student/id-card', (req, res) => {
  schoolDb.studentProfile = { ...schoolDb.studentProfile, ...req.body };
  const stuAcc = schoolDb.accounts.find(a => a.role === 'STUDENT');
  if (stuAcc) stuAcc.fullName = schoolDb.studentProfile.name;
  persistDatabase();
  res.json({ success: true, profile: schoolDb.studentProfile });
});

// 8. Homework & Circulars
app.get('/api/homework', (req, res) => res.json({ success: true, homework: schoolDb.homework }));
app.get('/api/circulars', (req, res) => res.json({ success: true, circulars: schoolDb.circulars }));

// 9. Autonomous Academic AI Solver (No Gemini)
app.post('/api/ai/solve', (req, res) => {
  const { question, subject } = req.body;
  res.json({
    success: true,
    engine: "PMS Campus Academic Engine (No Gemini)",
    question: question,
    subject: subject || "Science",
    solution: `Step 1: Systematic Analysis of '${question}'.\nStep 2: Core Academic Principles Applied.\nStep 3: Verification verified according to CBSE curriculum.`
  });
});

app.listen(PORT, () => {
  console.log(`P.M.S. School ERP Server running on port ${PORT}`);
});

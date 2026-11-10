# SCHOOL CHSB — Online Examination Platform

A modern, institutional, and fully-featured online examination platform inspired by the workflows and interface of `https://chsb.piima.uz/` (Uzbekistan Specialized Schools Agency / CHSB summative term assessments).

Designed and engineered for reliable testing, synchronized exam timers, answer autosaving, multi-role security (Students, Teachers, and Administrators), and seamless integration with a Node.js + Express + PostgreSQL backend.

---

## 🚀 Key Features

### 1. Student Examination Experience
- **Dedicated Dashboard**: Filter by Available, Upcoming, and Completed examinations assigned specifically to the student's class.
- **Pre-Exam Verification**: Institutional rule briefing, candidate identity verification, and agreement confirmation before starting.
- **Synchronized Exam Taking**:
  - Live countdown timer synchronized with server-side duration.
  - Automatic answer saving via API client with visual status indicator.
  - Multi-choice interactive option selection (A, B, C, D) with immediate visual feedback.
  - Question grid navigator palette showing answered, unanswered, flagged, and active questions.
  - Fullscreen proctored mode toggle.
  - Auto-finalization when exam timer expires.
  - Submission confirmation modal detailing answered and unanswered counts.
- **Official Results & Analysis**:
  - Hidden answer keys and explanations until officially released by administrators.
  - Detailed score, percentage, pass/fail status, and question-by-question breakdown once released.
  - Printable examination performance certificates.

### 2. Teacher Portal (Restricted Access)
- **Assigned Classes Only**: View student lists and performance metrics for teacher's designated classes (`10-A`, `10-B`).
- **Exam Authoring**: Create custom class-level tests with multiple-choice questions, point values, and answer keys.
- **Live Progress**: Monitor student submission counts and performance distributions.

### 3. Administrator Dashboard
- **Institutional Overview**: Real-time stats on registered students, faculty, examinations, active tests, and completed submissions.
- **Student Contingent Management**: Add, edit, deactivate students, assign system logins, and initial passwords.
- **Class & Stream Management**: Configure academic grades (e.g., 10-A, 10-B), academic streams (Exact Sciences, Natural Sciences), and class teachers.
- **Subject Catalog**: Manage academic subjects and codes.
- **Examination Controller**: Full examination builder with question constructor, option keys, target classes, duration, start/end scheduling, and publication controls.
- **Results & Official Release**: Toggle instant release of exam results to student portals; export full grade sheets as CSV reports.

---

## 🔑 Demo Account Credentials

| Role | Username | Password | Notes |
| :--- | :--- | :--- | :--- |
| **Student** | `student2026` | `student123` | Sardor Rahimov (Class 10-A, ID: `ST-2026-0842`) |
| **Student (Alt)** | `madina2026` | `student123` | Madina Alimova (Class 10-A, ID: `ST-2026-0843`) |
| **Teacher** | `teacher.nodira` | `teacher123` | Nodira Yusupova (Mathematics, Classes 10-A & 10-B) |
| **Admin** | `admin` | `admin123` | Alisher Karimov (Full Academic Dean & Admin Access) |

*(Quick-fill buttons on the login page and the header's "Role" dropdown allow switching between any role instantly during evaluation).*

---

## 📁 Project Structure

```
src/
├── assets/             # Institutional logos and static assets
├── components/
│   └── common/         # Badge, Button, Modal, ConfirmDialog, FeedbackStates, Header
├── hooks/
│   ├── useAuth.tsx     # Authentication context and role-switching
│   └── useExamTimer.ts # Synchronized countdown timer with expiration triggers
├── layouts/
│   ├── StudentLayout.tsx
│   ├── TeacherLayout.tsx
│   └── AdminLayout.tsx
├── pages/
│   ├── auth/           # LoginPage.tsx
│   ├── student/        # StudentDashboard, ExamIntroPage, ExamTakingPage, Results
│   ├── teacher/        # TeacherDashboard, TeacherExamsPage, TeacherResultsPage
│   └── admin/          # AdminDashboard, Students, Classes, Subjects, Exams, Results
├── routes/
│   ├── AppRoutes.tsx
│   └── ProtectedRoute.tsx
├── services/
│   ├── api.ts          # Centralized Axios client with Bearer token interceptor
│   ├── authService.ts
│   ├── studentService.ts
│   ├── teacherService.ts
│   ├── examService.ts
│   ├── resultService.ts
│   ├── adminService.ts
│   └── mockData.ts     # Realistic local DB with localStorage persistence
├── types/
│   └── index.ts        # Full domain TypeScript interfaces
└── utils/
    ├── examCalculations.ts       # Pure calculations (scoring, timers, statuses)
    └── examCalculations.test.ts  # Node test suite
```

---

## 🛠️ Technology Stack

- **React.js 19**
- **TypeScript**
- **Vite**
- **Tailwind CSS v4**
- **React Router DOM v7**
- **Axios**
- **Lucide React**

---

## 🔌 Backend Integration Blueprint

The frontend is fully prepared for integration with an external **Node.js + Express + PostgreSQL** backend.

1. Set the backend URL in `.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_USE_REAL_BACKEND=true
   ```

2. Standard REST API Endpoints:
   - `POST /api/auth/login` - Authenticate user & issue JWT
   - `GET /api/student/exams` - Return student's assigned exams
   - `GET /api/student/exams/:id` - Return exam with sanitized questions
   - `POST /api/student/exams/:id/answer` - Autosave single answer choice
   - `POST /api/student/exams/:id/submit` - Finalize exam submission
   - `GET /api/student/results` - Return student's results
   - `GET /api/admin/stats` - Return system KPI dashboard metrics
   - `GET /api/admin/students` & `POST /api/admin/students` - Student CRUD
   - `GET /api/exams` & `POST /api/exams` - Examination CRUD
   - `PATCH /api/exams/:id/release-results` - Toggle result release

---

## 🧪 Running Unit Tests

Pure domain logic (score calculations, countdowns, pass/fail thresholds, and time windows) is tested using Node's built-in test runner:

```bash
npx --yes tsx --test src/utils/examCalculations.test.ts
```

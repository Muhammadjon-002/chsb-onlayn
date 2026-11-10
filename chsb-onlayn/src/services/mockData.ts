import { User, ClassGroup, Subject, Exam, ExamResult, StudentExamSession, SystemStats } from '../types';

const INITIAL_CLASSES: ClassGroup[] = [
  {
    id: 'cls-10a',
    name: '10-A',
    grade: 10,
    stream: 'Exact Sciences (Aniq fanlar)',
    academicYear: '2026-2027',
    studentCount: 24,
    classTeacherName: 'Nodira Yusupova',
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 'cls-10b',
    name: '10-B',
    grade: 10,
    stream: 'Natural Sciences (Tabiiy fanlar)',
    academicYear: '2026-2027',
    studentCount: 26,
    classTeacherName: 'Javohir Qosimov',
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 'cls-9a',
    name: '9-A',
    grade: 9,
    stream: 'General Advanced',
    academicYear: '2026-2027',
    studentCount: 28,
    classTeacherName: 'Gulbahor Mirzayeva',
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 'cls-11a',
    name: '11-A',
    grade: 11,
    stream: 'IT & Engineering',
    academicYear: '2026-2027',
    studentCount: 22,
    classTeacherName: 'Rustam Saidov',
    createdAt: '2026-09-01T08:00:00Z',
  },
];

const INITIAL_SUBJECTS: Subject[] = [
  { id: 'sub-math', name: 'Mathematics (Algebra & Geometry)', code: 'MATH-10', description: 'Advanced algebra, trigonometry and analytical geometry', status: 'active' },
  { id: 'sub-phys', name: 'Physics (Mexanika & Elektrodinamika)', code: 'PHYS-10', description: 'Classical mechanics, thermodynamics, and electromagnetism', status: 'active' },
  { id: 'sub-chem', name: 'Chemistry', code: 'CHEM-10', description: 'Inorganic and organic chemical structures and reaction rates', status: 'active' },
  { id: 'sub-eng', name: 'English Language (CEFR Diagnostic)', code: 'ENG-10', description: 'Academic English reading, comprehension and grammar structures', status: 'active' },
  { id: 'sub-cs', name: 'Computer Science (Informatika)', code: 'CS-10', description: 'Algorithms, data structures and Python programming logic', status: 'active' },
  { id: 'sub-bio', name: 'Biology', code: 'BIO-10', description: 'Cellular genetics, biochemistry and ecology systems', status: 'active' },
];

const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin',
    username: 'admin',
    fullName: 'Alisher Karimov',
    email: 'admin.karimov@school-chsb.uz',
    role: 'admin',
    status: 'active',
    createdAt: '2026-08-15T09:00:00Z',
  },
  {
    id: 'usr-teacher-1',
    username: 'teacher.nodira',
    fullName: 'Nodira Yusupova',
    email: 'n.yusupova@school-chsb.uz',
    role: 'teacher',
    assignedClassIds: ['cls-10a', 'cls-10b'],
    assignedSubjects: ['Mathematics (Algebra & Geometry)'],
    status: 'active',
    createdAt: '2026-08-20T10:00:00Z',
  },
  {
    id: 'usr-teacher-2',
    username: 'teacher.javohir',
    fullName: 'Javohir Qosimov',
    email: 'j.qosimov@school-chsb.uz',
    role: 'teacher',
    assignedClassIds: ['cls-10b', 'cls-11a'],
    assignedSubjects: ['Physics (Mexanika & Elektrodinamika)'],
    status: 'active',
    createdAt: '2026-08-20T11:00:00Z',
  },
  {
    id: 'usr-student-1',
    username: 'student2026',
    fullName: 'Sardor Rahimov',
    email: 's.rahimov26@school-chsb.uz',
    role: 'student',
    studentId: 'ST-2026-0842',
    classId: 'cls-10a',
    className: '10-A',
    groupName: 'Exact Sciences (Aniq fanlar)',
    status: 'active',
    createdAt: '2026-09-02T08:30:00Z',
  },
  {
    id: 'usr-student-2',
    username: 'madina2026',
    fullName: 'Madina Alimova',
    email: 'm.alimova26@school-chsb.uz',
    role: 'student',
    studentId: 'ST-2026-0843',
    classId: 'cls-10a',
    className: '10-A',
    groupName: 'Exact Sciences (Aniq fanlar)',
    status: 'active',
    createdAt: '2026-09-02T08:30:00Z',
  },
  {
    id: 'usr-student-3',
    username: 'bekzod2026',
    fullName: 'Bekzod Toshmatov',
    email: 'b.toshmatov26@school-chsb.uz',
    role: 'student',
    studentId: 'ST-2026-0844',
    classId: 'cls-10b',
    className: '10-B',
    groupName: 'Natural Sciences (Tabiiy fanlar)',
    status: 'active',
    createdAt: '2026-09-02T08:30:00Z',
  },
];

// Current ISO reference (assumed around 2026-11-04)
const now = new Date();
const yesterday = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
const twoHoursAgo = new Date(now.getTime() - 2 * 3600 * 1000).toISOString();
const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();
const endOfTomorrow = new Date(now.getTime() + 48 * 3600 * 1000).toISOString();
const nextWeek = new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString();

const INITIAL_EXAMS: Exam[] = [
  {
    id: 'exam-math-term1',
    title: '1-Chora Yakuniy Baholash: Matematika (Algebra & Funksiyalar)',
    subjectId: 'sub-math',
    subjectName: 'Mathematics (Algebra & Geometry)',
    description: 'Chora bo\'yicha yakuniy summative test. Kvadrat tenglamalar, logarifmik funksiyalar va trigonometrik ayniyatlar.',
    targetClassIds: ['cls-10a', 'cls-10b'],
    targetClassNames: ['10-A', '10-B'],
    startDateTime: twoHoursAgo,
    endDateTime: endOfTomorrow,
    durationMinutes: 45,
    totalQuestions: 10,
    totalPoints: 30,
    passingScore: 60,
    isPublished: true,
    areResultsReleased: false,
    createdByTeacherId: 'usr-teacher-1',
    createdByName: 'Nodira Yusupova',
    createdAt: '2026-11-01T08:00:00Z',
    questions: [
      {
        id: 'q-m1',
        questionNumber: 1,
        text: 'Agar 2^(x+1) + 2^x = 24 bo\'lsa, x ning qiymatini toping.',
        options: [
          { id: 'A', text: 'x = 2' },
          { id: 'B', text: 'x = 3' },
          { id: 'C', text: 'x = 4' },
          { id: 'D', text: 'x = 5' },
        ],
        correctOptionId: 'B',
        points: 3,
        explanation: '2^x * (2 + 1) = 24 => 2^x * 3 = 24 => 2^x = 8 => x = 3.',
      },
      {
        id: 'q-m2',
        questionNumber: 2,
        text: 'f(x) = x^2 - 6x + 13 funksiyaning eng kichik qiymatini aniqlang.',
        options: [
          { id: 'A', text: '3' },
          { id: 'B', text: '4' },
          { id: 'C', text: '6' },
          { id: 'D', text: '13' },
        ],
        correctOptionId: 'B',
        points: 3,
        explanation: 'f(x) = (x - 3)^2 + 4. Kvadrat ifodaning minimum qiymati 0 ga teng, demak eng kichik qiymat 4.',
      },
      {
        id: 'q-m3',
        questionNumber: 3,
        text: 'Trigonometrik ifodani soddalashtiring: sin^2(α) + cos^2(α) + tg(45°).',
        options: [
          { id: 'A', text: '0' },
          { id: 'B', text: '1' },
          { id: 'C', text: '2' },
          { id: 'D', text: '3' },
        ],
        correctOptionId: 'C',
        points: 3,
        explanation: 'Asosiy trigonometrik ayniyatga ko\'ra sin^2(α) + cos^2(α) = 1 va tg(45°) = 1. 1 + 1 = 2.',
      },
      {
        id: 'q-m4',
        questionNumber: 4,
        text: 'log_3(x - 2) = 2 tenglamaning ildizini toping.',
        options: [
          { id: 'A', text: 'x = 7' },
          { id: 'B', text: 'x = 8' },
          { id: 'C', text: 'x = 11' },
          { id: 'D', text: 'x = 9' },
        ],
        correctOptionId: 'C',
        points: 3,
        explanation: 'Logarifm ta\'rifiga ko\'ra x - 2 = 3^2 = 9 => x = 11.',
      },
      {
        id: 'q-m5',
        questionNumber: 5,
        text: 'Aritmetik progressiyada a_1 = 5, d = 3 bo\'lsa, uning dastlabki 10 ta hadi yig\'indisini hisoblang.',
        options: [
          { id: 'A', text: '185' },
          { id: 'B', text: '190' },
          { id: 'C', text: '200' },
          { id: 'D', text: '215' },
        ],
        correctOptionId: 'A',
        points: 3,
        explanation: 'S_10 = (2 * 5 + 9 * 3) / 2 * 10 = (10 + 27) / 2 * 10 = 37 * 5 = 185.',
      },
      {
        id: 'q-m6',
        questionNumber: 6,
        text: 'Tengsizlikni yeching: (x - 4)(x + 2) < 0.',
        options: [
          { id: 'A', text: '(-∞, -2)' },
          { id: 'B', text: '(-2, 4)' },
          { id: 'C', text: '(4, +∞)' },
          { id: 'D', text: '[-2, 4]' },
        ],
        correctOptionId: 'B',
        points: 3,
        explanation: 'Intervallar usulida nollari x = -2 va x = 4. Oraliq (-2, 4).',
      },
      {
        id: 'q-m7',
        questionNumber: 7,
        text: 'To\'g\'ri burchakli uchburchakning katetlari 6 cm va 8 cm. Gipotenuzasini toping.',
        options: [
          { id: 'A', text: '9 cm' },
          { id: 'B', text: '10 cm' },
          { id: 'C', text: '12 cm' },
          { id: 'D', text: '14 cm' },
        ],
        correctOptionId: 'B',
        points: 3,
        explanation: 'Pifagor teoremasi: c = √(6^2 + 8^2) = √(36 + 64) = √100 = 10 cm.',
      },
      {
        id: 'q-m8',
        questionNumber: 8,
        text: 'Agar vektor a = (3, 4) bo\'lsa, uning uzunligini (|a|) toping.',
        options: [
          { id: 'A', text: '5' },
          { id: 'B', text: '7' },
          { id: 'C', text: '12' },
          { id: 'D', text: '25' },
        ],
        correctOptionId: 'A',
        points: 3,
        explanation: '|a| = √(3^2 + 4^2) = √(9 + 16) = √25 = 5.',
      },
      {
        id: 'q-m9',
        questionNumber: 9,
        text: 'Hosilani toping: f(x) = 3x^3 - 4x + 7.',
        options: [
          { id: 'A', text: '9x^2 - 4' },
          { id: 'B', text: '6x^2 - 4' },
          { id: 'C', text: '9x - 4' },
          { id: 'D', text: '3x^2 - 4x' },
        ],
        correctOptionId: 'A',
        points: 3,
        explanation: 'f\'(x) = 3 * 3x^2 - 4 = 9x^2 - 4.',
      },
      {
        id: 'q-m10',
        questionNumber: 10,
        text: 'Doiraning radiusi 7 cm ga teng. Uning yuzini toping (π ≈ 22/7).',
        options: [
          { id: 'A', text: '44 cm^2' },
          { id: 'B', text: '88 cm^2' },
          { id: 'C', text: '154 cm^2' },
          { id: 'D', text: '196 cm^2' },
        ],
        correctOptionId: 'C',
        points: 3,
        explanation: 'S = π * r^2 = (22/7) * 49 = 22 * 7 = 154 cm^2.',
      },
    ],
  },
  {
    id: 'exam-phys-upcoming',
    title: 'Fizika: Mexanika va Dinamika Asoslari',
    subjectId: 'sub-phys',
    subjectName: 'Physics (Mexanika & Elektrodinamika)',
    description: 'Nyuton qonunlari, impulsning saqlanishi va mexanik energiya bo\'yicha oraliq nazorat testi.',
    targetClassIds: ['cls-10a'],
    targetClassNames: ['10-A'],
    startDateTime: tomorrow,
    endDateTime: nextWeek,
    durationMinutes: 60,
    totalQuestions: 8,
    totalPoints: 25,
    passingScore: 60,
    isPublished: true,
    areResultsReleased: false,
    createdByTeacherId: 'usr-teacher-2',
    createdByName: 'Javohir Qosimov',
    createdAt: '2026-11-02T10:00:00Z',
    questions: [
      {
        id: 'q-p1',
        questionNumber: 1,
        text: 'Jism 20 m/s boshlang\'ich tezlik bilan vertikal yuqoriga otildi. Jismning erishadigan maksimal balandligini toping (g = 10 m/s^2).',
        options: [
          { id: 'A', text: '10 m' },
          { id: 'B', text: '20 m' },
          { id: 'C', text: '30 m' },
          { id: 'D', text: '40 m' },
        ],
        correctOptionId: 'B',
        points: 3,
      },
    ],
  },
  {
    id: 'exam-eng-completed',
    title: 'Ingliz Tili: CEFR B2 Diagnostic Examination',
    subjectId: 'sub-eng',
    subjectName: 'English Language (CEFR Diagnostic)',
    description: 'B2 Reading comprehension and complex grammatical sentence structure evaluation.',
    targetClassIds: ['cls-10a', 'cls-10b', 'cls-11a'],
    targetClassNames: ['10-A', '10-B', '11-A'],
    startDateTime: '2026-10-25T08:00:00Z',
    endDateTime: yesterday,
    durationMinutes: 40,
    totalQuestions: 5,
    totalPoints: 15,
    passingScore: 65,
    isPublished: true,
    areResultsReleased: true, // Results released!
    createdByTeacherId: 'usr-teacher-1',
    createdByName: 'Nodira Yusupova',
    createdAt: '2026-10-20T08:00:00Z',
    questions: [
      {
        id: 'q-e1',
        questionNumber: 1,
        text: 'Choose the correct form: If I ___ known about the updated schedule, I would have arrived earlier.',
        options: [
          { id: 'A', text: 'have' },
          { id: 'B', text: 'had' },
          { id: 'C', text: 'would' },
          { id: 'D', text: 'should' },
        ],
        correctOptionId: 'B',
        points: 3,
        explanation: 'Third conditional requires "had + past participle" in the if-clause.',
      },
      {
        id: 'q-e2',
        questionNumber: 2,
        text: 'Which word is the closest synonym for "meticulous"?',
        options: [
          { id: 'A', text: 'Careless' },
          { id: 'B', text: 'Diligent and precise' },
          { id: 'C', text: 'Superficial' },
          { id: 'D', text: 'Hasty' },
        ],
        correctOptionId: 'B',
        points: 3,
        explanation: 'Meticulous means showing great attention to detail; very careful and precise.',
      },
      {
        id: 'q-e3',
        questionNumber: 3,
        text: 'Identify the passive sentence:',
        options: [
          { id: 'A', text: 'The student wrote the essay.' },
          { id: 'B', text: 'The examination paper was evaluated by the committee.' },
          { id: 'C', text: 'The teacher entered the laboratory.' },
          { id: 'D', text: 'We will present our findings tomorrow.' },
        ],
        correctOptionId: 'B',
        points: 3,
        explanation: 'Option B uses passive voice "was evaluated by...".',
      },
      {
        id: 'q-e4',
        questionNumber: 4,
        text: 'Despite ___ tired, he managed to complete all the exercises.',
        options: [
          { id: 'A', text: 'being' },
          { id: 'B', text: 'he was' },
          { id: 'C', text: 'to be' },
          { id: 'D', text: 'been' },
        ],
        correctOptionId: 'A',
        points: 3,
        explanation: 'Preposition "despite" is followed by a gerund (-ing form).',
      },
      {
        id: 'q-e5',
        questionNumber: 5,
        text: 'Choose the appropriate connector: She studied hard; ___, she secured top ranks in the Olympiad.',
        options: [
          { id: 'A', text: 'consequently' },
          { id: 'B', text: 'although' },
          { id: 'C', text: 'despite' },
          { id: 'D', text: 'otherwise' },
        ],
        correctOptionId: 'A',
        points: 3,
        explanation: 'Consequently shows logical result or cause-effect.',
      },
    ],
  },
  {
    id: 'exam-cs-pending',
    title: 'Informatika va Algoritmik Fikrlash',
    subjectId: 'sub-cs',
    subjectName: 'Computer Science (Informatika)',
    description: 'Python dasturlash tili asoslari, qidiruv algoritmlari va rekursiya.',
    targetClassIds: ['cls-10a'],
    targetClassNames: ['10-A'],
    startDateTime: '2026-10-28T09:00:00Z',
    endDateTime: yesterday,
    durationMinutes: 30,
    totalQuestions: 5,
    totalPoints: 15,
    passingScore: 60,
    isPublished: true,
    areResultsReleased: false, // Results NOT released yet!
    createdByTeacherId: 'usr-teacher-1',
    createdByName: 'Nodira Yusupova',
    createdAt: '2026-10-25T08:00:00Z',
    questions: [
      {
        id: 'q-c1',
        questionNumber: 1,
        text: 'Python dasturida `print(2 ** 3 ** 2)` kodi qanday natija beradi?',
        options: [
          { id: 'A', text: '64' },
          { id: 'B', text: '512' },
          { id: 'C', text: '36' },
          { id: 'D', text: '128' },
        ],
        correctOptionId: 'B',
        points: 3,
        explanation: 'Daraajaga ko\'tarish amali o\'ngdan chapga bajariladi: 3^2 = 9, so\'ng 2^9 = 512.',
      },
    ],
  },
];

const INITIAL_RESULTS: ExamResult[] = [
  {
    id: 'res-eng-student1',
    examId: 'exam-eng-completed',
    examTitle: 'Ingliz Tili: CEFR B2 Diagnostic Examination',
    subjectName: 'English Language (CEFR Diagnostic)',
    studentId: 'usr-student-1',
    studentName: 'Sardor Rahimov',
    studentCode: 'ST-2026-0842',
    className: '10-A',
    totalQuestions: 5,
    correctAnswers: 4,
    incorrectAnswers: 1,
    unansweredCount: 0,
    score: 12,
    totalPoints: 15,
    percentage: 80,
    isPassed: true,
    completedAt: '2026-10-26T14:42:00Z',
    isReleased: true,
    studentAnswers: {
      'q-e1': 'B',
      'q-e2': 'B',
      'q-e3': 'B',
      'q-e4': 'A',
      'q-e5': 'D', // Wrong answer chosen
    },
  },
  {
    id: 'res-cs-student1',
    examId: 'exam-cs-pending',
    examTitle: 'Informatika va Algoritmik Fikrlash',
    subjectName: 'Computer Science (Informatika)',
    studentId: 'usr-student-1',
    studentName: 'Sardor Rahimov',
    studentCode: 'ST-2026-0842',
    className: '10-A',
    totalQuestions: 5,
    correctAnswers: 5,
    incorrectAnswers: 0,
    unansweredCount: 0,
    score: 15,
    totalPoints: 15,
    percentage: 100,
    isPassed: true,
    completedAt: '2026-10-29T11:20:00Z',
    isReleased: false, // Admin has not released yet
    studentAnswers: {
      'q-c1': 'B',
    },
  },
  {
    id: 'res-eng-student2',
    examId: 'exam-eng-completed',
    examTitle: 'Ingliz Tili: CEFR B2 Diagnostic Examination',
    subjectName: 'English Language (CEFR Diagnostic)',
    studentId: 'usr-student-2',
    studentName: 'Madina Alimova',
    studentCode: 'ST-2026-0843',
    className: '10-A',
    totalQuestions: 5,
    correctAnswers: 5,
    incorrectAnswers: 0,
    unansweredCount: 0,
    score: 15,
    totalPoints: 15,
    percentage: 100,
    isPassed: true,
    completedAt: '2026-10-26T15:10:00Z',
    isReleased: true,
    studentAnswers: {
      'q-e1': 'B',
      'q-e2': 'B',
      'q-e3': 'B',
      'q-e4': 'A',
      'q-e5': 'A',
    },
  },
];

/**
 * Local storage backed mock database repository
 */
class MockDatabase {
  private usersKey = 'chsb_db_users';
  private classesKey = 'chsb_db_classes';
  private subjectsKey = 'chsb_db_subjects';
  private examsKey = 'chsb_db_exams';
  private resultsKey = 'chsb_db_results';
  private sessionsKey = 'chsb_db_sessions';

  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem(this.usersKey)) {
      localStorage.setItem(this.usersKey, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(this.classesKey)) {
      localStorage.setItem(this.classesKey, JSON.stringify(INITIAL_CLASSES));
    }
    if (!localStorage.getItem(this.subjectsKey)) {
      localStorage.setItem(this.subjectsKey, JSON.stringify(INITIAL_SUBJECTS));
    }
    if (!localStorage.getItem(this.examsKey)) {
      localStorage.setItem(this.examsKey, JSON.stringify(INITIAL_EXAMS));
    }
    if (!localStorage.getItem(this.resultsKey)) {
      localStorage.setItem(this.resultsKey, JSON.stringify(INITIAL_RESULTS));
    }
    if (!localStorage.getItem(this.sessionsKey)) {
      localStorage.setItem(this.sessionsKey, JSON.stringify({}));
    }
  }

  // Users
  getUsers(): User[] {
    const raw = localStorage.getItem(this.usersKey);
    return raw ? JSON.parse(raw) : INITIAL_USERS;
  }

  saveUsers(users: User[]) {
    localStorage.setItem(this.usersKey, JSON.stringify(users));
  }

  // Classes
  getClasses(): ClassGroup[] {
    const raw = localStorage.getItem(this.classesKey);
    return raw ? JSON.parse(raw) : INITIAL_CLASSES;
  }

  saveClasses(classes: ClassGroup[]) {
    localStorage.setItem(this.classesKey, JSON.stringify(classes));
  }

  // Subjects
  getSubjects(): Subject[] {
    const raw = localStorage.getItem(this.subjectsKey);
    return raw ? JSON.parse(raw) : INITIAL_SUBJECTS;
  }

  saveSubjects(subjects: Subject[]) {
    localStorage.setItem(this.subjectsKey, JSON.stringify(subjects));
  }

  // Exams
  getExams(): Exam[] {
    const raw = localStorage.getItem(this.examsKey);
    return raw ? JSON.parse(raw) : INITIAL_EXAMS;
  }

  saveExams(exams: Exam[]) {
    localStorage.setItem(this.examsKey, JSON.stringify(exams));
  }

  // Results
  getResults(): ExamResult[] {
    const raw = localStorage.getItem(this.resultsKey);
    return raw ? JSON.parse(raw) : INITIAL_RESULTS;
  }

  saveResults(results: ExamResult[]) {
    localStorage.setItem(this.resultsKey, JSON.stringify(results));
  }

  // Student exam sessions
  getSessions(): Record<string, StudentExamSession> {
    const raw = localStorage.getItem(this.sessionsKey);
    return raw ? JSON.parse(raw) : {};
  }

  saveSessions(sessions: Record<string, StudentExamSession>) {
    localStorage.setItem(this.sessionsKey, JSON.stringify(sessions));
  }

  resetAllToDefaults() {
    localStorage.setItem(this.usersKey, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(this.classesKey, JSON.stringify(INITIAL_CLASSES));
    localStorage.setItem(this.subjectsKey, JSON.stringify(INITIAL_SUBJECTS));
    localStorage.setItem(this.examsKey, JSON.stringify(INITIAL_EXAMS));
    localStorage.setItem(this.resultsKey, JSON.stringify(INITIAL_RESULTS));
    localStorage.setItem(this.sessionsKey, JSON.stringify({}));
  }
}

export const mockDb = new MockDatabase();

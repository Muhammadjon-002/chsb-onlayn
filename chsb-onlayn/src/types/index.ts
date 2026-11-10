export type UserRole = "student" | "teacher" | "admin";

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  // Student specific
  studentId?: string;
  classId?: string;
  className?: string;
  groupName?: string;
  // Teacher specific
  assignedClassIds?: string[];
  assignedSubjects?: string[];
  // Status
  status: "active" | "inactive";
  createdAt: string;
}
export interface ClassGroup {
  id: string;
  name: string;
  grade: number;
  stream?: string;
  academicYear: string;
  studentCount: number;
  classTeacherName?: string;
  teacherId?: string;
  createdAt: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: "active" | "inactive";
}

export interface QuestionOption {
  id: "A" | "B" | "C" | "D";
  text: string;
}

export interface Question {
  id: string;
  questionNumber: number;
  text: string;
  imageUrl?: string;
  options: QuestionOption[];
  correctOptionId?: "A" | "B" | "C" | "D"; // Hidden from students before completion & release!
  points: number;
  explanation?: string;
}

export type ExamStatus = "upcoming" | "available" | "in_progress" | "completed";

export interface Exam {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  description: string;
  targetClassIds: string[]; // Class IDs
  targetClassNames?: string[];
  startDateTime: string; // ISO string
  endDateTime: string; // ISO string
  durationMinutes: number;
  totalQuestions: number;
  totalPoints: number;
  passingScore: number;
  isPublished: boolean;
  areResultsReleased: boolean;
  isAnalysisReleased?: boolean;
  createdByTeacherId?: string;
  createdByName?: string;
  createdAt: string;
  questions?: Question[];
}

export interface StudentExamSession {
  examId: string;
  studentId: string;
  startedAt: string;
  expiresAt: string; // Synced with duration & exam end time
  answers: Record<string, "A" | "B" | "C" | "D">; // questionId -> chosenOption
  flaggedQuestionIds: string[];
  isSubmitted: boolean;
  submittedAt?: string;
}

export interface ExamResult {
  id: string;
  examId: string;
  examTitle: string;
  subjectName: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  className: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredCount: number;
  score: number;
  totalPoints: number;
  percentage: number;
  isPassed: boolean;
  completedAt: string;
  isReleased: boolean; // Only visible to student when true
  isAnalysisReleased?: boolean;
  studentAnswers?: Record<string, "A" | "B" | "C" | "D">;
}

export interface SystemStats {
  totalStudents: number;
  totalTeachers: number;
  totalExaminations: number;
  completedExaminations: number;
  activeExaminations: number;
  recentActivity: Array<{
    id: string;
    description: string;
    timeAgo: string;
    type:
      | "submission"
      | "exam_created"
      | "student_enrolled"
      | "results_released";
  }>;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

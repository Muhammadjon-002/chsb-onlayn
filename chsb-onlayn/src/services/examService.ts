import { apiClient } from "./api";
import { mockDb } from "./mockData";
import { Exam, Question, StudentExamSession, ExamResult, User } from "../types";
import { calculateExamScore } from "../utils/examCalculations";

const USE_REAL_BACKEND = import.meta.env.VITE_USE_REAL_BACKEND === "true";

export const examService = {
  /**
   * Retrieves all exams assigned to the student's class group
   */
  async getStudentExams(student: User): Promise<Exam[]> {
    if (USE_REAL_BACKEND) {
      const res = await apiClient.get<{ data: Exam[] }>(`/api/student/exams`);
      return res.data.data;
    }

    await new Promise((r) => setTimeout(r, 200));
    const allExams = mockDb.getExams();
    const sessions = mockDb.getSessions();
    const results = mockDb.getResults();

    return allExams
      .filter((exam) => {
        // Must be published and student's class must be in targetClassIds
        if (!exam.isPublished) return false;
        if (!student.classId) return true;
        return exam.targetClassIds.includes(student.classId);
      })
      .map((exam) => {
        // Sanitize: do NOT send questions in dashboard listing
        const { questions, ...rest } = exam;
        return {
          ...rest,
          totalQuestions: exam.questions
            ? exam.questions.length
            : exam.totalQuestions,
        };
      });
  },

  /**
   * Gets exam details for student before or during exam taking.
   * Strips correct answers and explanations for active exams!
   */
  async getExamForStudent(
    examId: string,
    studentId: string,
  ): Promise<{ exam: Exam; session: StudentExamSession }> {
    if (USE_REAL_BACKEND) {
      const res = await apiClient.get<{
        data: { exam: Exam; session: StudentExamSession };
      }>(`/api/student/exams/${examId}`);
      return res.data.data;
    }

    await new Promise((r) => setTimeout(r, 200));
    const allExams = mockDb.getExams();
    const exam = allExams.find((e) => e.id === examId);
    if (!exam) {
      throw new Error("Examination not found.");
    }

    const sessionKey = `${studentId}_${examId}`;
    const sessions = mockDb.getSessions();
    let session = sessions[sessionKey];

    const now = new Date();
    const startMs = new Date(exam.startDateTime).getTime();
    const endMs = new Date(exam.endDateTime).getTime();

    // Check scheduling: cannot access before start
    if (now.getTime() < startMs) {
      throw new Error(
        `This examination is scheduled to begin at ${new Date(exam.startDateTime).toLocaleString()}. You cannot access it early.`,
      );
    }

    // Initialize or continue session
    if (!session) {
      // Calculate expiration: duration in minutes from now, or endDateTime, whichever is earlier
      const durationMs = exam.durationMinutes * 60 * 1000;
      const calculatedExpiresMs = Math.min(now.getTime() + durationMs, endMs);

      session = {
        examId,
        studentId,
        startedAt: now.toISOString(),
        expiresAt: new Date(calculatedExpiresMs).toISOString(),
        answers: {},
        flaggedQuestionIds: [],
        isSubmitted: false,
      };
      sessions[sessionKey] = session;
      mockDb.saveSessions(sessions);
    }

    // Sanitize questions: strip correctOptionId & explanation for security
    const sanitizedQuestions = (exam.questions || []).map((q) => {
      const { correctOptionId, explanation, ...safeQ } = q;
      return safeQ as Question;
    });

    return {
      exam: {
        ...exam,
        questions: sanitizedQuestions,
      },
      session,
    };
  },

  /**
   * Autosaves a student's chosen answer for a question
   */
  async saveAnswer(
    examId: string,
    studentId: string,
    questionId: string,
    optionId: "A" | "B" | "C" | "D",
  ): Promise<StudentExamSession> {
    if (USE_REAL_BACKEND) {
      const res = await apiClient.post<{ data: StudentExamSession }>(
        `/student/exams/${examId}/answer`,
        {
          questionId,
          optionId,
        },
      );
      return res.data.data;
    }

    const sessionKey = `${studentId}_${examId}`;
    const sessions = mockDb.getSessions();
    const session = sessions[sessionKey];
    if (!session) {
      throw new Error("Exam session expired or not found.");
    }

    if (session.isSubmitted) {
      throw new Error("Cannot change answers on a submitted examination.");
    }

    // Check if time expired
    if (new Date().getTime() > new Date(session.expiresAt).getTime()) {
      throw new Error("Examination time has expired.");
    }

    session.answers[questionId] = optionId;
    sessions[sessionKey] = session;
    mockDb.saveSessions(sessions);

    return session;
  },

  /**
   * Toggles flag/bookmark for a question
   */
  async toggleQuestionFlag(
    examId: string,
    studentId: string,
    questionId: string,
  ): Promise<string[]> {
    if (USE_REAL_BACKEND) {
      const res = await apiClient.post<{ data: string[] }>(
        `/student/exams/${examId}/flag`,
        { questionId },
      );
      return res.data.data;
    }

    const sessionKey = `${studentId}_${examId}`;
    const sessions = mockDb.getSessions();
    const session = sessions[sessionKey];
    if (!session) throw new Error("Session not found.");

    const exists = session.flaggedQuestionIds.includes(questionId);
    if (exists) {
      session.flaggedQuestionIds = session.flaggedQuestionIds.filter(
        (id) => id !== questionId,
      );
    } else {
      session.flaggedQuestionIds.push(questionId);
    }

    sessions[sessionKey] = session;
    mockDb.saveSessions(sessions);
    return session.flaggedQuestionIds;
  },

  /**
   * Finalizes and submits the exam, computing result
   */
  async submitExam(examId: string, studentId: string): Promise<ExamResult> {
    if (USE_REAL_BACKEND) {
      const res = await apiClient.post<{ data: ExamResult }>(
        `/student/exams/${examId}/submit`,
      );
      return res.data.data;
    }

    await new Promise((r) => setTimeout(r, 400));
    const sessionKey = `${studentId}_${examId}`;
    const sessions = mockDb.getSessions();
    const session = sessions[sessionKey];
    if (!session) throw new Error("Session not found.");

    const exams = mockDb.getExams();
    const exam = exams.find((e) => e.id === examId);
    if (!exam) throw new Error("Exam not found.");

    const users = mockDb.getUsers();
    const student = users.find((u) => u.id === studentId);

    // Calculate score using our tested calculation utility
    const scoreMetrics = calculateExamScore(
      exam.questions || [],
      session.answers,
      exam.passingScore,
    );

    const resultId = `res-${exam.id}-${studentId}`;
    const newResult: ExamResult = {
      id: resultId,
      examId: exam.id,
      examTitle: exam.title,
      subjectName: exam.subjectName,
      studentId: student?.id || studentId,
      studentName: student?.fullName || "Student",
      studentCode: student?.studentId || "ST-2026",
      className: student?.className || "10-A",
      ...scoreMetrics,
      completedAt: new Date().toISOString(),
      isReleased: exam.areResultsReleased,
      studentAnswers: session.answers,
    };

    // Update session
    session.isSubmitted = true;
    session.submittedAt = new Date().toISOString();
    sessions[sessionKey] = session;
    mockDb.saveSessions(sessions);

    // Upsert into results
    const results = mockDb.getResults().filter((r) => r.id !== resultId);
    results.push(newResult);
    mockDb.saveResults(results);

    return newResult;
  },

  /**
   * Admin / Teacher operations
   */
  async getAllExams(): Promise<Exam[]> {
    if (USE_REAL_BACKEND) {
      const res = await apiClient.get<{ data: Exam[] }>("/exams");
      return res.data.data;
    }
    await new Promise((r) => setTimeout(r, 200));
    return mockDb.getExams();
  },

  async getExamById(id: string): Promise<Exam> {
    if (USE_REAL_BACKEND) {
      const res = await apiClient.get<{ data: Exam }>(`/exams/${id}`);
      return res.data.data;
    }
    await new Promise((r) => setTimeout(r, 150));
    const exam = mockDb.getExams().find((e) => e.id === id);
    if (!exam) throw new Error("Exam not found");
    return exam;
  },

  async saveExam(examData: Partial<Exam>): Promise<Exam> {
    if (USE_REAL_BACKEND) {
      if (examData.id) {
        const res = await apiClient.put<{ data: Exam }>(
          `/exams/${examData.id}`,
          examData,
        );
        return res.data.data;
      }
      const res = await apiClient.post<{ data: Exam }>("/exams", examData);
      return res.data.data;
    }

    await new Promise((r) => setTimeout(r, 300));
    const exams = mockDb.getExams();
    let saved: Exam;

    if (examData.id) {
      const index = exams.findIndex((e) => e.id === examData.id);
      if (index === -1) throw new Error("Exam not found for update");
      saved = {
        ...exams[index],
        ...examData,
        totalQuestions:
          examData.questions?.length ?? exams[index].totalQuestions,
        totalPoints:
          (examData.questions || []).reduce(
            (acc, q) => acc + (q.points || 1),
            0,
          ) || exams[index].totalPoints,
      } as Exam;
      exams[index] = saved;
    } else {
      const newId = `exam-${Date.now()}`;
      saved = {
        id: newId,
        title: examData.title || "New Examination",
        subjectId: examData.subjectId || "sub-math",
        subjectName: examData.subjectName || "Mathematics",
        description: examData.description || "",
        targetClassIds: examData.targetClassIds || [],
        targetClassNames: examData.targetClassNames || [],
        startDateTime: examData.startDateTime || new Date().toISOString(),
        endDateTime:
          examData.endDateTime ||
          new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        durationMinutes: examData.durationMinutes || 45,
        totalQuestions: examData.questions?.length || 0,
        totalPoints:
          (examData.questions || []).reduce(
            (acc, q) => acc + (q.points || 1),
            0,
          ) || 30,
        passingScore: examData.passingScore || 60,
        isPublished: examData.isPublished ?? false,
        areResultsReleased: false,
        createdByName: examData.createdByName || "Staff",
        createdAt: new Date().toISOString(),
        questions: examData.questions || [],
      };
      exams.unshift(saved);
    }

    mockDb.saveExams(exams);
    return saved;
  },

  async deleteExam(id: string): Promise<void> {
    if (USE_REAL_BACKEND) {
      await apiClient.delete(`/exams/${id}`);
      return;
    }
    const exams = mockDb.getExams().filter((e) => e.id !== id);
    mockDb.saveExams(exams);
  },
  async parseWordFile(file: File): Promise<{
    questions: Question[];
    errors: string[];
    warnings: string[];
    totalQuestions: number;
  }> {
    if (!USE_REAL_BACKEND) {
      throw new Error("Word import faqat real backend rejimida ishlaydi.");
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await apiClient.post<{
      data: {
        questions: Question[];
        errors: string[];
        warnings: string[];
        totalQuestions: number;
      };
    }>("/admin/exams/parse-word", formData);

    return res.data.data;
  },
  async togglePublish(id: string): Promise<Exam> {
    if (USE_REAL_BACKEND) {
      const exam = await this.getExamById(id);

      const res = await apiClient.put<{ data: Exam }>(`/exams/${id}`, {
        ...exam,
        isPublished: !exam.isPublished,
      });

      return res.data.data;
    }

    const exams = mockDb.getExams();
    const exam = exams.find((e) => e.id === id);

    if (!exam) throw new Error("Exam not found");

    exam.isPublished = !exam.isPublished;
    mockDb.saveExams(exams);

    return exam;
  },
};

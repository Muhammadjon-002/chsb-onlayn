import { apiClient } from "./api";
import { Exam } from "../types";
import { mockDb } from "./mockData";
import { ExamResult } from "../types";

const USE_REAL_BACKEND = import.meta.env.VITE_USE_REAL_BACKEND === "true";

export const resultService = {
  /**
   * Retrieves results for a specific student
   */
  async getStudentResults(studentId: string): Promise<ExamResult[]> {
    if (USE_REAL_BACKEND) {
      const res = await apiClient.get<{ data: ExamResult[] }>(
        `/api/student/results`,
      );
      return res.data.data;
    }

    await new Promise((r) => setTimeout(r, 200));
    const all = mockDb.getResults();
    return all.filter((r) => r.studentId === studentId);
  },

  /**
   * Retrieves single result by result ID
   */
  async getResultById(resultId: string): Promise<ExamResult> {
    if (USE_REAL_BACKEND) {
      const res = await apiClient.get<{ data: ExamResult }>(
        `/results/${resultId}`,
      );
      return res.data.data;
    }

    await new Promise((r) => setTimeout(r, 150));
    const all = mockDb.getResults();
    const result = all.find((r) => r.id === resultId || r.examId === resultId);
    if (!result) throw new Error("Result not found.");
    return result;
  },
  async getExamAnalysis(resultId: string): Promise<Exam> {
    if (USE_REAL_BACKEND) {
      const res = await apiClient.get<{ data: Exam }>(
        `/api/student/results/${resultId}/analysis`,
      );
      return res.data.data;
    }

    const result = mockDb.getResults().find((r) => r.id === resultId);
    if (!result) throw new Error("Result not found.");

    const exam = mockDb.getExams().find((e) => e.id === result.examId);
    if (!exam) throw new Error("Exam not found.");

    return exam;
  },

  /**
   * Retrieves all results for admin / teacher grading review
   */
  async getAllResults(filters?: {
    examId?: string;
    className?: string;
  }): Promise<ExamResult[]> {
    if (USE_REAL_BACKEND) {
      const res = await apiClient.get<{ data: ExamResult[] }>("/results", {
        params: filters,
      });
      return res.data.data;
    }

    await new Promise((r) => setTimeout(r, 250));
    let results = mockDb.getResults();

    if (filters?.examId && filters.examId !== "all") {
      results = results.filter((r) => r.examId === filters.examId);
    }
    if (filters?.className && filters.className !== "all") {
      results = results.filter((r) => r.className === filters.className);
    }

    return results;
  },

  /**
   * Admin releases or hides results for an examination
   */
  async toggleResultRelease(
    examId: string,
    shouldRelease: boolean,
  ): Promise<void> {
    if (USE_REAL_BACKEND) {
      await apiClient.patch(`/exams/${examId}/release-results`, {
        isReleased: shouldRelease,
      });
      return;
    }

    await new Promise((r) => setTimeout(r, 200));

    // Update exam
    const exams = mockDb.getExams();
    const exam = exams.find((e) => e.id === examId);
    if (exam) {
      exam.areResultsReleased = shouldRelease;
      mockDb.saveExams(exams);
    }

    // Update all student results for this exam
    const results = mockDb.getResults();
    for (const r of results) {
      if (r.examId === examId) {
        r.isReleased = shouldRelease;
      }
    }
    mockDb.saveResults(results);
  },
  async toggleAnalysisRelease(
    examId: string,
    shouldRelease: boolean,
  ): Promise<void> {
    if (USE_REAL_BACKEND) {
      await apiClient.patch(`/exams/${examId}/release-analysis`, {
        isAnalysisReleased: shouldRelease,
      });
      return;
    }

    await new Promise((r) => setTimeout(r, 200));

    const exams = mockDb.getExams();
    const exam = exams.find((e) => e.id === examId);

    if (exam) {
      exam.isAnalysisReleased = shouldRelease;
      mockDb.saveExams(exams);
    }
  },

  /**
   * Helper to format and download CSV export of results
   */
  exportResultsCsv(
    results: ExamResult[],
    filename = "CHSB_Exam_Results.csv",
  ): void {
    const headers = [
      "Student ID",
      "Student Full Name",
      "Class",
      "Exam Title",
      "Subject",
      "Score",
      "Total Points",
      "Percentage",
      "Status",
      "Date Completed",
    ];
    const rows = results.map((r) => [
      `"${r.studentCode}"`,
      `"${r.studentName}"`,
      `"${r.className}"`,
      `"${r.examTitle}"`,
      `"${r.subjectName}"`,
      r.score,
      r.totalPoints,
      `${Number(r.percentage).toFixed(1)}%`,
      r.isPassed ? "PASSED" : "FAILED",
      `"${new Date(r.completedAt).toLocaleString()}"`,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};

import { apiClient } from "./api";
import { mockDb } from "./mockData";
import { ClassGroup, Exam, ExamResult, User } from "../types";
import { Subject } from "../types";

const USE_REAL_BACKEND = import.meta.env.VITE_USE_REAL_BACKEND === "true";

export const teacherService = {
  /**
   * Retrieves classes assigned to this teacher
   */
  async getAssignedClasses(teacher: User): Promise<ClassGroup[]> {
    if (USE_REAL_BACKEND) {
      const res = await apiClient.get<{ data: ClassGroup[] }>(
        "/teacher/classes",
      );
      return res.data.data;
    }

    await new Promise((r) => setTimeout(r, 150));
    const allClasses = mockDb.getClasses();
    if (!teacher.assignedClassIds || teacher.assignedClassIds.length === 0) {
      return allClasses.slice(0, 2);
    }
    return allClasses.filter((c) => teacher.assignedClassIds?.includes(c.id));
  },

  /**
   * Retrieves exams created by this teacher or relevant to their assigned classes
   */
  async getTeacherExams(teacher: User): Promise<Exam[]> {
    if (USE_REAL_BACKEND) {
      const res = await apiClient.get<{ data: Exam[] }>("/teacher/exams");
      return res.data.data;
    }

    await new Promise((r) => setTimeout(r, 200));
    const allExams = mockDb.getExams();
    return allExams.filter(
      (e) =>
        e.createdByTeacherId === teacher.id ||
        e.targetClassIds.some((cid) => teacher.assignedClassIds?.includes(cid)),
    );
  },

  /**
   * Retrieves results for teacher's assigned classes only
   */
  async getTeacherResults(teacher: User): Promise<ExamResult[]> {
    if (USE_REAL_BACKEND) {
      const res = await apiClient.get<{ data: ExamResult[] }>(
        "/teacher/results",
      );
      return res.data.data;
    }

    await new Promise((r) => setTimeout(r, 200));
    const assignedClasses = await this.getAssignedClasses(teacher);
    const assignedClassNames = assignedClasses.map((c) => c.name);
    const allResults = mockDb.getResults();

    return allResults.filter((r) => assignedClassNames.includes(r.className));
  },
  async getSubjects(): Promise<Subject[]> {
    if (USE_REAL_BACKEND) {
      const res = await apiClient.get<{ data: Subject[] }>("/teacher/subjects");
      return res.data.data;
    }

    return mockDb.getSubjects();
  },
};

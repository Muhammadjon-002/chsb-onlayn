import { apiClient } from "./api";
import { mockDb } from "./mockData";
import { SystemStats, User, ClassGroup, Subject } from "../types";

const USE_REAL_BACKEND = import.meta.env.VITE_USE_REAL_BACKEND === "true";

export const adminService = {
  async getTeachers(): Promise<User[]> {
    if (USE_REAL_BACKEND) {
      const res = await apiClient.get<{ data: User[] }>("/admin/teachers");
      return res.data.data;
    }

    return mockDb.getUsers().filter((u) => u.role === "teacher");
  },
  async saveTeacher(
    teacherData: Partial<User> & { password?: string },
  ): Promise<User> {
    if (USE_REAL_BACKEND) {
      if (teacherData.id) {
        const res = await apiClient.put<{ data: User }>(
          `/admin/teachers/${teacherData.id}`,
          teacherData,
        );
        return res.data.data;
      }

      const res = await apiClient.post<{ data: User }>(
        "/admin/teachers",
        teacherData,
      );
      return res.data.data;
    }

    throw new Error("Teacher management requires the real backend.");
  },

  async deleteTeacher(id: string): Promise<void> {
    if (USE_REAL_BACKEND) {
      await apiClient.delete(`/admin/teachers/${id}`);
      return;
    }

    throw new Error("Teacher management requires the real backend.");
  },

  async assignTeacherClasses(
    teacherId: string,
    classIds: string[],
  ): Promise<void> {
    if (USE_REAL_BACKEND) {
      await apiClient.post(`/admin/teachers/${teacherId}/classes`, {
        classIds,
      });
      return;
    }

    throw new Error("Teacher management requires the real backend.");
  },
  async assignTeacherSubjects(
    teacherId: string,
    subjectIds: string[],
  ): Promise<void> {
    if (USE_REAL_BACKEND) {
      await apiClient.post(`/admin/teachers/${teacherId}/subjects`, {
        subjectIds,
      });
      return;
    }

    throw new Error("Teacher subject assignment requires the real backend.");
  },
  async getDashboardStats(): Promise<SystemStats> {
    if (USE_REAL_BACKEND) {
      const res = await apiClient.get<{ data: SystemStats }>("/admin/stats");
      return res.data.data;
    }

    await new Promise((r) => setTimeout(r, 200));
    const users = mockDb.getUsers();
    const exams = mockDb.getExams();
    const results = mockDb.getResults();

    const students = users.filter((u) => u.role === "student");
    const teachers = users.filter((u) => u.role === "teacher");
    const now = new Date().getTime();

    const activeExams = exams.filter((e) => {
      const s = new Date(e.startDateTime).getTime();
      const end = new Date(e.endDateTime).getTime();
      return e.isPublished && now >= s && now <= end;
    });

    return {
      totalStudents: students.length,
      totalTeachers: teachers.length,
      totalExaminations: exams.length,
      completedExaminations: results.length,
      activeExaminations: activeExams.length,
      recentActivity: [
        {
          id: "act-1",
          description:
            'Sardor Rahimov submitted "Mathematics (Algebra & Geometry)" exam.',
          timeAgo: "12 minutes ago",
          type: "submission",
        },
        {
          id: "act-2",
          description:
            'Nodira Yusupova published "Fizika: Mexanika va Dinamika Asoslari".',
          timeAgo: "1 hour ago",
          type: "exam_created",
        },
        {
          id: "act-3",
          description:
            "English CEFR Diagnostic Examination official results were released to 10-A.",
          timeAgo: "3 hours ago",
          type: "results_released",
        },
        {
          id: "act-4",
          description: "New student Bekzod Toshmatov enrolled into Class 10-B.",
          timeAgo: "1 day ago",
          type: "student_enrolled",
        },
      ],
    };
  },

  // Student CRUD
  async getStudents(): Promise<User[]> {
    if (USE_REAL_BACKEND) {
      const res = await apiClient.get<{ data: User[] }>("/admin/students");
      return res.data.data;
    }
    await new Promise((r) => setTimeout(r, 200));
    return mockDb.getUsers().filter((u) => u.role === "student");
  },

  async saveStudent(studentData: Partial<User>): Promise<User> {
    if (USE_REAL_BACKEND) {
      if (studentData.id) {
        const res = await apiClient.put<{ data: User }>(
          `/admin/students/${studentData.id}`,
          studentData,
        );
        return res.data.data;
      }
      const res = await apiClient.post<{ data: User }>(
        "/admin/students",
        studentData,
      );
      return res.data.data;
    }

    await new Promise((r) => setTimeout(r, 250));
    const users = mockDb.getUsers();
    let saved: User;

    if (studentData.id) {
      const idx = users.findIndex((u) => u.id === studentData.id);
      if (idx === -1) throw new Error("Student not found");
      saved = { ...users[idx], ...studentData } as User;
      users[idx] = saved;
    } else {
      const newId = `usr-student-${Date.now()}`;
      saved = {
        id: newId,
        username:
          studentData.username ||
          `student_${Math.floor(1000 + Math.random() * 9000)}`,
        fullName: studentData.fullName || "New Student",
        email:
          studentData.email ||
          `${studentData.username || "student"}@school-chsb.uz`,
        role: "student",
        studentId:
          studentData.studentId ||
          `ST-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        classId: studentData.classId || "cls-10a",
        className: studentData.className || "10-A",
        groupName: studentData.groupName || "Exact Sciences",
        status: studentData.status || "active",
        createdAt: new Date().toISOString(),
      };
      users.push(saved);
    }
    mockDb.saveUsers(users);
    return saved;
  },

  async deleteStudent(studentId: string): Promise<void> {
    if (USE_REAL_BACKEND) {
      await apiClient.delete(`/admin/students/${studentId}`);
      return;
    }
    const users = mockDb.getUsers().filter((u) => u.id !== studentId);
    mockDb.saveUsers(users);
  },

  // Class CRUD
  async getClasses(): Promise<ClassGroup[]> {
    if (USE_REAL_BACKEND) {
      const res = await apiClient.get<{ data: ClassGroup[] }>("/admin/classes");
      return res.data.data;
    }
    await new Promise((r) => setTimeout(r, 150));
    return mockDb.getClasses();
  },

  async saveClass(classData: Partial<ClassGroup>): Promise<ClassGroup> {
    if (USE_REAL_BACKEND) {
      if (classData.id) {
        const res = await apiClient.put<{ data: ClassGroup }>(
          `/admin/classes/${classData.id}`,
          classData,
        );
        return res.data.data;
      }
      const res = await apiClient.post<{ data: ClassGroup }>(
        "/admin/classes",
        classData,
      );
      return res.data.data;
    }

    const classes = mockDb.getClasses();
    let saved: ClassGroup;
    if (classData.id) {
      const idx = classes.findIndex((c) => c.id === classData.id);
      if (idx === -1) throw new Error("Class not found");
      saved = { ...classes[idx], ...classData } as ClassGroup;
      classes[idx] = saved;
    } else {
      saved = {
        id: `cls-${Date.now()}`,
        name: classData.name || "New Class",
        grade: classData.grade || 10,
        stream: classData.stream || "Standard Curriculum",
        academicYear: classData.academicYear || "2026-2027",
        studentCount: classData.studentCount || 0,
        classTeacherName: classData.classTeacherName || "Not Assigned",
        createdAt: new Date().toISOString(),
      };
      classes.push(saved);
    }
    mockDb.saveClasses(classes);
    return saved;
  },

  // Subject CRUD
  async getSubjects(): Promise<Subject[]> {
    if (USE_REAL_BACKEND) {
      const res = await apiClient.get<{ data: Subject[] }>("/admin/subjects");
      return res.data.data;
    }
    return mockDb.getSubjects();
  },

  async saveSubject(subjectData: Partial<Subject>): Promise<Subject> {
    if (USE_REAL_BACKEND) {
      if (subjectData.id) {
        const res = await apiClient.put<{ data: Subject }>(
          `/admin/subjects/${subjectData.id}`,
          subjectData,
        );
        return res.data.data;
      }

      const res = await apiClient.post<{ data: Subject }>(
        "/admin/subjects",
        subjectData,
      );

      return res.data.data;
    }

    const subjects = mockDb.getSubjects();
    let saved: Subject;

    if (subjectData.id) {
      const idx = subjects.findIndex((s) => s.id === subjectData.id);
      if (idx === -1) throw new Error("Subject not found");

      saved = { ...subjects[idx], ...subjectData } as Subject;
      subjects[idx] = saved;
    } else {
      saved = {
        id: `sub-${Date.now()}`,
        name: subjectData.name || "New Subject",
        code: subjectData.code || "SUB-10",
        description: subjectData.description || "",
        status: subjectData.status || "active",
      };

      subjects.push(saved);
    }

    mockDb.saveSubjects(subjects);
    return saved;
  },

  async deleteSubject(id: string): Promise<void> {
    const subjects = mockDb.getSubjects().filter((s) => s.id !== id);
    mockDb.saveSubjects(subjects);
  },
};

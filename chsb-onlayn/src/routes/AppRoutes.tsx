import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ProtectedRoute } from "./ProtectedRoute";

// Layouts
import { StudentLayout } from "../layouts/StudentLayout";
import { TeacherLayout } from "../layouts/TeacherLayout";
import { AdminLayout } from "../layouts/AdminLayout";

// Pages - Auth
import { LoginPage } from "../pages/auth/LoginPage";

// Pages - Student
import { StudentDashboard } from "../pages/student/StudentDashboard";
import { ExamIntroPage } from "../pages/student/ExamIntroPage";
import { ExamTakingPage } from "../pages/student/ExamTakingPage";
import { StudentResultPage } from "../pages/student/StudentResultPage";
import { StudentResultsListPage } from "../pages/student/StudentResultsListPage";

// Pages - Teacher
import { TeacherDashboard } from "../pages/teacher/TeacherDashboard";
import { TeacherExamsPage } from "../pages/teacher/TeacherExamsPage";
import { TeacherResultsPage } from "../pages/teacher/TeacherResultsPage";

// Pages - Admin
import { AdminTeachersPage } from "../pages/admin/AdminTeachersPage";
import { AdminDashboard } from "../pages/admin/AdminDashboard";
import { AdminStudentsPage } from "../pages/admin/AdminStudentsPage";
import { AdminClassesPage } from "../pages/admin/AdminClassesPage";
import { AdminSubjectsPage } from "../pages/admin/AdminSubjectsPage";
import { AdminExamsPage } from "../pages/admin/AdminExamsPage";
import { AdminResultsPage } from "../pages/admin/AdminResultsPage";

export const AppRoutes: React.FC = () => {
  const { user, role, isAuthenticated } = useAuth();

  // Root redirect logic
  const getHomeRedirect = () => {
    if (!isAuthenticated || !user) return "/login";
    if (role === "admin") return "/admin/dashboard";
    if (role === "teacher") return "/teacher/dashboard";
    return "/student/dashboard";
  };

  return (
    <Routes>
      {/* Admin Portal Routes */}
        
      {/* Public Auth */}
      <Route path="/login" element={<LoginPage />} />

      {/* Root redirect */}
      <Route path="/" element={<Navigate to={getHomeRedirect()} replace />} />

      {/* Proctored Student Exam Taking View (Fullscreen, specialized layout) */}
      <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
        <Route path="/exam/:examId" element={<ExamTakingPage />} />
      </Route>

      {/* Student Portal Routes */}
      <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
        <Route path="/student" element={<StudentLayout />}>
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="exam/:examId/intro" element={<ExamIntroPage />} />
          <Route path="results" element={<StudentResultsListPage />} />
          <Route path="results/:resultId" element={<StudentResultPage />} />
          <Route index element={<Navigate to="/student/dashboard" replace />} />
        </Route>
      </Route>

      {/* Teacher Portal Routes */}
      <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
        <Route path="/teacher" element={<TeacherLayout />}>
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="exams" element={<TeacherExamsPage />} />
          <Route path="results" element={<TeacherResultsPage />} />
          <Route index element={<Navigate to="/teacher/dashboard" replace />} />
        </Route>
      </Route>

      {/* Admin Portal Routes */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="students" element={<AdminStudentsPage />} />
          <Route path="classes" element={<AdminClassesPage />} />
          <Route path="subjects" element={<AdminSubjectsPage />} />
          <Route path="exams" element={<AdminExamsPage />} />
          <Route path="results" element={<AdminResultsPage />} />
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="students" element={<AdminStudentsPage />} />
          <Route path="teachers" element={<AdminTeachersPage />} />
          <Route path="classes" element={<AdminClassesPage />} />
          <Route path="subjects" element={<AdminSubjectsPage />} />
          <Route path="exams" element={<AdminExamsPage />} />
          <Route path="results" element={<AdminResultsPage />} />
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to={getHomeRedirect()} replace />} />
    </Routes>
  );
};

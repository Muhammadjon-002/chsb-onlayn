import { apiClient } from './api';
import { mockDb } from './mockData';
import { User, Exam, ExamResult } from '../types';

const USE_REAL_BACKEND = import.meta.env.VITE_USE_REAL_BACKEND === 'true';

export const studentService = {
  async getProfile(): Promise<User> {
    if (USE_REAL_BACKEND) {
      const res = await apiClient.get<{ data: User }>('/student/profile');
      return res.data.data;
    }
    const currentRaw = localStorage.getItem('chsb_current_user');
    if (currentRaw) {
      return JSON.parse(currentRaw);
    }
    throw new Error('No authenticated student session');
  },

  async getMyResults(studentId: string): Promise<ExamResult[]> {
    if (USE_REAL_BACKEND) {
      const res = await apiClient.get<{ data: ExamResult[] }>('/student/results');
      return res.data.data;
    }
    await new Promise((r) => setTimeout(r, 200));
    return mockDb.getResults().filter((r) => r.studentId === studentId);
  },
};

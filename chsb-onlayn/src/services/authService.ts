import { apiClient } from "./api";
import { mockDb } from "./mockData";
import { User, AuthResponse } from "../types";

const USE_REAL_BACKEND = import.meta.env.VITE_USE_REAL_BACKEND === "true";
console.log("Real Backend : ", USE_REAL_BACKEND);
console.log("API URL: ", import.meta.env.VITE_API_URL);

export const authService = {
  /**
   * Log in user with username & password
   */
  async login(username: string, password: string): Promise<AuthResponse> {
    if (USE_REAL_BACKEND) {
      const res = await apiClient.post<{ data: AuthResponse }>("/auth/login", {
        username: username.trim(),
        password,
      });

      const authData = res.data.data;

      localStorage.setItem("chsb_auth_token", authData.token);
      localStorage.setItem("chsb_current_user", JSON.stringify(authData.user));

      return authData;
    }

    // Realistic mock authentication
    await new Promise((r) => setTimeout(r, 350));

    // Simulated credential check
    const users = mockDb.getUsers();
    const user = users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase(),
    );

    if (!user) {
      throw new Error(
        "Invalid username or user does not exist in CHSB institutional records.",
      );
    }

    if (user.status !== "active") {
      throw new Error(
        "This account has been deactivated by the administration.",
      );
    }

    // Default institutional demo passwords:
    // admin -> admin123, teacher.* -> teacher123, student.* -> student123
    const expectedPassword =
      user.role === "admin"
        ? "admin123"
        : user.role === "teacher"
          ? "teacher123"
          : "student123";

    if (
      password !== expectedPassword &&
      password !== "123456" &&
      password !== "admin"
    ) {
      throw new Error(
        "Incorrect password. Please verify your credentials or contact school admin.",
      );
    }

    const token = `chsb_jwt_token_${user.id}_${Date.now()}`;
    const authData: AuthResponse = {
      token,
      user,
    };

    localStorage.setItem("chsb_auth_token", token);
    localStorage.setItem("chsb_current_user", JSON.stringify(user));

    return authData;
  },

  /**
   * Log out current user
   */
  async logout(): Promise<void> {
    if (USE_REAL_BACKEND) {
      try {
        await apiClient.post("/auth/logout");
      } catch {
        // Ignore network errors on logout
      }
    }
    localStorage.removeItem("chsb_auth_token");
    localStorage.removeItem("chsb_current_user");
  },

  /**
   * Get current authenticated user profile
   */
  async getCurrentUser(): Promise<User | null> {
    const raw = localStorage.getItem("chsb_current_user");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },
};

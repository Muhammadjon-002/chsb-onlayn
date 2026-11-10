import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, UserRole } from "../types";
import { authService } from "../services/authService";
import { mockDb } from "../services/mockData";

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  switchDemoRole: (role: UserRole) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = await authService.getCurrentUser();

        if (storedUser) {
          setUser(storedUser);
        }
      } catch (err) {
        console.error("Failed to restore auth session:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await authService.login(username, password);
      setUser(response.user);
      return response.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const switchDemoRole = async (role: UserRole): Promise<User> => {
    setIsLoading(true);
    try {
      const users = mockDb.getUsers();
      const target = users.find((u) => u.role === role);
      if (!target) throw new Error(`No demo user found for role: ${role}`);

      localStorage.setItem("chsb_current_user", JSON.stringify(target));
      localStorage.setItem("chsb_auth_token", `demo_token_${target.id}`);
      setUser(target);
      return target;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

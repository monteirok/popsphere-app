import { createContext, ReactNode, useContext, useState } from "react";

type User = {
  id: number;
  username: string;
  displayName: string;
  email: string;
  profileImage: string | null;
  bio: string | null;
}

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (credentials: any) => void;
  isLoginPending: boolean;
  register: (credentials: any) => void;
  isRegisterPending: boolean;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Simplified provider that doesn't actually do anything
  // This is just to fix the circular dependency
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const login = (credentials: any) => {
    console.log("Login called", credentials);
  };
  
  const register = (credentials: any) => {
    console.log("Register called", credentials);
  };
  
  const logout = () => {
    console.log("Logout called");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        isLoginPending: false,
        register,
        isRegisterPending: false,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
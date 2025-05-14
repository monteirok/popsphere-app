import React, { createContext, useContext, useState } from 'react';

// Define the shape of the context
type AuthContextType = {
  user: any | null;
  isLoading: boolean;
  error: Error | null;
  login: (credentials: any) => void;
  isLoginPending: boolean;
  register: (credentials: any) => void;
  isRegisterPending: boolean;
  logout: () => void;
};

// Create the context with a default value
const AuthContext = createContext<AuthContextType | null>(null);

// AuthProvider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Mock functions
  const login = (credentials: any) => {
    console.log("Login called with:", credentials);
  };

  const register = (credentials: any) => {
    console.log("Register called with:", credentials);
  };

  const logout = () => {
    console.log("Logout called");
  };

  const value = {
    user,
    isLoading,
    error,
    login,
    isLoginPending: false,
    register,
    isRegisterPending: false,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
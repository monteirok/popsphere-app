import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface User {
  id: number;
  username: string;
  displayName: string;
  email: string;
  profileImage?: string;
  bio?: string;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  password: string;
  email: string;
  displayName: string;
  bio?: string;
  profileImage?: string;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Get current user session
  const { data: user, error } = useQuery<User | null>({
    queryKey: ["/api/auth/session"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "include",
        });
        if (response.status === 401) {
          return null;
        }
        return response.json();
      } catch (error) {
        return null;
      }
    },
    retry: false,
  });

  // Login mutation
  const { mutate: login, isPending: isLoginPending } = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/session"], data);
      setLocation("/");
      toast({
        title: "Welcome back!",
        description: `You are now logged in as ${data.displayName}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password.",
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const { mutate: register, isPending: isRegisterPending } = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/session"], data);
      setLocation("/");
      toast({
        title: "Registration successful!",
        description: `Welcome to PopCollect, ${data.displayName}!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create your account. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const { mutate: logout } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/session"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      setLocation("/login");
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: () => {
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update loading state when query completes
  useEffect(() => {
    if (user !== undefined || error) {
      setIsLoading(false);
    }
  }, [user, error]);

  return {
    user,
    isLoading,
    login,
    register,
    logout,
    isLoginPending,
    isRegisterPending,
  };
}

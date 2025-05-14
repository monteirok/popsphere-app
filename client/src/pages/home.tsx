import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Redirect to collection page by default
    setLocation("/collection");
  }, [setLocation]);
  
  return (
    <div className="flex items-center justify-center h-[calc(100vh-140px)]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pop-pink"></div>
    </div>
  );
}

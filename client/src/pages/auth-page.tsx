import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../auth-provider";
import Login from "./auth/login";
import Register from "./auth/register";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Redirect to home if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-pop-pink mb-2 font-nunito">PopCollect</h1>
            <p className="text-gray-500">Your PopMart Collectibles Community</p>
          </div>
          
          <div className="flex mb-8">
            <button 
              className={`flex-1 py-2 border-b-2 ${activeTab === 'login' ? 'border-pop-pink text-pop-pink font-medium' : 'border-gray-200 text-gray-500'}`}
              onClick={() => setActiveTab('login')}
            >
              Sign In
            </button>
            <button 
              className={`flex-1 py-2 border-b-2 ${activeTab === 'register' ? 'border-pop-pink text-pop-pink font-medium' : 'border-gray-200 text-gray-500'}`}
              onClick={() => setActiveTab('register')}
            >
              Register
            </button>
          </div>
          
          {activeTab === 'login' ? (
            <Login />
          ) : (
            <Register />
          )}
        </div>
      </div>
      
      {/* Right side - Hero */}
      <div className="hidden md:block md:w-1/2 bg-pop-pink text-white">
        <div className="h-full flex flex-col justify-center p-12">
          <h2 className="text-4xl font-bold mb-4">Join the PopMart Collectors Community</h2>
          <p className="text-lg mb-6">
            Showcase your collection, connect with other enthusiasts, and trade your rare finds.
          </p>
          <ul className="space-y-4">
            <li className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Track and showcase your collection
            </li>
            <li className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Connect with fellow collectors
            </li>
            <li className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Trade your duplicates for new treasures
            </li>
            <li className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Stay updated on new releases
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
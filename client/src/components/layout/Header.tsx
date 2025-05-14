import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Search, MessageSquare, User, X } from "lucide-react";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { getInitials } from "../../lib/utils";
import { Button } from "../ui/button";
import { useAuth } from "../../hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../../lib/queryClient";
import NotificationDropdown from "../notification/NotificationDropdown";

// Define the user interface for search results
interface SearchUser {
  id: number;
  username: string;
  displayName: string;
  profileImage?: string;
  bio?: string;
}

export default function Header() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Fetch search results when query changes
  const {
    data: searchResults = [],
    isLoading,
    error
  } = useQuery<SearchUser[]>({
    queryKey: [`/api/users/search?q=${searchQuery}`],
    enabled: searchQuery.length >= 2,
  });
  
  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value.length > 0) {
      setIsSearchFocused(true);
    }
  };
  
  const handleSearchClick = () => {
    setIsSearchFocused(true);
  };
  
  const clearSearch = () => {
    setSearchQuery("");
    setIsSearchFocused(false);
  };
  
  const handleUserClick = (userId: number, username: string) => {
    setLocation(`/profile/${username}`);
    setIsSearchFocused(false);
    setSearchQuery("");
  };
  
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold text-pop-pink font-nunito mr-2 cursor-pointer">PopCollect</h1>
          </Link>
          <span className="bg-pop-pink text-white text-xs px-2 py-1 rounded-full">BETA</span>
        </div>
        
        <div className="hidden md:flex flex-grow max-w-md mx-4" ref={searchRef}>
          <div className="relative w-full">
            <Input 
              type="text" 
              placeholder="Search users by name or username..." 
              className="w-full bg-gray-100 rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-pop-pink text-sm"
              value={searchQuery}
              onChange={handleSearchChange}
              onClick={handleSearchClick}
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            {searchQuery && (
              <button 
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
              </button>
            )}
            
            {/* Search Results Dropdown */}
            {isSearchFocused && searchQuery.length >= 2 && (
              <div className="absolute top-12 left-0 right-0 bg-white rounded-lg shadow-lg border z-50 max-h-80 overflow-y-auto">
                <div className="p-3 border-b">
                  <h3 className="text-sm font-semibold">
                    {isLoading ? 'Searching...' : `Search results for "${searchQuery}"`}
                  </h3>
                </div>
                
                {isLoading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-pop-pink mx-auto"></div>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <User className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No users found matching "{searchQuery}"</p>
                  </div>
                ) : (
                  <ul>
                    {searchResults.map((result) => (
                      <li 
                        key={result.id} 
                        className="p-3 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleUserClick(result.id, result.username)}
                      >
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10 mr-3">
                            <AvatarImage src={result.profileImage} alt={result.displayName} />
                            <AvatarFallback>{getInitials(result.displayName)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {result.displayName}
                              </p>
                              <span className="text-xs text-gray-500">@{result.username}</span>
                            </div>
                            {result.bio && (
                              <p className="text-xs text-gray-500 truncate">{result.bio}</p>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="default" className="hidden md:flex bg-pop-pink hover:bg-opacity-90 text-white rounded-full px-4 py-2 font-medium text-sm transition">
            Add Item
          </Button>
          <NotificationDropdown />
          <MessageSquare className="h-6 w-6 text-dark-grey cursor-pointer" />
          
          {user && (
            <Link href="/profile">
              <Avatar className="h-8 w-8 border-2 border-pop-pink cursor-pointer">
                <AvatarImage src={user.profileImage} alt={user.displayName} />
                <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
              </Avatar>
            </Link>
          )}
        </div>
      </div>
      
      <nav className="container mx-auto px-4 flex border-t">
        <NavLink href="/" active={location === '/'}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          Collection
        </NavLink>
        <NavLink href="/trades" active={location === '/trades'}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 16V4M7 4L3 8M7 4L11 8"></path>
            <path d="M17 8v12m0 0 4-4m-4 4-4-4"></path>
          </svg>
          Trades
        </NavLink>
        <NavLink href="/community" active={location === '/community'}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 8c0 4-8 11-8 11s-8-7-8-11a8 8 0 0 1 16 0Z"></path>
            <circle cx="9" cy="8" r="3"></circle>
          </svg>
          Community
        </NavLink>
        <NavLink href="/profile" active={location === '/profile'}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          Profile
        </NavLink>
      </nav>
    </header>
  );
}

interface NavLinkProps {
  href: string;
  active: boolean;
  children: React.ReactNode;
}

function NavLink({ href, active, children }: NavLinkProps) {
  return (
    <Link href={href}>
      <div className={`px-4 py-3 font-medium flex items-center cursor-pointer ${active ? 'tab-active text-pop-pink' : 'text-gray-600 hover:text-pop-pink'}`}>
        {children}
      </div>
    </Link>
  );
}

import { Link, useLocation } from "wouter";
import { Search, Bell, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function Header() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
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
        
        <div className="hidden md:flex flex-grow max-w-md mx-4">
          <div className="relative w-full">
            <Input 
              type="text" 
              placeholder="Search collections, users or items..." 
              className="w-full bg-gray-100 rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-pop-pink text-sm"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="default" className="hidden md:flex bg-pop-pink hover:bg-opacity-90 text-white rounded-full px-4 py-2 font-medium text-sm transition">
            Add Item
          </Button>
          <Bell className="h-6 w-6 text-dark-grey cursor-pointer" />
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
      <a className={`px-4 py-3 font-medium flex items-center ${active ? 'tab-active text-pop-pink' : 'text-gray-600 hover:text-pop-pink'}`}>
        {children}
      </a>
    </Link>
  );
}

import { Link, useLocation } from "wouter";
import { LayoutGrid, RefreshCw, PlusCircle, Users, User } from "lucide-react";

export default function MobileNavigation() {
  const [location] = useLocation();
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-gray-200 dark:border-gray-800 z-40">
      <div className="flex justify-around">
        <NavLink href="/collection" icon={<LayoutGrid className="text-xl" />} label="Collection" active={location === '/collection'} />
        <NavLink href="/trades" icon={<RefreshCw className="text-xl" />} label="Trades" active={location === '/trades'} />
        <NavLink href="/" icon={<PlusCircle className="text-2xl" />} label="Add" active={false} />
        <NavLink href="/community" icon={<Users className="text-xl" />} label="Community" active={location === '/community'} />
        <NavLink href="/profile" icon={<User className="text-xl" />} label="Profile" active={location === '/profile'} />
      </div>
    </nav>
  );
}

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

function NavLink({ href, icon, label, active }: NavLinkProps) {
  return (
    <Link href={href}>
      <div className={`flex flex-col items-center py-2 flex-1 cursor-pointer ${active ? 'text-pop-pink' : 'text-gray-500 dark:text-gray-400'}`}>
        {icon}
        <span className="text-xs mt-1">{label}</span>
      </div>
    </Link>
  );
}

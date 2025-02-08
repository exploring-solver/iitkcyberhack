import { Link, useLocation } from 'react-router-dom';
import { 
  Send, History, User, LayoutDashboard, 
  Settings, Trophy, Code, HelpCircle, Layers 
} from 'lucide-react';

export function Navbar() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-blue-600 text-white neon-border' : 'hover:bg-gray-800 text-gray-300';
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/', icon: Send, label: 'Send' },
    { path: '/transactions', icon: History, label: 'History' },
    { path: '/batch', icon: Layers, label: 'Batch' },
    { path: '/settings', icon: Settings, label: 'Settings' },
    { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { path: '/developers', icon: Code, label: 'Developers' },
    { path: '/faq', icon: HelpCircle, label: 'FAQ' },
    { path: '/auth', icon: User, label: 'Login' },
  ];

  return (
    <nav className="glass-panel sticky top-0 z-50 border-b border-gray-700/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-3">
            <Send className="w-8 h-8 text-blue-400" />
            <span className="text-xl font-bold text-white neon-text">Where's Gas?</span>
          </Link>
          
          <div className="flex space-x-1">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`${isActive(path)} px-3 py-2 rounded-lg text-sm font-medium 
                           transition-all duration-200 flex items-center space-x-2`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
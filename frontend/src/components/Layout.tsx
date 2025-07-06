import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  BellIcon, 
  UserIcon, 
  MagnifyingGlassIcon, 
  HomeIcon,
  Bars3Icon,
  XMarkIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Search Products', href: '/search', icon: MagnifyingGlassIcon },
  ];

  const closeMobileMenu = () => {
    setIsMenuClosing(true);
    setTimeout(() => {
      setIsMobileMenuOpen(false);
      setIsMenuClosing(false);
    }, 200);
  };

  // Close menu when route changes
  React.useEffect(() => {
    if (isMobileMenuOpen) {
      closeMobileMenu();
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-3 group">
                <div className="bg-gradient-to-br from-slate-900 to-slate-700 rounded-xl p-2 group-hover:shadow-lg transition-all">
                  <ChartBarIcon className="h-6 w-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Price Tracker
                  </h1>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/25'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all">
                <BellIcon className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Menu */}
              <div className="hidden md:flex items-center space-x-3 pl-4 border-l border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-lg">
                    <UserIcon className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-slate-900">
                      {user?.firstName || user?.email?.split('@')[0] || 'User'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {user?.email}
                    </div>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="inline-flex items-center px-3 py-1.5 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4 mr-1" />
                  Logout
                </button>
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => {
                  if (isMobileMenuOpen) {
                    closeMobileMenu();
                  } else {
                    setIsMobileMenuOpen(true);
                  }
                }}
                className="md:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all duration-200"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <>
              {/* Backdrop Overlay - covers entire screen */}
              <div
                className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-50 md:hidden transition-all duration-300 ${
                  isMenuClosing ? 'opacity-0' : 'opacity-100'
                }`}
                onClick={closeMobileMenu}
              />
              
              {/* Mobile Menu Panel - starts from very top */}
              <div className={`fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-2xl z-[60] md:hidden transition-all duration-300 ease-out ${
                isMenuClosing 
                  ? 'opacity-0 transform -translate-y-full' 
                  : 'opacity-100 transform translate-y-0'
              }`}>
                {/* Menu Header with close button */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200/50">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-700 rounded-xl p-2">
                      <ChartBarIcon className="h-5 w-5 text-white" />
                    </div>
                    <h1 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                      Price Tracker
                    </h1>
                  </div>
                  <button
                    onClick={closeMobileMenu}
                    className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Menu Content */}
                <div className="px-4 pt-6 pb-8 space-y-2 bg-slate-100">
                  {navigation.map((item, index) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={closeMobileMenu}
                        className={`flex items-center px-4 py-3 rounded-2xl text-base font-medium transition-all duration-200 transform hover:scale-[0.98] ${
                          isActive
                            ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/25'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                        style={{
                          animationDelay: `${(index + 1) * 100}ms`,
                          animation: !isMenuClosing ? 'slideInLeft 0.4s ease-out forwards' : 'none',
                          opacity: 0
                        }}
                      >
                        <item.icon className="h-5 w-5 mr-3" />
                        {item.name}
                      </Link>
                    );
                  })}
                  
                  {/* Mobile User Section */}
                  <div className="pt-6 border-t  border-slate-200/50 mt-6">
                    <div 
                      className="flex items-center px-4 py-3 rounded-2xl  mb-3"
                      style={{
                        animationDelay: '400ms',
                        animation: !isMenuClosing ? 'slideInLeft 0.4s ease-out forwards' : 'none',
                        opacity: 0
                      }}
                    >
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-lg">
                        <UserIcon className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <div className="text-base font-semibold text-slate-900">
                          {user?.firstName || user?.email?.split('@')[0] || 'User'}
                        </div>
                        <div className="text-sm text-slate-500">
                          {user?.email}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        closeMobileMenu();
                      }}
                      className="flex items-center w-full px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-2xl transition-all duration-200 transform hover:scale-[0.98]"
                      style={{
                        animationDelay: '500ms',
                        animation: !isMenuClosing ? 'slideInLeft 0.4s ease-out forwards' : 'none',
                        opacity: 0
                      }}
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* Main content */}
      <main>
        {children}
      </main>
    </div>
  );
};

export default Layout;

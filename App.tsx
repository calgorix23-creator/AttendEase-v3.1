
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, AppData, ClassSession, AttendanceRecord, ActivityLog } from './types';
import { api } from './services/api';
import { Button, Input, Card, Badge, Modal } from './components/Shared';

// Page Views
import LoginPage from './components/LoginPage';
import AdminDashboard from './components/AdminDashboard';
import TrainerDashboard from './components/TrainerDashboard';
import TraineeDashboard from './components/TraineeDashboard';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [data, setData] = useState<AppData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'schedule' | 'users' | 'wallet' | 'profile' | 'logs'>('dashboard');

  const refreshData = useCallback(async () => {
    try {
      const appData = await api.getData();
      setData(appData);
      
      if (currentUser) {
        const updatedUser = appData.users.find(u => u.id === currentUser.id);
        if (updatedUser) {
          // Deep compare or simple update to ensure profileImage is fresh
          setCurrentUser(prev => prev?.id === updatedUser.id ? updatedUser : prev);
        }
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const updateGlobalData = async (newData: AppData) => {
    const updated = await api.updateData(newData);
    setData(updated);
    if (currentUser) {
      const updatedMe = updated.users.find(u => u.id === currentUser.id);
      if (updatedMe) setCurrentUser(updatedMe);
    }
  };

  if (isLoading) {
    return (
      <div className="mobile-container flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="mobile-container flex flex-col h-screen">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
            A
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-gray-900 leading-tight">AttendEase</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{currentUser.role}</p>
          </div>
        </div>
        <button 
          onClick={() => setActiveTab('profile')}
          className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 overflow-hidden active:scale-95 transition-transform"
        >
          <img 
            src={currentUser.profileImage || `https://picsum.photos/seed/${currentUser.id}/100/100`} 
            alt="Avatar" 
            className="w-full h-full object-cover" 
          />
        </button>
      </header>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 px-4 pt-4">
        {currentUser.role === UserRole.ADMIN && (
          <AdminDashboard 
            data={data!} 
            currentUser={currentUser} 
            activeTab={activeTab} 
            onUpdateData={updateGlobalData}
            setActiveTab={setActiveTab}
          />
        )}
        {currentUser.role === UserRole.TRAINER && (
          <TrainerDashboard 
            data={data!} 
            currentUser={currentUser} 
            activeTab={activeTab} 
            onUpdateData={updateGlobalData}
            setActiveTab={setActiveTab}
          />
        )}
        {currentUser.role === UserRole.TRAINEE && (
          <TraineeDashboard 
            data={data!} 
            currentUser={currentUser} 
            activeTab={activeTab} 
            onUpdateData={updateGlobalData}
            setActiveTab={setActiveTab}
          />
        )}
      </main>

      {/* Navigation Footer */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 px-6 py-4 flex justify-between items-center max-w-[448px] mx-auto z-50">
        <NavButton 
          active={activeTab === 'dashboard'} 
          onClick={() => setActiveTab('dashboard')} 
          label="Home"
          icon={<path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />} 
        />
        {currentUser.role === UserRole.TRAINEE ? (
           <NavButton 
            active={activeTab === 'wallet'} 
            onClick={() => setActiveTab('wallet')} 
            label="Wallet"
            icon={<path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />} 
          />
        ) : (
          <NavButton 
            active={activeTab === 'schedule'} 
            onClick={() => setActiveTab('schedule')} 
            label="Classes"
            icon={<path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />} 
          />
        )}
        {currentUser.role === UserRole.ADMIN && (
          <NavButton 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')} 
            label="Users"
            icon={<path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />} 
          />
        )}
        {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.TRAINEE) && (
          <NavButton 
            active={activeTab === 'logs'} 
            onClick={() => setActiveTab('logs')} 
            label="Activity"
            icon={<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />} 
          />
        )}
        <NavButton 
          active={activeTab === 'profile'} 
          onClick={() => setActiveTab('profile')} 
          label="Profile"
          icon={<path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />} 
        />
      </nav>

      {/* Logout Prompt at bottom of Profile Tab */}
      {activeTab === 'profile' && (
        <div className="absolute bottom-24 left-0 right-0 px-4">
          <Button variant="danger" onClick={handleLogout}>Log Out</Button>
        </div>
      )}
    </div>
  );
};

const NavButton: React.FC<{ active: boolean, onClick: () => void, label: string, icon: React.ReactNode }> = ({ active, onClick, label, icon }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-blue-600' : 'text-gray-400'}`}>
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {icon}
    </svg>
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
  </button>
);

export default App;

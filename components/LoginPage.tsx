
import React, { useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { Button, Input, Card, Badge } from './Shared';

interface Props {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<Props> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetData, setResetData] = useState({ email: '', phone: '' });
  const [resetSuccess, setResetSuccess] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const user = await api.login(email, password);
    if (user) {
      onLogin(user);
    } else {
      setError('Invalid email or password.');
    }
  };

  const handleDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await api.resetPassword(resetData.email, resetData.phone);
    if (success) {
      setResetSuccess('Check your email/phone for recovery instructions.');
      setTimeout(() => setIsResetting(false), 3000);
    } else {
      setError('Credentials do not match our records.');
    }
  };

  return (
    <div className="mobile-container flex items-center justify-center p-8 bg-gradient-to-b from-white to-blue-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-purple-600 items-center justify-center text-white shadow-2xl shadow-blue-200 mb-6">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">AttendEase</h1>
          <p className="text-gray-500 font-medium text-sm">Streamlined Booking & Attendance</p>
        </div>

        {!isResetting ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <Input 
              label="Email Address" 
              type="email" 
              placeholder="name@example.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required
            />
            <div className="space-y-1">
              <Input 
                label="Password" 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required
              />
              <button 
                type="button" 
                onClick={() => setIsResetting(true)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors ml-1"
              >
                Forgot Password?
              </button>
            </div>
            {error && <p className="text-sm text-red-500 font-medium text-center bg-red-50 py-2 rounded-lg">{error}</p>}
            <Button type="submit">Sign In</Button>
            
            <div className="pt-6 text-center border-t border-gray-100">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-4">Click to autofill Demo Accounts</p>
              <div className="flex flex-wrap justify-center gap-2">
                <button type="button" onClick={() => handleDemoLogin('admin@test.com')}><Badge variant="red">ADMIN</Badge></button>
                <button type="button" onClick={() => handleDemoLogin('trainer@test.com')}><Badge variant="purple">TRAINER</Badge></button>
                <button type="button" onClick={() => handleDemoLogin('trainee@test.com')}><Badge variant="blue">TRAINEE</Badge></button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-6">
            <Input 
              label="Recovery Email" 
              type="email" 
              placeholder="Enter your email" 
              value={resetData.email} 
              onChange={e => setResetData({...resetData, email: e.target.value})} 
              required
            />
            <Input 
              label="Phone Number" 
              type="tel" 
              placeholder="+65...." 
              value={resetData.phone} 
              onChange={e => setResetData({...resetData, phone: e.target.value})} 
              required
            />
            {error && <p className="text-sm text-red-500 font-medium text-center">{error}</p>}
            {resetSuccess && <p className="text-sm text-green-600 font-medium text-center">{resetSuccess}</p>}
            <Button type="submit">Recover Account</Button>
            <Button variant="ghost" onClick={() => setIsResetting(false)}>Back to Login</Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;

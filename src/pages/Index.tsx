import { useState } from 'react';
import LoginPage from '@/components/LoginPage';
import AppLayout from '@/components/AppLayout';
import { UserRole } from '@/types';

const Index = () => {
  const [authed, setAuthed] = useState(() => localStorage.getItem('auth') === 'true');
  const [role, setRole] = useState<UserRole>(() => (localStorage.getItem('authRole') as UserRole) || 'admin');

  const handleLogin = (userRole: UserRole) => {
    setAuthed(true);
    setRole(userRole);
  };

  if (!authed) return <LoginPage onLogin={handleLogin} />;
  return <AppLayout onLogout={() => setAuthed(false)} role={role} />;
};

export default Index;

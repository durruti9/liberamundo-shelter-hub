import { useState } from 'react';
import LoginPage from '@/components/LoginPage';
import AppLayout from '@/components/AppLayout';

const Index = () => {
  const [authed, setAuthed] = useState(() => localStorage.getItem('auth') === 'true');

  if (!authed) return <LoginPage onLogin={() => setAuthed(true)} />;
  return <AppLayout onLogout={() => setAuthed(false)} />;
};

export default Index;

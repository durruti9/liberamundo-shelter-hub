import { useState } from 'react';
import LoginPage from '@/components/LoginPage';
import AppLayout from '@/components/AppLayout';
import { UserRole } from '@/types';
import { I18nProvider } from '@/i18n/I18nContext';

const Index = () => {
  const [authed, setAuthed] = useState(() => localStorage.getItem('auth') === 'true');
  const [role, setRole] = useState<UserRole>(() => (localStorage.getItem('authRole') as UserRole) || 'admin');

  const handleLogin = (userRole: UserRole) => {
    setAuthed(true);
    setRole(userRole);
  };

  return (
    <I18nProvider>
      {!authed
        ? <LoginPage onLogin={handleLogin} />
        : <AppLayout onLogout={() => setAuthed(false)} role={role} />
      }
    </I18nProvider>
  );
};

export default Index;

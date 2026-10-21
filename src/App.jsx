import './css/index.css'
import { useEffect } from 'react';
import User from './pages/User';
import Admin from './pages/Admin';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';

// Routing sederhana berbasis pathname (tanpa dependency tambahan)
const getPage = () => {
  const path = window.location.pathname.replace(/\/+$/, '');
  if (path === '/admin') return <Admin />;
  return <User />;
};

// App Content Component
function AppContent() {
  const { loading, user, logout } = useAuth();
  const { t } = useSettings();

  const path = window.location.pathname.replace(/\/+$/, '');
  const isAdminArea = path === '/admin';
  const adminOnUserPage = !loading && !isAdminArea && user?.role === 'admin';

  // Halaman pelanggan khusus pelanggan: admin yang membuka / otomatis di-logout.
  useEffect(() => {
    if (adminOnUserPage) {
      logout();
      window.location.replace('/admin');
    }
  }, [adminOnUserPage, logout]);

  if (loading || adminOnUserPage) {
    return (
      <div className="min-h-[100dvh] bg-page flex items-center justify-center">
        <div className="text-fg text-xl">{t("common.loading")}</div>
      </div>
    );
  }

  return getPage();
}

// Main App Component
function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;
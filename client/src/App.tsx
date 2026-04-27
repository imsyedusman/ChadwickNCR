import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import NcrListPage from './pages/NcrListPage';
import NcrDetailPage from './pages/NcrDetailPage';
import NcrFormPage from './pages/NcrFormPage';
import CapaPage from './pages/CapaPage';
import AuditTrailPage from './pages/AuditTrailPage';
import SettingsPage from './pages/SettingsPage';
import UserManagementPage from './pages/UserManagementPage';
import UserProfilePage from './pages/UserProfilePage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import { useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, roles }: { children: React.ReactNode, roles?: string[] }) => {
  const { token, user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!token) return <Navigate to="/login" />;
  
  if (user?.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" />;
  }

  if (user && !user.mustChangePassword && location.pathname === '/change-password') {
    return <Navigate to="/" />;
  }

  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" />;

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/change-password" element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          } />
          <Route path="/" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
          <Route path="/ncrs" element={<ProtectedRoute><Layout><NcrListPage /></Layout></ProtectedRoute>} />
          <Route path="/ncrs/new" element={<ProtectedRoute roles={['ADMIN', 'QA_MANAGER', 'HANDLER']}><Layout><NcrFormPage /></Layout></ProtectedRoute>} />
          <Route path="/ncrs/:id" element={<ProtectedRoute><Layout><NcrDetailPage /></Layout></ProtectedRoute>} />
          <Route path="/ncrs/:id/edit" element={<ProtectedRoute roles={['ADMIN', 'QA_MANAGER', 'HANDLER']}><Layout><NcrFormPage /></Layout></ProtectedRoute>} />
          <Route path="/capa" element={<ProtectedRoute><Layout><CapaPage /></Layout></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Layout><AuditTrailPage /></Layout></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN']}><Layout><UserManagementPage /></Layout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Layout><UserProfilePage /></Layout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Layout><SettingsPage /></Layout></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

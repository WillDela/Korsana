import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UnitsProvider } from './context/UnitsContext';
import { setApiNavigator } from './api/client';
import AppLayout from './components/AppLayout';
import { FullPageSkeleton } from './components/PageSkeleton';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CreateGoal from './pages/CreateGoal';
import Goals from './pages/Goals';
import EditGoal from './pages/EditGoal';
import Onboarding from './pages/Onboarding';
import Coach from './pages/Coach';
import Calendar from './pages/Calendar';
import Settings from './pages/Settings';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import AuthCallback from './pages/AuthCallback';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { user, isOnboarded, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageSkeleton />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isOnboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
};

const RouterNavigator = () => {
  const navigate = useNavigate();
  useEffect(() => {
    setApiNavigator(navigate);
    return () => setApiNavigator(null);
  }, [navigate]);
  return null;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

      {/* Authenticated routes with shared AppLayout (navbar + content area) */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/coach" element={<Coach />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/goals/new" element={<CreateGoal />} />
        <Route path="/goals/:id/edit" element={<EditGoal />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <UnitsProvider>
          <RouterNavigator />
          <AppRoutes />
        </UnitsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

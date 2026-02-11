import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/AppLayout';
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
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
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
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import PageTransition from './components/PageTransition';
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

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Animated Routes wrapper
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/signup" element={<PageTransition><Signup /></PageTransition>} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <PageTransition><Onboarding /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <PageTransition><Dashboard /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <PageTransition><Calendar /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/goals"
          element={
            <ProtectedRoute>
              <PageTransition><Goals /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/goals/new"
          element={
            <ProtectedRoute>
              <PageTransition><CreateGoal /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/goals/:id/edit"
          element={
            <ProtectedRoute>
              <PageTransition><EditGoal /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/coach"
          element={
            <ProtectedRoute>
              <PageTransition><Coach /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <PageTransition><Settings /></PageTransition>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AnimatedRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;

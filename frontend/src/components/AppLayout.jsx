import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';

const AppLayout = () => {
  const { pathname } = useLocation();
  const isCoach = pathname === '/coach';
  const isDashboard = pathname === '/dashboard';

  return (
    <div className="min-h-screen bg-bg-app">
      <Navbar variant="app" />
      <main className={isDashboard ? '' : `max-w-[1280px] mx-auto ${isCoach ? 'px-2 sm:px-3 py-4' : 'px-4 sm:px-6 py-6'}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;

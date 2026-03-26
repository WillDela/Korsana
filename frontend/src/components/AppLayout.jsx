import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';

const AppLayout = () => {
  const { pathname } = useLocation();
  const isCoach = pathname === '/coach';

  return (
    <div className="min-h-screen bg-bg-app">
      <Navbar variant="app" />
      <div style={{ padding: isCoach ? '0 12px' : '0 24px' }}>
        <main className="w-full mx-auto" style={{ maxWidth: 1280, padding: isCoach ? '16px 0' : '24px 0' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

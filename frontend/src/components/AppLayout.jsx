import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';

const AppLayout = () => {
  const { pathname } = useLocation();
  const isCoach = pathname === '/coach';

  return (
    <div className="min-h-screen bg-bg-app">
      <Navbar variant="app" />
      <div className={`max-w-screen-xl mx-auto ${isCoach ? 'px-3 sm:px-4' : 'px-4 sm:px-6 lg:px-8'}`}>
        <main className={`w-full ${isCoach ? 'pt-4 pb-8' : 'pt-6 pb-16'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

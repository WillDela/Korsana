import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-bg-app">
      <Navbar variant="app" />
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;

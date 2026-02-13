import React, { useEffect, useState } from 'react';

import { Outlet } from 'react-router-dom';

import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="lg:ml-64 min-h-screen">
        <Header onMenuToggle={() => setIsSidebarOpen((prev) => !prev)} />
        <main className="p-4 sm:p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}

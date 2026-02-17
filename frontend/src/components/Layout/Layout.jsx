import React, { useEffect, useState } from 'react';

import { Outlet } from 'react-router-dom';

import Footer from './Footer';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMenuEnabled, setIsMenuEnabled] = useState(true);

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
      {isMenuEnabled && (
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onMenuVisibilityToggle={() => {
            setIsMenuEnabled(false);
            setIsSidebarOpen(false);
          }}
        />
      )}

      <div className={`${isMenuEnabled ? 'lg:ml-64' : ''} min-h-screen`}>
        <Header
          onMenuToggle={() => setIsSidebarOpen((prev) => !prev)}
          isMenuEnabled={isMenuEnabled}
          onMenuVisibilityToggle={() => {
            setIsMenuEnabled((prev) => {
              const next = !prev;
              if (!next) {
                setIsSidebarOpen(false);
              }
              return next;
            });
          }}
        />
        <main className="p-4 sm:p-6">
          {children || <Outlet />}
        </main>
        <Footer />
      </div>
    </div>
  );
}

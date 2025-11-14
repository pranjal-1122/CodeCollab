import React from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import DashboardMain from '../components/dashboard/DashboardMain'; // <-- 1. IMPORT IT

const DashboardPage = () => {
  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* The Sidebar (no change) */}
      <Sidebar />

      {/* The Main Content Area */}
      <div className="flex-1 p-10 overflow-auto">
        {/* 2. ADD THE MAIN COMPONENT HERE */}
        <DashboardMain />
      </div>
    </div>
  );
};

export default DashboardPage;
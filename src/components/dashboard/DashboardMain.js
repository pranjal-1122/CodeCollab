import React, { useState } from 'react';
import QuickActions from './QuickActions';

// Import our new tab content components
import TabMyRooms from './TabMyRooms';
import TabCreateRoom from './TabCreateRoom';
import TabJoinRoom from './TabJoinRoom';
import TabChallengeLibrary from './TabChallengeLibrary';

const TABS = {
  MY_ROOMS: 'My Rooms',
  CREATE_ROOM: 'Create New Room',
  JOIN_ROOM: 'Join Room',
  CHALLENGE_LIBRARY: 'Challenge Library',
};

const DashboardMain = () => {
  const [activeTab, setActiveTab] = useState(TABS.MY_ROOMS);

  // Helper function to render the correct tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case TABS.MY_ROOMS:
        return <TabMyRooms />;
      case TABS.CREATE_ROOM:
        return <TabCreateRoom />;
      case TABS.JOIN_ROOM:
        return <TabJoinRoom />;
      case TABS.CHALLENGE_LIBRARY:
        return <TabChallengeLibrary />;
      default:
        return <TabMyRooms />;
    }
  };

  // Helper component for styling tabs
  const TabButton = ({ title }) => {
    const isActive = activeTab === title;
    return (
      <button
        onClick={() => setActiveTab(title)}
        className={`px-6 py-3 font-semibold rounded-t-lg transition-colors
          ${isActive
            ? 'bg-gray-800 text-white'
            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
      >
        {title}
      </button>
    );
  };

  return (
    <div className="w-full">
      {/* 1. Quick Actions Section */}
      <QuickActions />

      {/* 2. Four Tabs Section */}
      <div>
        {/* Tab Buttons */}
        <div className="flex gap-2 border-b border-gray-700">
          <TabButton title={TABS.MY_ROOMS} />
          <TabButton title={TABS.CREATE_ROOM} />
          <TabButton title={TABS.JOIN_ROOM} />
          <TabButton title={TABS.CHALLENGE_LIBRARY} />
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default DashboardMain;
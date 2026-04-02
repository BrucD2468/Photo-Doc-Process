import React, { useState } from 'react';

const Sidebar = React.forwardRef(({ setAdminPanelTab, setPage, closeSidebar, isSidebarOpen }, ref) => {
  const [showAdminSubmenu, setShowAdminSubmenu] = useState(false);

  const handleAdminHomeClick = () => {
    setPage('admin') // Navigate to admin page first
    setAdminPanelTab('info');
    closeSidebar();
  };

  const handleAdminUsersClick = () => {
    setPage('admin') // Navigate to admin page first
    setAdminPanelTab('users');
    closeSidebar();
  };

  const handleAppPageClick = () => {
    setPage('myInfo'); // Assuming 'myInfo' is the user panel/app page
    closeSidebar();
  };

  return (
    <div ref={ref} className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
      <nav>
        {/* Always visible for navigation */}        
        {/* Admin section, visible only if user is admin */}
        <div className="sidebar-item" onClick={() => setShowAdminSubmenu(!showAdminSubmenu)}>
          Admin
          <svg className={`submenu-arrow ${showAdminSubmenu ? 'open' : ''}`} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        {showAdminSubmenu && (
          <div className="sidebar-submenu">
            <div className="sidebar-subitem" onClick={handleAdminHomeClick}>Home</div>
            <div className="sidebar-subitem" onClick={handleAdminUsersClick}>User</div>
          </div>
        )}
        <div className="sidebar-item" onClick={handleAppPageClick}>App</div>
      </nav>
    </div>
  );
});

export default Sidebar;

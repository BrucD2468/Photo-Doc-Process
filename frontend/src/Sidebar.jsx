import React, { useState } from 'react';

const Sidebar = React.forwardRef(({ setAdminPanelTab, setPage, closeSidebar, isSidebarOpen }, ref) => {
  const [showAdminSubmenu, setShowAdminSubmenu] = useState(false);

  const handleAdminHomeClick = () => {
    setAdminPanelTab('info');
    closeSidebar();
  };

  const handleAdminUsersClick = () => {
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
        <div className="sidebar-item" onClick={() => setShowAdminSubmenu(!showAdminSubmenu)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span className="sidebar-item-label">Admin</span>
          <svg className={`submenu-arrow ${showAdminSubmenu ? 'open' : ''}`} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        {showAdminSubmenu && (
          <div className="sidebar-submenu">
            <div className="sidebar-subitem" onClick={handleAdminHomeClick}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-home"><path d="M12 2L3 9v9h5v-6h8v6h5V9l-9-7z"/></svg>
              <span className="sidebar-item-label">Home</span>
            </div>
            <div className="sidebar-subitem" onClick={handleAdminUsersClick}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users"><path d="M17 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87C20.55 14.1 21 12.65 21 11c0-2.76-2.24-5-5-5s-5 2.24-5 5c0 1.65.45 3.1 1 4.13-1 .18-2 .35-3 .52"/></svg>
              <span className="sidebar-item-label">Users</span>
            </div>
          </div>
        )}
        <div className="sidebar-item" onClick={handleAppPageClick}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-dashboard"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
          <span className="sidebar-item-label">App</span>
        </div>
      </nav>
    </div>
  );
});

export default Sidebar;

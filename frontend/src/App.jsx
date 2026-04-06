import React, { useState, useEffect, useRef } from 'react'
import { Box, Button, IconButton, Tooltip } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import Login from './Login'
import Register from './Register'
import BarcodeScanPage from './BarcodeScanPage'
import MediaCapture from './ImageCapture'
import MyInfo from './MyInfo'
import AdminPanel from './AdminPanel'
import BarcodeSearch from './BarcodeSearch' // New import
import PalletPage from './PalletPage'
import ImageGalleryPage from './ImageGalleryPage'
import ShippingPage from './ShippingPage'
import ShippedShipmentsPage from './ShippedShipmentsPage'
import PalletFilteringPage from './PalletFilteringPage'
import Sidebar from './Sidebar' // Import Sidebar

import './App.css'

const API_URL = import.meta.env.VITE_API_URL || ""

function App() {
  const [user, setUser] = useState(null)
  const [page, _setPage] = useState('login') // Internal state for current page
  const [pageHistory, setPageHistory] = useState(['login']) // History stack for navigation
  const [showDropdown, setShowDropdown] = useState(false)
  const userMenuRef = useRef(null)
  const userIconButtonRef = useRef(null)

  // Sidebar state and refs
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const sidebarRef = useRef(null)
  const hamburgerButtonRef = useRef(null)
  const [adminPanelTab, setAdminPanelTab] = useState('info')

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev)
  }

  const handleSetAdminPanelTab = (tab) => {
    setAdminPanelTab(tab)
    _setPage('admin') // Navigate to admin page when setting an admin tab
    setIsSidebarOpen(false) // Close sidebar after selection
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isSidebarOpen &&
          sidebarRef.current &&
          !sidebarRef.current.contains(event.target) &&
          hamburgerButtonRef.current &&
          !hamburgerButtonRef.current.contains(event.target)) {
        setIsSidebarOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSidebarOpen])

  // Custom navigation function that manages history
  const setPage = (newPage, options = { replace: false }) => {
    if (options.replace) {
      // Replace the current history entry (e.g., after login or initial load)
      setPageHistory(prevHistory => [...prevHistory.slice(0, prevHistory.length - 1), newPage])
    } else {
      // Push new page to history, avoiding duplicates if already at the top
      setPageHistory(prevHistory => {
        if (prevHistory[prevHistory.length - 1] === newPage) {
          return prevHistory
        }
        return [...prevHistory, newPage]
      })
    }
    _setPage(newPage) // Update the displayed page
  }

  const goBack = () => {
    setPageHistory(prevHistory => {
      if (prevHistory.length > 1) {
        const newHistory = prevHistory.slice(0, prevHistory.length - 1)
        _setPage(newHistory[newHistory.length - 1]) // Go to the previous page
        return newHistory
      }
      return prevHistory // Cannot go back further
    })
  }
  const [palletRecords, setPalletRecords] = useState([]) // New state for records on PalletPage
  const [selectedBarcodeRecord, setSelectedBarcodeRecord] = useState(null) // New state for ImageGalleryPage
  const [captureBarcodeForGallery, setCaptureBarcodeForGallery] = useState(null) // New state for MediaCapture from gallery
  const [showCaptureModalForGallery, setShowCaptureModalForGallery] = useState(false)
  const [shippingLists, setShippingLists] = useState([]) // New state for shipping lists
  const [selectedShippingList, setSelectedShippingList] = useState(null) // New state for selected shipping list
  const [filteredShippingLists, setFilteredShippingLists] = useState([]) // State for filtered shipping lists on ShippedShipmentsPage
  const [customerSearchTerm, setCustomerSearchTerm] = useState('') // New state for customer search term on main page
  const [enableCustomerFilter, setEnableCustomerFilter] = useState(false); // New state for enabling customer filter
  const [currentFilteredPalletRecords, setCurrentFilteredPalletRecords] = useState([]) // State for records on PalletFilteringPage
  const [selectedFilteredShippingList, setSelectedFilteredShippingList] = useState(null) // State for selected filtered shipping list


  const mediaCaptureHeaderTitle = captureBarcodeForGallery ? 
    `${String(captureBarcodeForGallery).includes('-') ? 'Roll' : 'Pallet'} Barcode: ${captureBarcodeForGallery}` : ''

  const toggleDropdown = () => {
    setShowDropdown(prev => !prev)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown &&
          userMenuRef.current &&
          !userMenuRef.current.contains(event.target) &&
          userIconButtonRef.current &&
          !userIconButtonRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])
  // Effect to load initial user state from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        // Set the page based on user role after re-login
        _setPage(userData.role === 1 ? 'admin' : 'myInfo');
        setPageHistory([userData.role === 1 ? 'admin' : 'myInfo']);
      } catch (error) {
        console.error("Failed to parse user data from localStorage", error);
        localStorage.removeItem('user'); // Clear corrupted data
      }
    }
  }, []); // Empty dependency array means this effect runs once on mount

  useEffect(() => {
    if (page === 'myInfo' && user) {
      const fetchShippingLists = async () => {
            try {
              const params = new URLSearchParams();
              if (enableCustomerFilter && customerSearchTerm) params.append('customer_name', customerSearchTerm);

          const response = await fetch(`${API_URL}/api/shipping-lists?${params.toString()}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setShippingLists(data.shipping_lists);
        } catch (error) {
          console.error("Error fetching shipping lists:", error);
          // Optionally, show an alert to the user
        }
      };
      fetchShippingLists();
    }
  }, [page, user, API_URL, customerSearchTerm, enableCustomerFilter]);


  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
    setPageHistory([userData.role === 1 ? 'admin' : 'myInfo']) // Reset history and set current page
    _setPage(userData.role === 1 ? 'admin' : 'myInfo') // Directly update the page
  }

  const handleLogout = () => {
    setUser(null)
    setPageHistory(['login']) // Reset history to just login page
    _setPage('login') // Directly update the page
    localStorage.removeItem('user')
    setPalletRecords([]) // Clear pallet records on logout
    setSelectedBarcodeRecord(null) // Clear selected barcode record on logout
    setCaptureBarcodeForGallery(null) // Clear capture barcode state
    setShowCaptureModalForGallery(false) // Hide capture modal
  }

  // New navigation functions
  const navigateToPalletPage = (records) => {
    setPalletRecords(records)
    setPage('palletPage')
  }

  const handleBarcodeSearchAndNavigate = async (barcode) => {
    if (!barcode) return
    try {
      const response = await fetch(`${API_URL}/api/barcode/search?barcode=${barcode}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (data.records && data.records.length > 0) {
        navigateToPalletPage(data.records)
      } else {
        alert('No records found for this barcode.')
      }
    } catch (error) {
      console.error('Error searching barcode:', error)
      alert('Error searching barcode: ' + error.message)
    }
  }

  const navigateToImageGalleryPage = (record) => {
    setSelectedBarcodeRecord(record)
    setPage('imageGalleryPage')
  }

  const handleBackToPalletPage = () => {
    setSelectedBarcodeRecord(null)
    goBack()
  }

  const navigateToShippingPage = (list) => {
    setSelectedShippingList(list);
    setPage('shippingPage');
  }

  const navigateToShippedShipmentsPage = () => {
    setPage('shippedShipmentsPage');
  };

  const navigateToPalletFilteringPage = (records, list) => {
    setCurrentFilteredPalletRecords(records);
    setSelectedFilteredShippingList(list);
    setPage('palletFilteringPage');
  };

  const handleBackFromShippedShipmentsPage = () => {
    goBack();
    setFilteredShippingLists([]); // Clear filtered lists when going back
  };

  const handleBackFromPalletFilteringPage = () => {
    goBack();
    setCurrentFilteredPalletRecords([]); // Clear records when going back
    setSelectedFilteredShippingList(null); // Clear selected list when going back
  };

  const handleBackToImageGallery = () => {
    setCaptureBarcodeForGallery(null)
    setShowCaptureModalForGallery(false)
    // No need to change page, it's a modal over the gallery
  }

  // Function to handle image capture from ImageGalleryPage
  const handleImageCapturedForGallery = async (newImage) => {
    if (!captureBarcodeForGallery || !user.email) return

    try {
      const response = await fetch(`${API_URL}/api/barcode/add-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            barcode: captureBarcodeForGallery,
            email: user.email,
            images: [newImage.url],
            full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
            department: user.department || null,
            customer_name: null, // Assuming not available in this context, or needs to be passed
            expected_ship_date: null, // Assuming not available in this context, or needs to be passed
            bol_number: null, // Assuming not available in this context, or needs to be passed
          }),
      })
      const data = await response.json()
      if (data.success) {
        // Refresh the selected barcode record to show new image
        // This requires re-fetching all info and then finding the updated record
        // For simplicity, we can just update the images array directly for now
        // A more robust solution would be to re-fetch the single record.
        setSelectedBarcodeRecord(prev => ({
          ...prev,
          images: data.images // Use the updated images array from the backend
        }))
      } else {
        throw new Error(data.detail || 'Failed to add image')
      }
    } catch (error) {
      alert('Error adding image: ' + error.message)
    }
  }

  const handleDeleteImageForGallery = async (barcode, index) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        const response = await fetch(`${API_URL}/api/barcode/delete-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            barcode: barcode,
            email: user.email,
            index: index,
          }),
        })
        const data = await response.json()
        if (data.success) {
          // Update the selected barcode record by removing the image
          setSelectedBarcodeRecord(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
          }))
        } else {
          throw new Error(data.detail || 'Failed to delete image')
        }
      } catch (error) {
        alert('Error deleting image: ' + error.message)
      }
    }
  }

  // --- Page Render Logic ---




  return (
    <div className="app">
      {user && user.role === 1 && ( // Render sidebar only if user is logged in AND is an admin
        <Sidebar
          ref={sidebarRef}
          isSidebarOpen={isSidebarOpen}
          closeSidebar={toggleSidebar}
          setAdminPanelTab={handleSetAdminPanelTab} // Pass the new handler
          setPage={_setPage} // Pass the internal _setPage to directly change the page
        />
      )}


      {/* Media Capture Modal - always rendered at the top level to overlay any page */}
      {showCaptureModalForGallery && captureBarcodeForGallery && (
        <div className="media-capture-modal-overlay">
          <MediaCapture
            barcode={captureBarcodeForGallery}
            onCapture={handleImageCapturedForGallery}
            onClose={handleBackToImageGallery}
            API_URL={API_URL}
            user={user}
            headerTitle={mediaCaptureHeaderTitle}
            images={selectedBarcodeRecord?.images || []}
            onDelete={(index) => { /* Placeholder for future implementation if needed */ }}
            onClear={() => { /* Placeholder for future implementation if needed */ }}
            allowSave={false}
            toggleSidebar={toggleSidebar}
            hamburgerButtonRef={hamburgerButtonRef}
          />
        </div>
      )}

      {/* Login and Register pages are rendered unconditionally if 'page' matches */}
      {page === 'login' && <Login onLogin={handleLogin} onSwitchToRegister={() => setPage('register', { replace: true })} />}
      {page === 'register' && <Register onSwitchToLogin={() => setPage('login', { replace: true })} />}

      {/* Main application content is rendered conditionally only if not on login/register pages */}
      {page !== 'login' && page !== 'register' && (
        <div className="main-content">
          {page === 'myInfo' && (
            <>
              <div className="header" width="100%">
                {user && user.role === 1 && ( // Only show hamburger button if user is logged in AND is an admin
                  <Tooltip title="Menu">
                    <IconButton ref={hamburgerButtonRef} onClick={toggleSidebar} color="inherit" sx={{ border: 'none', background: 'none', cursor: 'pointer', p: 1, '&:hover': { background: 'rgba(255,255,255,0.1)' } }}>
                      <MenuIcon />
                    </IconButton>
                  </Tooltip>
                )}
                <div className="header-title-group">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shopping-cart-star">
                    <path d="M3 3h2l2.5 10h10l2-7H6.5" />
                    <path d="M6 6l3-3" />
                    <circle cx="10" cy="20" r="1" />
                    <circle cx="18" cy="20" r="1" />
                    <path d="M15 8l.5 1.5L17 10l-1.5.5L15 12l-.5-1.5L13 10l1.5-.5L15 8z" />
                  </svg>
                  <span>Shipping Photo App</span>
                </div>
                <UserMenuComponent
                  ref={userMenuRef}
                  userIconButtonRef={userIconButtonRef}
                  user={user}
                  toggleDropdown={toggleDropdown}
                  showDropdown={showDropdown}
                  handleLogout={handleLogout}
                  setPage={setPage}
                  currentPage={page}
                />
              </div>
              <div className="filter-item customer-filter-item main-page-customer-filter">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={enableCustomerFilter}
                    onChange={(e) => setEnableCustomerFilter(e.target.checked)}
                  />
                  Filter by Customer
                </label>
                {enableCustomerFilter && (
                  <div className="input-search-group">
                    <input
                      type="text"
                      placeholder="Filter by Customer Name..."
                      value={customerSearchTerm}
                      onChange={(e) => setCustomerSearchTerm(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <BarcodeSearch onSearch={handleBarcodeSearchAndNavigate} />

              {shippingLists.length > 0 && (
                <div className="shipping-lists-container">
                    <p className="shipping-list-header-text">Or Select Shipping List:</p>
                    <div className="shipping-lists">
                        {shippingLists.map(list => (
                            <div
                                key={list.id}
                                onClick={() => navigateToShippingPage(list)}
                                className="shipping-list-item"
                                role="button"
                                aria-label={`Select shipping list ${list.list_name}`}
                            >
                            <div className="card-icon-container">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clipboard-list">
                                  <rect x="9" y="2" width="6" height="4" rx="1"></rect>
                                  <path d="M4 6h16v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z"></path>
                                  <path d="M9 12h6"></path>
                                </svg>
                            </div>
                            <div className="card-content">
                                <span className="shipment-name">Shipment #{list.list_name}</span>
                                <span className="shipment-date">Added: {new Date(list.created_at).toLocaleDateString()}</span>
                            </div>
                            </div>
                        ))}
                    </div>
                </div>
              )}
              <MyInfo user={user} setPage={setPage} API_URL={API_URL} />
              <button onClick={() => setPage('shippedShipmentsPage')} className="shipped-shipments-button">
                View Shipped Shipments
              </button>
            </>
          )}

          {page === 'admin' && (
            <AdminPanel
              user={user}
              handleLogout={handleLogout}
              setPage={setPage}
              currentPage={page}
              toggleSidebar={toggleSidebar}
              hamburgerButtonRef={hamburgerButtonRef}
              adminPanelTab={adminPanelTab}
            />
          )}

          {page === 'palletPage' && (
            <PalletPage
              user={user}
              // setPage={setPage} // No longer needed, use goBack
              goBack={goBack} // Pass goBack function
              records={palletRecords}
              onSelectBarcode={navigateToImageGalleryPage}
              API_URL={API_URL}
              UserMenuComponent={() => (
                <UserMenuComponent
                  ref={userMenuRef}
                  userIconButtonRef={userIconButtonRef}
                  user={user}
                  toggleDropdown={toggleDropdown}
                  showDropdown={showDropdown}
                  handleLogout={handleLogout}
                  setPage={setPage}
                  currentPage={page}
                />
              )}
            />
          )}

          {page === 'imageGalleryPage' && selectedBarcodeRecord && (
            <ImageGalleryPage
              barcodeRecord={selectedBarcodeRecord}
              onClose={goBack} // Use goBack
              onAddImages={(barcode) => {
                  setCaptureBarcodeForGallery(barcode);
                  setShowCaptureModalForGallery(true);
                }}
              onDeleteImage={handleDeleteImageForGallery}
              API_URL={API_URL}
              user={user}
              UserMenuComponent={() => (
                <UserMenuComponent
                  ref={userMenuRef}
                  userIconButtonRef={userIconButtonRef}
                  user={user}
                  toggleDropdown={toggleDropdown}
                  showDropdown={showDropdown}
                  handleLogout={handleLogout}
                  setPage={setPage}
                  currentPage={page}
                />
              )}
            />
          )}

          {page === 'shippingPage' && selectedShippingList && (
            <ShippingPage
                shippingList={selectedShippingList}
                onClose={() => { goBack(); setSelectedShippingList(null); }} // Use goBack
                onSelectBarcode={navigateToImageGalleryPage}
                navigateToPalletPage={navigateToPalletPage}
                API_URL={API_URL}
                user={user}
                UserMenuComponent={() => (
                <UserMenuComponent
                  ref={userMenuRef}
                  userIconButtonRef={userIconButtonRef}
                  user={user}
                  toggleDropdown={toggleDropdown}
                  showDropdown={showDropdown}
                  handleLogout={handleLogout}
                  setPage={setPage}
                  currentPage={page}
                />
                )}
            />
          )}

          {page === 'shippedShipmentsPage' && (
            <ShippedShipmentsPage
              onClose={handleBackFromShippedShipmentsPage}
              onSelectShippingList={navigateToPalletFilteringPage}
              API_URL={API_URL}
              UserMenuComponent={() => (
                <UserMenuComponent
                  ref={userMenuRef}
                  userIconButtonRef={userIconButtonRef}
                  user={user}
                  toggleDropdown={toggleDropdown}
                  showDropdown={showDropdown}
                  handleLogout={handleLogout}
                  setPage={setPage}
                  currentPage={page}
                />
              )}
            />
          )}
          {page === 'palletFilteringPage' && currentFilteredPalletRecords.length > 0 && selectedFilteredShippingList && (
            <PalletFilteringPage
              records={currentFilteredPalletRecords}
              onClose={handleBackFromPalletFilteringPage}
              onSelectBarcode={navigateToImageGalleryPage}
              listName={selectedFilteredShippingList.list_name}
              UserMenuComponent={() => (
                <UserMenuComponent
                  ref={userMenuRef}
                  userIconButtonRef={userIconButtonRef}
                  user={user}
                  toggleDropdown={toggleDropdown}
                  showDropdown={showDropdown}
                  handleLogout={handleLogout}
                  setPage={setPage}
                  currentPage={page}
                />
              )}
            />
          )}
        </div>
      )}
    </div>
  )
}

// UserMenuComponent defined within App.jsx to keep related logic together
export const UserMenuComponent = React.forwardRef(({ user, toggleDropdown, showDropdown, handleLogout, setPage, currentPage, userIconButtonRef }, ref) => {
  if (!user) {
    return <div className="user-menu-placeholder" style={{ width: '28px' }}></div>;
  }
  return (
    <div className="user-menu" ref={ref}>
      <button ref={userIconButtonRef} onClick={toggleDropdown} className="user-icon-button" title="User Menu">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user w-6 h-6">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"></path>
          </svg>
      </button>
      {showDropdown && (
        <div className="dropdown-menu">
           
          <button onClick={() => { handleLogout(); toggleDropdown(); }} className="dropdown-item logout-btn">➡️ Log out</button>
        </div>
      )}
    </div>
  );
});

export default App

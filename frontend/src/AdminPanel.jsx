import React, { useState, useEffect, useRef } from 'react'
import BarcodeSearch from './BarcodeSearch'
import ImageGalleryModal from './ImageGalleryModal'
import BarcodeInputModal from './BarcodeInputModal'
import MediaCapture from './ImageCapture'
import { UserMenuComponent } from './App'
import Sidebar from './Sidebar' // Import Sidebar component

const API_URL = import.meta.env.VITE_API_URL || ""

function AdminPanel({ user, handleLogout, setPage, currentPage }) {
  const [tab, setTab] = useState('info')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // State for sidebar
  const sidebarRef = useRef(null)
  const hamburgerButtonRef = useRef(null)
  
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev)
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
  const [users, setUsers] = useState([])
  const [records, setRecords] = useState([])
  const [filteredRecords, setFilteredRecords] = useState([])
  const [editUser, setEditUser] = useState(null)
  const [galleryRecord, setGalleryRecord] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)

  const fileInputRef = useRef()

  const [showBarcodeInputModal, setShowBarcodeInputModal] = useState(false)

  const [captureOpen, setCaptureOpen] = useState(false)
  const [captureBarcode, setCaptureBarcode] = useState(null)
  const activeRecord = captureOpen ? filteredRecords.find(r => r.barcode === captureBarcode) : null

  const toggleDropdown = () => {
    setShowDropdown(prev => !prev)
  }

  useEffect(() => {
    if (tab === 'users') {
      fetchUsers()
    } else {
      fetchAllInfo()
    }
  }, [tab])

  const fetchUsers = async () => {
    const response = await fetch(`${API_URL}/api/admin/users`)
    const data = await response.json()
    setUsers(data.users)
  }

  const fetchAllInfo = async () => {
        const response = await fetch(`${API_URL}/api/admin/all-info`)
        const data = await response.json()
        console.log("Fetched all records:", data.records); // Add this line
        setRecords(data.records)
        setFilteredRecords(data.records)

    if (galleryRecord) {
      const updatedRecord = data.records.find(r => r.id === galleryRecord.id)
      if (updatedRecord && updatedRecord.images.length > 0) {
        setGalleryRecord(updatedRecord)
      } else {
        setGalleryRecord(null)
      }
    }
  }

  const handleSearch = (barcode) => {
    if (!barcode) {
      setFilteredRecords(records)
    } else {
      setFilteredRecords(records.filter(r => r.barcode.includes(barcode)))
    }
  }

  const deleteUser = async (id, email) => {
    if (email === user.email) {
      alert('Cannot delete yourself')
      return
    }
    if (confirm('Are you sure you want to delete this user?')) {
      await fetch(`${API_URL}/api/admin/users/${id}`, { method: 'DELETE' })
      fetchUsers()
    }
  }

  const updateUser = async () => {
    await fetch(`${API_URL}/api/admin/users/${editUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: editUser.email,
        password: editUser.password || 'unchanged',
        first_name: editUser.first_name,
        last_name: editUser.last_name,
        department: editUser.department
      })
    })
    setEditUser(null)
    fetchUsers()
  }

  const handleSaveNewBarcode = async (barcodeDetails) => {
    try {
      const response = await fetch(`${API_URL}/api/capture-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: [], // No images for this flow
          barcode: barcodeDetails.barcode,
          email: user.email,
          full_name: `${user.first_name} ${user.last_name}`,
          department: user.department,
          customer_name: barcodeDetails.customer_name,
          expected_ship_date: barcodeDetails.expected_ship_date,
          bol_number: barcodeDetails.bol_number
        })
      })
      const data = await response.json()
      if (data.success) {
        alert('New barcode record saved successfully!')
        fetchAllInfo() // Refresh the records list
      } else {
        throw new Error(data.detail || 'Save failed')
      }
    } catch (err) {
      alert('Save failed: ' + err.message)
    }
  }
  const deleteBarcodeRecord = async (barcode, email) => {
    try {
      const response = await fetch(`${API_URL}/api/barcode/${barcode}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: barcode, email: email })
      });
      const data = await response.json();
      if (data.success) {
        alert('Barcode record deleted successfully!');
        fetchAllInfo();
      } else {
        throw new Error(data.detail || 'Failed to delete barcode record');
      } 
    } catch (error) {
      alert('Error deleting barcode record: ' + error.message);
    }
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const formData = new FormData()
      formData.append('email', user.email)
      formData.append('file', file)
      const resp = await fetch(`${API_URL}/api/import-csv`, {
        method: 'POST',
        body: formData
      })
      const result = await resp.json()
      if (resp.ok) {
        await fetchAllInfo()
      } else {
        alert(result.detail || "Upload failed.")
      }
    } catch (err) {
      alert('Failed to upload CSV.')
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleImageCaptured = async (newImage) => {
    if (!captureBarcode || !user.email) return

    try {
      const response = await fetch(`${API_URL}/api/barcode/add-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: captureBarcode,
          email: user.email,
          image_url: newImage,
        }),
      })
      const data = await response.json()
      if (data.success) {
        alert('Image added successfully to record!')
        fetchAllInfo() // Refresh the records list
      } else {
        throw new Error(data.detail || 'Failed to add image')
      }
    } catch (error) {
      alert('Error adding image: ' + error.message)
    }
  }

  const deleteImage = async (barcode, index) => {
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
          alert('Image deleted successfully!')
          fetchAllInfo() // Refresh the records list
        } else {
          throw new Error(data.detail || 'Failed to delete image')
        }
      } catch (error) {
        alert('Error deleting image: ' + error.message)
      }
    }
  }

  return (
    <div className="admin-panel">
      <Sidebar
        ref={sidebarRef}
        isSidebarOpen={isSidebarOpen}
        closeSidebar={toggleSidebar}
        setAdminPanelTab={setTab}
        setPage={setPage}
      />
      <div className="header" width="100%">
        <button ref={hamburgerButtonRef} onClick={toggleSidebar} className="icon-button hamburger-button" title="Menu">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
        </button>
        <h1>Admin Panel</h1>
        <UserMenuComponent
          user={user}
          toggleDropdown={toggleDropdown}
          showDropdown={showDropdown}
          handleLogout={handleLogout}
          setPage={setPage}
          currentPage={currentPage}
        />
      </div>

      {tab === 'users' && (
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>Email</th><th>First Name</th><th>Last Name</th><th>Department</th><th>Role</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.first_name}</td>
                  <td>{u.last_name}</td>
                  <td>{u.department || 'N/A'}</td>
                  <td>{u.role === 1 ? 'Admin' : 'User'}</td>
                  <td className="actions-column">
                    {u.email !== user.email && (
                      <>
                        <button onClick={() => setEditUser(u)} className="icon-button action-button-blue" title="Edit User">✏️</button>
                        <button onClick={() => deleteUser(u.id, u.email)} className="icon-button action-button-blue" title="Delete User">🗑️</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'info' && (
        <div className="admin-info-content">
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleCsvUpload}
          />
          <div className="admin-actions-container">
            <button onClick={() => setShowBarcodeInputModal(true)} className="icon-button header-action-button" title="Add New Barcode">Add Barcode</button>
            <button onClick={() => fileInputRef.current.click()} className="icon-button header-action-button" title="Upload CSV">Upload CSV</button>
          </div>
          <BarcodeSearch onSearch={handleSearch} />
          <div className="table-responsive">
            <table className="barcode-records-table">
              <thead>
                <tr>
                  <th>Barcode</th>
                  <th>Customer Name</th>
                  <th>Expected Ship Date</th>
                  <th>BOL #</th>
                  <th>User</th>
                  <th>Date</th>
                  <th>Images</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(record => (
                  <tr key={record.id}>
                    <td>{record.barcode}</td>
                    <td>{record.customer_name}</td>
                    <td>{record.expected_ship_date}</td>
                    <td>{record.bol_number}</td>
                    <td>{record.full_name} ({record.email})</td>
                    <td>{new Date(record.date).toLocaleString()}</td>
                    <td>
                      {record.images && record.images.length > 0 ? (
                        <span style={{ color: 'green', fontWeight: 'bold' }}>✓ {record.images.length} Image(s)</span>
                      ) : (
                        <span style={{ color: 'red', fontWeight: 'bold' }}>✗ Not captured</span>
                      )}
                    </td>
                    <td className="actions-column">
                      <button onClick={() => setGalleryRecord(record)} className="icon-button action-button-blue" title="Manage Images">👁️</button>
                      <button onClick={() => { if (window.confirm('Are you sure you want to delete this barcode record?')) deleteBarcodeRecord(record.barcode, record.email) }} className="icon-button action-button-blue" title="Delete Barcode Record">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editUser && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h2>Edit User</h2>
            <label>
              Email:
              <input
                type="email"
                value={editUser.email}
                onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                readOnly
              />
            </label>
            <label>
              First Name:
              <input
                type="text"
                value={editUser.first_name}
                onChange={(e) => setEditUser({ ...editUser, first_name: e.target.value })}
              />
            </label>
            <label>
              Last Name:
              <input
                type="text"
                value={editUser.last_name}
                onChange={(e) => setEditUser({ ...editUser, last_name: e.target.value })}
              />
            </label>
            <label>
              Department:
              <input
                type="text"
                value={editUser.department || ''}
                onChange={(e) => setEditUser({ ...editUser, department: e.target.value })}
              />
            </label>
            <label>
              New Password (leave blank to keep current):
              <input
                type="password"
                value={editUser.password || ''}
                onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                placeholder="Leave blank to keep current"
              />
            </label>
            <div className="modal-actions">
              <button onClick={updateUser} className="icon-button action-button-blue">Save</button>
              <button onClick={() => setEditUser(null)} className="icon-button action-button-blue">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {galleryRecord && (
        <ImageGalleryModal
          record={galleryRecord}
          onClose={() => setGalleryRecord(null)}
          API_URL={API_URL}
          user={user}
          fetchRecords={fetchAllInfo} // AdminPanel calls fetchAllInfo
        />
      )}

      {showBarcodeInputModal && (
        <BarcodeInputModal
          onClose={() => setShowBarcodeInputModal(false)}
          onBarcodeScannedOrEntered={async (newBarcodeDetails) => {
            setShowBarcodeInputModal(false)
            await handleSaveNewBarcode(newBarcodeDetails)
          }}
        />
      )}



      {captureOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <MediaCapture
              onClose={() => { setCaptureOpen(false); setCaptureBarcode(null); }}
              images={activeRecord?.images || []}
              onCapture={handleImageCaptured}
              onDelete={(index) => deleteImage(captureBarcode, index)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPanel

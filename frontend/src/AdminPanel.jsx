import React, { useState, useEffect, useRef } from 'react'
import { DataGrid, GridToolbar } from '@mui/x-data-grid'
import { Box, Chip, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, useMediaQuery, useTheme, Tooltip, Stack, Typography } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import BarcodeSearch from './BarcodeSearch'
import ImageGalleryModal from './ImageGalleryModal'
import BarcodeInputModal from './BarcodeInputModal'
import MediaCapture from './ImageCapture'
import { UserMenuComponent } from './App'


const API_URL = import.meta.env.VITE_API_URL || ""

const UserCard = ({ user: userData, setEditUser, deleteUser, currentUser }) => {
  return (
    <Box sx={{
      padding: 2,
      margin: 1,
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      backgroundColor: '#fff',
    }}>
      <p><strong>Email:</strong> {userData.email}</p>
      <p><strong>Name:</strong> {`${userData.first_name} ${userData.last_name}`}</p>
      <p><strong>Department:</strong> {userData.department}</p>
      <p><strong>Role:</strong> {userData.role === 1 ? 'Admin' : 'User'}</p>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: 1 }}>
        {userData.email !== currentUser.email && (
          <>
            <IconButton
              color="primary"
              onClick={() => setEditUser(userData)}
              title="Edit User"
            >
              ✏️
            </IconButton>
            <IconButton
              color="secondary"
              onClick={() => deleteUser(userData.id, userData.email)}
              title="Delete User"
            >
              🗑️
            </IconButton>
          </>
        )}
      </Box>
    </Box>
  );
};

const RecordCard = ({ record, setGalleryRecord, deleteBarcodeRecord }) => {
  const hasImages = record.images && record.images.length > 0;
  return (
    <Box sx={{
      padding: 2,
      margin: 1,
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      backgroundColor: '#fff',
    }}>
      <p><strong>Barcode:</strong> {record.barcode}</p>
      <p><strong>Customer Name:</strong> {record.customer_name}</p>
      <p><strong>Expected Ship Date:</strong> {record.expected_ship_date}</p>
      <p><strong>BOL #:</strong> {record.bol_number}</p>
      <p><strong>User:</strong> {`${record.full_name || ''} (${record.email || ''})`}</p>
      <p><strong>Date:</strong> {new Date(record.date).toLocaleString()}</p>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <strong>Images:</strong>
        <Chip
          label={hasImages ? `✓ ${record.images.length} Image(s)` : '✗ Not captured'}
          color={hasImages ? 'success' : 'error'}
          size="small"
          sx={{ marginLeft: 1 }}
        />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: 1 }}>
        <IconButton
          color="primary"
          onClick={() => setGalleryRecord(record)}
          title="Manage Images"
        >
          👁️
        </IconButton>
        <IconButton
          color="secondary"
          onClick={() => { if (window.confirm('Are you sure you want to delete this barcode record?')) deleteBarcodeRecord(record.barcode, record.email) }}
          title="Delete Barcode Record"
        >
          🗑️
        </IconButton>
      </Box>
    </Box>
  );
};

function AdminPanel({ user, handleLogout, setPage, currentPage, toggleSidebar, hamburgerButtonRef, adminPanelTab }) {
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

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })

  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({
    customer_name: true,
    expected_ship_date: true,
    bol_number: true,
    user_info: true,
    date: true,
    images_status: true,
    actions: true,
  })

  useEffect(() => {
    setColumnVisibilityModel({
      customer_name: !isSmallScreen,
      expected_ship_date: !isSmallScreen,
      bol_number: !isSmallScreen,
      user_info: !isSmallScreen,
      date: !isSmallScreen,
      images_status: !isSmallScreen,
      actions: true, // Actions column always visible
    })
  }, [isSmallScreen])

  const userColumns = [
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'first_name', headerName: 'First Name', width: 150 },
    { field: 'last_name', headerName: 'Last Name', width: 150 },
    { field: 'department', headerName: 'Department', width: 150 },
    { field: 'role', headerName: 'Role', width: 100, valueFormatter: (params) => (params.value === 1 ? 'Admin' : 'User') },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => {
        if (!params || !params.row) {
          console.warn('params or params.row is undefined in userColumns actions renderCell', params);
          return null;
        }
        return (
          <Box>
            {params.row.email !== user.email && (
              <>
                <IconButton
                  color="primary"
                  onClick={() => setEditUser(params.row)}
                  title="Edit User"
                >
                  ✏️
                </IconButton>
                <IconButton
                  color="secondary"
                  onClick={() => deleteUser(params.row.id, params.row.email)}
                  title="Delete User"
                >
                  🗑️
                </IconButton>
              </>
            )}
          </Box>
        )
      }
    }
  ]

  const [userPaginationModel, setUserPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [userColumnVisibilityModel, setUserColumnVisibilityModel] = useState({
    first_name: true,
    last_name: true,
    department: true,
    role: true,
  })

  useEffect(() => {
    setUserColumnVisibilityModel({
      first_name: !isSmallScreen,
      last_name: !isSmallScreen,
      department: !isSmallScreen,
      role: !isSmallScreen,
      actions: true,
    })
  }, [isSmallScreen])

  const columns = [
    { field: 'barcode', headerName: 'Barcode', width: 150 },
    { field: 'customer_name', headerName: 'Customer Name', width: 200 },
    { field: 'expected_ship_date', headerName: 'Expected Ship Date', width: 180 },
    { field: 'bol_number', headerName: 'BOL #', width: 150 },
    {
      field: 'user_info',
      headerName: 'User',
      width: 200,
      valueGetter: (value, row) => {
        if (!row) {
          console.warn('row is undefined in user_info valueGetter', row);
          return '';
        }
        return `${row.full_name || ''} (${row.email || ''})`;
      }
    },
    {
      field: 'date',
      headerName: 'Date',
      width: 200,
      renderCell: (params) => {
        const dateValue = params.row?.date;
        if (!dateValue) {
          return 'N/A';
        }
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
      },
    },
    {
      field: 'images_status',
      headerName: 'Images',
      width: 150,
      renderCell: (params) => {
        if (!params || !params.row) {
          console.warn('params or params.row is undefined in images_status renderCell', params);
          return null;
        }
        const hasImages = params.row.images && params.row.images.length > 0;
        return (
          <Chip
            label={hasImages ? `✓ ${params.row.images.length} Image(s)` : '✗ Not captured'}
            color={hasImages ? 'success' : 'error'}
            size="small"
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => {
        if (!params || !params.row) {
          console.warn('params or params.row is undefined in columns actions renderCell', params);
          return null;
        }
        return (
          <Box>
            <IconButton
              color="primary"
              onClick={() => setGalleryRecord(params.row)}
              title="Manage Images"
            >
              👁️
            </IconButton>
            <IconButton
              color="secondary"
              onClick={() => { if (window.confirm('Are you sure you want to delete this barcode record?')) deleteBarcodeRecord(params.row.barcode, params.row.email) }}
              title="Delete Barcode Record"
            >
              🗑️
            </IconButton>
          </Box>
        );
      },
    },
  ]

  useEffect(() => {
    if (adminPanelTab === 'users') {
      fetchUsers()
    } else {
      fetchAllInfo()
    }
  }, [adminPanelTab])

  const fetchUsers = async () => {
    const response = await fetch(`${API_URL}/api/admin/users`)
    const data = await response.json()
    setUsers(data.users)
  }

  const fetchAllInfo = async () => {
        const response = await fetch(`${API_URL}/api/admin/all-info`)
        const data = await response.json()
        console.log("Fetched raw records:", data.records);
        const processedRecords = data.records.map((record, index) => {
      console.log("Raw record from API:", record);
      return {
        ...record,
        id: record.id || record.barcode || `generated-id-${index}`,
      };
    }).filter(record => record && (record.id || record.barcode)); // Filter out records without a valid ID or barcode
        console.log("Processed records for DataGrid:", processedRecords);
        setRecords(processedRecords);
        setFilteredRecords(processedRecords);

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
          department: barcodeDetails.department,
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
      <div className="header" width="100%">
        <Tooltip title="Menu">
          <IconButton ref={hamburgerButtonRef} onClick={toggleSidebar} color="inherit" sx={{ border: 'none', background: 'none', cursor: 'pointer', p: 1, '&:hover': { background: 'rgba(255,255,255,0.1)' } }}>
            <MenuIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="h6">Admin Panel</Typography>
        <UserMenuComponent
          user={user}
          toggleDropdown={toggleDropdown}
          showDropdown={showDropdown}
          handleLogout={handleLogout}
          setPage={setPage}
          currentPage={currentPage}
        />
      </div>

      {adminPanelTab === 'users' && (
        isSmallScreen ? (
          <Box sx={{ padding: 1 }}>
            {users.map((userData) => (
              <UserCard
                key={userData.id || userData.email}
                user={userData}
                setEditUser={setEditUser}
                deleteUser={deleteUser}
                currentUser={user}
              />
            ))}
          </Box>
        ) : (
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={users}
              columns={userColumns}
              pageSizeOptions={[5, 10, 25]}
              paginationModel={userPaginationModel}
              onPaginationModelChange={setUserPaginationModel}
              checkboxSelection={false}
              disableRowSelectionOnClick
              getRowId={(row) => row.id || row.email}
              autoHeight
              slots={{ toolbar: GridToolbar }}
              slotProps={{
                toolbar: {
                  showQuickFilter: true,
                  quickFilterProps: { debounceMs: 500 },
                },
              }}
              columnVisibilityModel={userColumnVisibilityModel}
              onColumnVisibilityModelChange={(newModel) => setUserColumnVisibilityModel(newModel)}
              loading={users.length === 0} // Add loading prop
              sx={{
                // Alternating row colors
                '& .MuiDataGrid-row:nth-of-type(odd)': {
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                },
                // Sticky header
                '& .MuiDataGrid-columnHeaders': {
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  backgroundColor: '#f5f5f5', // Match background for sticky effect
                },
              }}
            />
          </Box>
        )
      )}

      {adminPanelTab === 'info' && (
        <div className="admin-info-content">
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleCsvUpload}
          />
          <Stack direction="row" spacing={1} sx={{ marginBottom: 2 }}>
            <Button
              variant="contained"
              onClick={() => setShowBarcodeInputModal(true)}
              startIcon={<AddIcon />}
            >
              Add Barcode
            </Button>
            <Button
              variant="outlined"
              onClick={() => fileInputRef.current.click()}
              startIcon={<UploadFileIcon />}
            >
              Upload CSV
            </Button>
          </Stack>
          <BarcodeSearch onSearch={handleSearch} />
          {isSmallScreen ? (
            <Box sx={{ padding: 1 }}>
              {filteredRecords.map((record) => (
                <RecordCard
                  key={record.id || record.barcode}
                  record={record}
                  setGalleryRecord={setGalleryRecord}
                  deleteBarcodeRecord={deleteBarcodeRecord}
                />
              ))}
            </Box>
          ) : (
            <Box sx={{ height: 600, width: '100%' }}>
              <DataGrid
                rows={filteredRecords}
                columns={columns}
                pageSizeOptions={[5, 10, 25]}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                checkboxSelection={false}
                disableRowSelectionOnClick
                getRowId={(row) => row.id || row.barcode}
                autoHeight
                columnVisibilityModel={columnVisibilityModel}
                onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
                slots={{ toolbar: GridToolbar }}
                slotProps={{
                  toolbar: {
                    showQuickFilter: true,
                    quickFilterProps: { debounceMs: 500 },
                  },
                }}
                loading={filteredRecords.length === 0} // Add loading prop
                sx={{
                  // Alternating row colors
                  '& .MuiDataGrid-row:nth-of-type(odd)': {
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  },
                  // Sticky header
                  '& .MuiDataGrid-columnHeaders': {
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    backgroundColor: '#f5f5f5', // Match background for sticky effect
                  },
                }}
              />
            </Box>
          )}
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
import React, { useState, useEffect } from 'react';
import { TextField, InputAdornment, IconButton, Menu, MenuItem, FormControlLabel, Checkbox, Box, Button, FormControl, InputLabel, Select } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import './ShippedShipmentsPage.css';
function ShippedShipmentsPage({
  onClose, // Function to navigate back to myInfo
  onSelectShippingList, // Function to navigate to PalletFilteringPage with selected records
  API_URL,
  UserMenuComponent // New prop
}) {
  const [enableDateRangeFilter, setEnableDateRangeFilter] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [availableCustomers, setAvailableCustomers] = useState([]);
  const [barcodeSearchTerm, setBarcodeSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filteredShippingLists, setFilteredShippingLists] = useState([]);

  const fetchFilteredShippingLists = async () => {
    setLoading(true);
    setError(null);
    setFilteredShippingLists([]);

    const params = new URLSearchParams();
    if (enableDateRangeFilter && startDate) params.append('start_date', startDate);
    if (enableDateRangeFilter && endDate) params.append('end_date', endDate);
    if (customerSearchTerm) params.append('customer_name', customerSearchTerm);
    if (barcodeSearchTerm) params.append('barcode', barcodeSearchTerm);

    try {
      const response = await fetch(`${API_URL}/api/shipped-shipments-filtered-lists?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setFilteredShippingLists(data.shipping_lists);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available customer names on component mount
  useEffect(() => {
    const fetchCustomerNames = async () => {
      try {
        const response = await fetch(`${API_URL}/api/customer-names`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAvailableCustomers(data.customer_names);
      } catch (err) {
        console.error("Error fetching customer names:", err);
      }
    };
    fetchCustomerNames();
  }, [API_URL]);

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleApplyFilters = () => {
    fetchFilteredShippingLists();
    handleClose();
  };

  return (
    <Box className="shipping-page-container">
      <Box className="header">
        <IconButton onClick={onClose} className="icon-button back-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6"/></svg>
        </IconButton>
        <h2>Shipped Shipments</h2>
        {UserMenuComponent && UserMenuComponent()}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, p: 2, alignItems: 'center' }}>
        <TextField
          label="Enter barcode"
          variant="outlined"
          value={barcodeSearchTerm}
          onChange={(e) => setBarcodeSearchTerm(e.target.value)}
          fullWidth
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{
            flexGrow: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: '25px', // Rounded corners
              transition: 'border-color 0.3s ease-in-out', // Smooth transition for border
              '& fieldset': {
                borderColor: 'rgba(0, 0, 0, 0.23)', // Default border color
              },
              '&:hover fieldset': {
                borderColor: 'rgba(0, 0, 0, 0.87)', // Border color on hover
              },
              '&.Mui-focused fieldset': {
                borderColor: 'primary.main', // Border color on focus
                borderWidth: '1px', // Keep border width consistent
              },
            },
          }}
        />
        <IconButton
          id="filter-button"
          aria-controls={open ? 'filter-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleClick}
          color="primary"
          size="large"
        >
          <FilterListIcon />
        </IconButton>
        <Menu
          id="filter-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            'aria-labelledby': 'filter-button',
          }}
        >
          <Box sx={{ p: 2, minWidth: 250 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={enableDateRangeFilter}
                  onChange={(e) => setEnableDateRangeFilter(e.target.checked)}
                />
              }
              label="Ship Date Range"
            />
            {enableDateRangeFilter && (
              <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 2 }}>
                <TextField
                  type="date"
                  label="Start Date"
                  InputLabelProps={{ shrink: true }}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  size="small"
                  fullWidth
                />
                <TextField
                  type="date"
                  label="End Date"
                  InputLabelProps={{ shrink: true }}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  size="small"
                  fullWidth
                />
              </Box>
            )}

            <FormControl sx={{ mt: 1, mb: 2, minWidth: '100%' }} size="small">
              <InputLabel id="customer-select-label">Customer</InputLabel>
              <Select
                labelId="customer-select-label"
                id="customer-select"
                value={customerSearchTerm}
                label="Customer"
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
              >
                <MenuItem value="">All Customers</MenuItem>
                {availableCustomers.map((customer) => (
                  <MenuItem key={customer} value={customer}>
                    {customer}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              onClick={handleApplyFilters}
              fullWidth
              sx={{ mt: 2 }}
            >
              Apply Filters
            </Button>
          </Box>
        </Menu>
      </Box>

      {loading && (
        <Box className="shipping-lists-container">
          {[...Array(3)].map((_, index) => (
            <Box key={index} className="shipping-list-card skeleton">
              <Box className="card-header">
                <Box sx={{ width: '60%', height: 20, bgcolor: 'grey.300', borderRadius: '4px' }} />
                <Box sx={{ width: '20%', height: 16, bgcolor: 'grey.200', borderRadius: '10px' }} />
              </Box>
              <Box className="card-body">
                <Box sx={{ width: '80%', height: 14, bgcolor: 'grey.200', borderRadius: '4px', marginBottom: '5px' }} />
                <Box sx={{ width: '50%', height: 14, bgcolor: 'grey.200', borderRadius: '4px' }} />
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {error && <Box className="error-message">Error: {error}</Box>}

      {!loading && !error && filteredShippingLists.length === 0 && (
        <Box className="no-records-message">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-inbox">
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
            <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
          </svg>
          <p>No matching shipping lists found.</p>
          <p>Try adjusting your filters or search terms.</p>
        </Box>
      )}

      {!loading && !error && filteredShippingLists.length > 0 && (
        <Box className="shipping-lists-container">
          {filteredShippingLists.map(list => (
            <Box
              key={list.id}
              className="shipping-list-card"
              onClick={() => onSelectShippingList(list.matching_barcode_records, list)}
            >
              <Box className="card-header">
                <h3 className="shipment-list-name">{list.list_name}</h3>
                {/* Assuming there's a status, if not, this can be a placeholder or derived */}
                <span className="shipment-status">Shipped</span>
              </Box>
              <Box className="card-body">
                <p className="shipment-meta">Uploaded by: {list.uploaded_by_email}</p>
                <p className="shipment-meta">Date: {new Date(list.upload_date).toLocaleDateString()}</p>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

export default ShippedShipmentsPage;

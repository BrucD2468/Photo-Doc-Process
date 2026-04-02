import React, { useState, useEffect } from 'react';
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
  const [enableCustomerFilter, setEnableCustomerFilter] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
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
    if (enableCustomerFilter && customerSearchTerm) params.append('customer_name', customerSearchTerm);
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

  return (
    <div className="shipping-page-container">
      <div className="header">
        <button onClick={onClose} className="icon-button back-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2>Shipped Shipments</h2>
        {UserMenuComponent && UserMenuComponent()}
      </div>

      <div className="filters-container">
        {/* Ship Date Range Filter */}
        <div className="filter-item">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={enableDateRangeFilter}
              onChange={(e) => setEnableDateRangeFilter(e.target.checked)}
            />
            Ship Date Range
          </label>
          {enableDateRangeFilter && (
            <div className="date-range-inputs">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <span>to</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          )}
        </div>

        <div className="customer-barcode-search-row">
          <div className="filter-item customer-filter-item">
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
                  placeholder="Enter customer name..."
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Barcode Search Field */}
          <div className="filter-item barcode-search-item">
            <div className="input-search-group">
              <input
                type="text"
                placeholder="🔍Enter barcode..."
                value={barcodeSearchTerm}
                onChange={(e) => setBarcodeSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={fetchFilteredShippingLists} className="search-button">Search</button>
          </div>
        </div>
    </div>

      {loading && <div className="loading-message">Searching for shipments...</div>}
      {error && <div className="error-message">Error: {error}</div>}

      {!loading && !error && filteredShippingLists.length === 0 && (
        <div className="no-records-message">No matching shipping lists found.</div>
      )}

      <div className="shipping-lists-container">
        {filteredShippingLists.map(list => (
          <div
            key={list.id}
            onClick={() => onSelectShippingList(list.matching_barcode_records, list)}
            className="shipping-list-item"
            role="button"
            aria-label={`Select shipment ${list.list_name}`}
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
  );
}

export default ShippedShipmentsPage;

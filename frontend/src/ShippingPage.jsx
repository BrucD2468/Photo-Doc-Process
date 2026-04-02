import React, { useState, useEffect } from 'react';

const ShippingPage = ({ shippingList, onClose, onSelectBarcode, navigateToPalletPage, API_URL, user, UserMenuComponent }) => {
    const [barcodeRecords, setBarcodeRecords] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBarcodeRecords = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`${API_URL}/api/shipping-list/${shippingList.id}/barcodes`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setBarcodeRecords(data.records);
            } catch (err) {
                console.error("Error fetching barcode records for shipping list:", err);
                setError("Failed to load barcode records.");
            } finally {
                setLoading(false);
            }
        };

        if (shippingList && shippingList.id) {
            fetchBarcodeRecords();
        }
    }, [shippingList, API_URL]);

    const filteredRecords = barcodeRecords.filter(record =>
        record.barcode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!shippingList) {
        return <div className="shipping-page-container">No shipping list selected.</div>;
    }

    return (
        <div className="shipping-page-container">
            <div className="header">
                <button onClick={onClose} className="icon-button back-button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <h3>Shipping List: {shippingList.list_name}</h3>
                {UserMenuComponent && UserMenuComponent()}
            </div>

            <div className="search-bar-container">
                <div className="input-search-group">
                    <input
                        type="text"
                        placeholder="🔍Filter by barcode number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading && <div className="loading-message">Loading barcode records...</div>}
            {error && <div className="error-message">{error}</div>}

            {!loading && !error && filteredRecords.length === 0 && (
                <div className="no-records-message">No barcode records found for this shipping list.</div>
            )}

            {!loading && !error && filteredRecords.length > 0 && (
                <div className="shipping-list-table-container">
                    <table className="shipping-list-table">
                        <thead>
                            <tr>
                                <th>Barcode</th>
                                <th>Customer Name</th>
                                <th>Expected Ship Date</th>
                                <th>BOL #</th>
                                <th>Photos</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.map(record => (
                                <tr key={record.id} onClick={() => navigateToPalletPage([record])} className="shipping-list-table-row">
                                    <td>{record.barcode}</td>
                                    <td>{record.customer_name}</td>
                                    <td>{record.expected_ship_date}</td>
                                    <td>{record.bol_number}</td>
                                    <td>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent row click
                                                onSelectBarcode(record);
                                            }}
                                            className="icon-button image-count-button green-button"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-camera"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                                            {record.images ? `${record.images.length} >` : '0 >'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ShippingPage;

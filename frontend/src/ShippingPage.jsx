import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, IconButton, CircularProgress } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import CameraIcon from '@mui/icons-material/CameraAlt';
import { useSnackbar } from 'notistack';

const ShippingPage = ({ shippingList, onClose, onSelectBarcode, navigateToPalletPage, API_URL, user, UserMenuComponent }) => {
    const { enqueueSnackbar } = useSnackbar();
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
                enqueueSnackbar("Failed to load barcode records.", { variant: 'error' });
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
        return <Box className="shipping-page-container" sx={{ p: 2 }}>
            <Typography variant="body1" textAlign="center">
                No shipping list selected.
            </Typography>
        </Box>;
    }

    return (
        <Box className="shipping-page-container" sx={{ p: 2 }}>
            <Box className="header" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <IconButton onClick={onClose} aria-label="back" sx={{ mr: 1 }}>
                    <ChevronLeftIcon />
                </IconButton>
                <Typography variant="h5" component="h2" sx={{ flexGrow: 1 }}>
                    Shipping List: {shippingList.list_name}
                </Typography>
                {UserMenuComponent && UserMenuComponent()}
            </Box>

            <Box className="search-bar-container" sx={{ mb: 2 }}>
                <input
                    type="text"
                    placeholder="🔍Filter by barcode number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid var(--color-neutral-300)',
                        backgroundColor: 'var(--color-neutral-100)',
                        color: 'var(--text-color-primary)',
                    }}
                />
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <CircularProgress />
                </Box>
            ) : filteredRecords.length === 0 ? (
                <Typography variant="body1" textAlign="center" sx={{ mt: 4 }}>
                    No barcode records found for this shipping list.
                </Typography>
            ) : (
                <Box className="shipping-list-cards-container">
                    {filteredRecords.map(record => (
                        <Paper key={record.id} sx={{ p: 2, mb: 2, position: 'relative' }}>
                            <Typography variant="h6" gutterBottom>{record.barcode}</Typography>
                            <Typography variant="body2"><strong>Customer Name:</strong> {record.customer_name}</Typography>
                            <Typography variant="body2"><strong>Expected Ship Date:</strong> {record.expected_ship_date}</Typography>
                            <Typography variant="body2"><strong>BOL #:</strong> {record.bol_number}</Typography>
                            <IconButton
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent row click
                                    onSelectBarcode(record);
                                }}
                                aria-label="view images"
                                sx={{ position: 'absolute', top: 8, right: 8 }}
                            >
                                <CameraIcon />
                                <Typography variant="caption" sx={{ ml: 0.5 }}>
                                    {record.images ? `${record.images.length} >` : '0 >'}
                                </Typography>
                            </IconButton>
                            <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                onClick={() => navigateToPalletPage([record])}
                                sx={{ mt: 2 }}
                            >
                                View Pallet
                            </Button>
                        </Paper>
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default ShippingPage;

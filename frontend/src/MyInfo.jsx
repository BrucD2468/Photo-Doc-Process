import React, { useState, useEffect, useRef } from 'react'
import { useSnackbar } from 'notistack';
import { CircularProgress, Box, Typography, Button, Paper } from '@mui/material';

const API_URL = import.meta.env.VITE_API_URL || ""

function MyInfo({ user, API_URL, setPage }) {
  const { enqueueSnackbar } = useSnackbar();
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/my-info?email=${user.email}`)
      const data = await response.json()
      setRecords(data.records)
    } catch (err) {
      console.error('Failed to fetch records')
      enqueueSnackbar('Failed to fetch records', { variant: 'error' });
    } finally {
      setLoading(false)
    }
  }

  const deleteBarcode = async (barcode) => {
    if (window.confirm(`Are you sure you want to delete barcode ${barcode}? This is irreversible.`)) {
      try {
        const resp = await fetch(`${API_URL}/api/barcode/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barcode, email: user.email })
        });
        const result = await resp.json();
        if (resp.ok) {
          fetchRecords();
          enqueueSnackbar('Barcode deleted successfully!', { variant: 'success' });
        } else {
          enqueueSnackbar(result.detail || 'Failed to delete barcode', { variant: 'error' });
        }
      } catch (err) {
        enqueueSnackbar('An error occurred while deleting the barcode.', { variant: 'error' });
      }
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : (
        records.length > 0 ? (
          <Box>
            {records.map((record) => (
              <Paper key={record.barcode} sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6">{record.barcode}</Typography>
                <Typography variant="body2">Customer: {record.customer_name}</Typography>
                <Typography variant="body2">Ship Date: {record.expected_ship_date}</Typography>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => deleteBarcode(record.barcode)}
                  sx={{ mt: 1 }}
                >
                  Delete
                </Button>
              </Paper>
            ))}
          </Box>
        ) : (
          <Typography variant="body1" textAlign="center" sx={{ mt: 4 }}>
            No barcode records found.
          </Typography>
        )
      )}
    </Box>
  );
}

export default MyInfo;
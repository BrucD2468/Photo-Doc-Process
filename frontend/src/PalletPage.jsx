import React, { useState, useEffect } from 'react'
import { Box, Typography, Button, Paper, IconButton, CircularProgress } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import CameraIcon from '@mui/icons-material/CameraAlt';

function PalletPage({ user, goBack, records, onSelectBarcode, API_URL, UserMenuComponent, loading }) {

  return (
    <Box className="pallet-page" sx={{ p: 2 }}>
      <Box className="header" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <IconButton onClick={goBack} aria-label="back" sx={{ mr: 1 }}>
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="h5" component="h2" sx={{ flexGrow: 1 }}>
          Pallet Information
        </Typography>
        {UserMenuComponent && UserMenuComponent()}
      </Box>
      <Box className="pallet-cards-container">
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : records.length === 0 ? (
          <Typography variant="body1" textAlign="center" sx={{ mt: 4 }}>
            No records found for this search.
          </Typography>
        ) : (
          records.map(record => (
            <Paper key={record.id} className="pallet-card" sx={{ p: 2, mb: 2, position: 'relative' }}>
              <Typography variant="h6" gutterBottom>{record.barcode}</Typography>
              <Typography variant="body2"><strong>Customer Name:</strong> {record.customer_name}</Typography>
              <Typography variant="body2"><strong>Expected Ship Date:</strong> {record.expected_ship_date}</Typography>
              <Typography variant="body2"><strong>BOL #:</strong> {record.bol_number}</Typography>
              <IconButton
                onClick={() => onSelectBarcode(record)}
                aria-label="view images"
                sx={{ position: 'absolute', top: 8, right: 8 }}
              >
                <CameraIcon />
                <Typography variant="caption" sx={{ ml: 0.5 }}>
                  {record.images ? `${record.images.length} >` : '0 >'}
                </Typography>
              </IconButton>
            </Paper>
          ))
        )}
      </Box>
    </Box>
  )
}

export default PalletPage
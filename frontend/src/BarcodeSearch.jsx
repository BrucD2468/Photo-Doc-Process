import React, { useState, useEffect } from 'react'
import BarcodeScanner from './BarcodeScanner'
import { Button, TextField, Stack, Tooltip, Box } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import CameraAltIcon from '@mui/icons-material/CameraAlt'
import CancelIcon from '@mui/icons-material/Cancel'

function BarcodeSearch({ onSearch }) {
  const [barcode, setBarcode] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanMode, setScanMode] = useState(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const userAgent = navigator.userAgent
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) || 
                          (window.innerWidth <= 768 && window.innerHeight <= 1024)
    setIsMobile(isMobileDevice)
    console.log('Mobile detection:', { userAgent, isMobileDevice, width: window.innerWidth, height: window.innerHeight })
  }, [])

  const handleSearch = () => {
    if (barcode) onSearch(barcode)
  }

  const handleDetected = (code) => {
    setBarcode(code)
    setScanning(false)
    setScanMode(null)
    onSearch(code)
  }

  const startScan = () => {
    setScanning(true)
    setScanMode(null)
  }

  const chooseMode = (mode) => {
    setScanMode(mode)
  }

  return (
    <Box sx={{ padding: 2 }}>
      {!scanning ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              label="Enter barcode"
              variant="outlined"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              fullWidth
              size="small"
              sx={{ flexGrow: 1 }}
            />
            <Tooltip title="Search Barcode">
              <Button variant="contained" onClick={handleSearch} startIcon={<SearchIcon />}>
                Search
              </Button>
            </Tooltip>
          </Stack>
          <Tooltip title="Scan Barcode">
              <Button
                variant="contained"
                color="primary"
                onClick={startScan}
                startIcon={<QrCodeScannerIcon />}
                sx={{
                  marginTop: 2,
                  width: '100%',
                  paddingY: 1.5,
                  fontSize: '1.1rem',
                }}
              >
                Scan Barcode
              </Button>
            </Tooltip>
          </Box>
      ) : (
        !scanMode ? (
          <Box sx={{textAlign:'center',padding:'24px'}}>
            <p style={{fontWeight:'bold',fontSize:'16px'}}>Select scan method:</p>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Tooltip title="Scan with Camera">
                <Button
                  variant="contained"
                  onClick={() => chooseMode('camera')}
                  startIcon={<CameraAltIcon />}
                >
                  Camera
                </Button>
              </Tooltip>
              <Tooltip title="Cancel Scan">
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setScanning(false)}
                  startIcon={<CancelIcon />}
                >
                  Cancel
                </Button>
              </Tooltip>
            </Stack>
          </Box>
        ) : (
          <BarcodeScanner mode="camera" onDetected={handleDetected} onClose={() => { setScanning(false); setScanMode(null); }} />
        )
      )}
    </Box>
  )
}

export default BarcodeSearch

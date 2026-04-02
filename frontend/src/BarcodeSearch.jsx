import React, { useState, useEffect } from 'react'
import BarcodeScanner from './BarcodeScanner'

function BarcodeSearch({ onSearch, showSearchButton = false, initialBarcode = '' }) {
  const [barcode, setBarcode] = useState(initialBarcode)
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

  const handleDetected = (code) => {
    setBarcode(code)
    setScanning(false)
    setScanMode(null)
    onSearch(code)
  }

  const handleInputChange = (e) => {
    const newValue = e.target.value
    setBarcode(newValue)
    if (!showSearchButton) {
      onSearch(newValue)
    }
  }

  const handleSearchClick = () => {
    onSearch(barcode)
  }

  const startScan = () => {
    setScanning(true)
    setScanMode(null)
  }

  const chooseMode = (mode) => {
    setScanMode(mode)
  }

  return (
    <div className="barcode-search">
      {!scanning ? (
        <div className="search-input">
          <div className="input-search-group">
            <input
              type="text"
              placeholder="🔍Enter barcode..."
              value={barcode}
              onChange={handleInputChange}
            />
          </div>
          {showSearchButton ? (
            <button onClick={handleSearchClick} className="search-button">
              Search
            </button>
          ) : (
            <button onClick={startScan} className="scan-button">
              <svg width="40" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}>
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"></path>
              </svg>
              Scan Barcode
            </button>
          )}
        </div>
      ) : (
        !scanMode ? (
          <div className="scan-mode-choice" style={{textAlign:'center',padding:'24px'}}>
            <p style={{fontWeight:'bold',fontSize:'16px'}}>Select scan method:</p>
            <div style={{display:'flex', justifyContent:'center', gap:'14px'}}>
              <button onClick={() => chooseMode('camera')} className="barcode-search-button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}>
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"></path>
                </svg>
                Camera
              </button>
              <button onClick={() => setScanning(false)} className="barcode-search-button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '6px'}}>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="m15 9-6 6m0-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <BarcodeScanner mode="camera" onDetected={handleDetected} onClose={() => { setScanning(false); setScanMode(null); }} />
        )
      )}
    </div>
  )
}

export default BarcodeSearch

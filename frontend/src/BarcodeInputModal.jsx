import React, { useState, useEffect } from 'react'

function BarcodeInputModal({ onClose, onBarcodeScannedOrEntered }) {
  const [barcode, setBarcode] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [expectedShipDate, setExpectedShipDate] = useState('')
  const [bolNumber, setBolNumber] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const savedBarcode = localStorage.getItem('scannedBarcode');
    if (savedBarcode) {
      setBarcode(savedBarcode);
      localStorage.removeItem('scannedBarcode'); // Clear after reading
    }
  }, []);

  const handleManualInputChange = (e) => {
    setBarcode(e.target.value)
    setError('')
  }

  const handleNext = () => {
    if (barcode.trim()) {
      onBarcodeScannedOrEntered({
        barcode,
        customer_name: customerName,
        expected_ship_date: expectedShipDate,
        bol_number: bolNumber,
      })
    } else {
      setError('Please enter or scan a barcode.')
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Add New Barcode Record</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <label>
          Barcode Number:
          <input type="text" value={barcode} onChange={handleManualInputChange} placeholder="Enter barcode manually" />
        </label>
        <label>
          Customer Name:
          <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter customer name" />
        </label>
        <label>
          Expected Ship Date:
          <input type="date" value={expectedShipDate} onChange={(e) => setExpectedShipDate(e.target.value)} />
        </label>
        <label>
          BOL Number:
          <input type="text" value={bolNumber} onChange={(e) => setBolNumber(e.target.value)} placeholder="Enter BOL number" />
        </label>
        <button onClick={handleNext} className="save-button">Save</button>
        <button onClick={onClose} className="icon-button delete-btn" title="Cancel">✖️</button>
      </div>
    </div>
  )
}

export default BarcodeInputModal

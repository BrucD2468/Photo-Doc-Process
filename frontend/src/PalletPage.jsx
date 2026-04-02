import React, { useState, useEffect } from 'react'

function PalletPage({ user, goBack, records, onSelectBarcode, API_URL, UserMenuComponent }) {
  return (
    <div className="pallet-page">
      <div className="header">
        <button onClick={goBack} className="icon-button back-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h3>Pallet information</h3>
        {UserMenuComponent && UserMenuComponent()}
      </div>
      <div className="pallet-cards-container">
        {records.length === 0 ? (
          <p>No records found for this search.</p>
        ) : (
          records.map(record => (
            <div key={record.id} className="pallet-card">
              <h3>{record.barcode}</h3>
              <p><strong>Customer Name:</strong> {record.customer_name}</p>
              <p><strong>Expected Ship Date:</strong> {record.expected_ship_date}</p>
              <p><strong>BOL #:</strong> {record.bol_number}</p>
              <button onClick={() => onSelectBarcode(record)} className="icon-button image-count-button top-right-button">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-camera"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                  {record.images ? `${record.images.length} >` : '0 >'}
                </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default PalletPage
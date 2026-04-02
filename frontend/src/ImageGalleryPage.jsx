import React, { useEffect } from 'react'

function ImageGalleryPage({ barcodeRecord, onClose, onAddImages, onDeleteImage, API_URL, user, UserMenuComponent }) {
  useEffect(() => {
    // console.log("ImageGalleryPage mounted with barcodeRecord:", barcodeRecord);
    return () => {
      // console.log("ImageGalleryPage unmounted.");
    };
  }, [barcodeRecord]);
  const isRollNumber = barcodeRecord.barcode.includes('-')
  const headerTitle = `${isRollNumber ? 'Roll' : 'Pallet'} Barcode: ${barcodeRecord.barcode}`

  return (
    <div className="image-gallery-page">
      <div className="header">
        <button onClick={onClose} className="icon-button back-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6"/></svg>
          </button>
        <h2>{headerTitle}</h2>
        {UserMenuComponent && UserMenuComponent()}
      </div>
      <div className="image-grid">
        {barcodeRecord.images && barcodeRecord.images.length > 0 ? (
          barcodeRecord.images.map((imageData, index) => (
            <div key={index} className="image-container">
              <img src={imageData.url} alt={`Barcode Image ${index + 1}`} />
              <div className="image-metadata">
                <p><strong>Added By:</strong> {imageData.added_by_name}</p>
                <p><strong>Added Date:</strong> {new Date(imageData.added_date).toLocaleDateString()}</p>
              </div>
              <button className="delete-image-button" onClick={() => onDeleteImage(barcodeRecord.barcode, index)}>
                <p>✕</p>
              </button>
            </div>
          ))
        ) : (
          <p>No images for this barcode.</p>
        )}
      </div>
      <div className="gallery-actions">
        <button className="scan-button" onClick={() => { console.log("ImageGalleryPage: Take More Images button clicked for barcode:", barcodeRecord.barcode); onAddImages(barcodeRecord.barcode); }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
          Take More Images
        </button>
      </div>
    </div>
  )
}

export default ImageGalleryPage
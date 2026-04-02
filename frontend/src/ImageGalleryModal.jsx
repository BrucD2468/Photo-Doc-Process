import React, { useState, useEffect } from 'react'
import MediaCapture from './ImageCapture'

function ImageGalleryModal({ record, onClose, API_URL, user, fetchRecords }) {
  const [images, setImages] = useState(record.images || [])
  const [isCapturing, setIsCapturing] = useState(false)
  const MAX_IMAGES = 10

  useEffect(() => {
    setImages(record.images || [])
  }, [record])

  const handleCaptureNewImage = async (newImage) => {
        try {
          const response = await fetch(`${API_URL}/api/barcode/add-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              barcode: record.barcode,
              email: user.email,
              images: [newImage.url], // Send the base64 string directly in a list
              full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
              department: user.department || null,
              customer_name: record.customer_name || null,
              expected_ship_date: record.expected_ship_date ? new Date(record.expected_ship_date).toISOString().split('T')[0] : null,
              bol_number: record.bol_number || null,
            }),
          })
          const data = await response.json()
          if (data.success) {
            alert('Image added successfully to record!')
            // Update local state with the full image object, including metadata from backend
            setImages((prevImages) => [...prevImages, {
              url: newImage.url,
              takenBy: newImage.takenBy,
              added_date: newImage.timestamp,
              added_by_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
              added_by_email: user.email
            }])
            fetchRecords() // Refresh parent component's records
            setIsCapturing(false) // Exit capture mode after successful capture and save
          } else {
            throw new Error(data.detail || 'Failed to add image')
          }
        } catch (error) {
          alert('Error adding image: ' + error.message)
        }
      }

  const handleDeleteImage = async (indexToDelete) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      const imageToDelete = images[indexToDelete]
      try {
        const response = await fetch(`${API_URL}/api/barcode/delete-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            barcode: record.barcode,
            index: indexToDelete, // Send the index to delete
            email: user.email
          })
        })
        const data = await response.json()
        if (data.success) {
          alert('Image deleted successfully!')
          const newImages = images.filter((_, i) => i !== indexToDelete)
          setImages(newImages)
          fetchRecords() // Refresh parent component's records
        } else {
          throw new Error(data.detail || 'Failed to delete image')
        }
      } catch (error) {
        alert('Error deleting image: ' + error.message)
      }
    }
  }

  const handleSaveImages = async () => {
    // This function will be used if we allow bulk saving of new images added via this modal.
    // For now, new images are added one by one, and existing ones are deleted one by one.
    // The ImageCapture component will handle saving new images to the backend if needed.
    // If this modal is only for viewing and adding one-by-one, this function might not be strictly necessary
    // or might be triggered by the ImageCapture's own save mechanism.
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Manage Images for Barcode: {record.barcode}</h2>

        {!isCapturing && (
          <div className="image-gallery">
            <div className="image-grid">
              {images.length > 0 ? (
                images.map((img, idx) => {
                  return (
                    <div key={idx} className="image-item">
                      <img src={img.url} alt={`Barcode Image ${idx + 1}`} />
                      <button className="icon-button action-button-blue" onClick={() => handleDeleteImage(idx)} title="Delete Image">🗑️</button>
                    </div>
                  );
                })
              ) : (
                <p>No images captured for this barcode yet.</p>
              )}
            </div>

            <div className="buttons">
              {images.length < MAX_IMAGES && (
                <button onClick={() => setIsCapturing(true)} className="icon-button action-button-blue" title="Add New Image">Add Image</button>
              )}
              <button onClick={onClose} className="icon-button action-button-blue" title="Close Gallery">✖️</button>
            </div>
          </div>
        )}

        {isCapturing && (
          <MediaCapture
            onClose={() => setIsCapturing(false)}
            images={[]} // Start with an empty array for new captures in this context
            onCapture={handleCaptureNewImage}
            onDelete={() => {}} // Deletion handled by the gallery, not here
            onClear={() => {}} // Clearing handled by the gallery, not here
            allowSave={true} // Allow saving from ImageCapture
            onSave={async (capturedImages) => {
              // This save is for images captured *within* this ImageCapture session
              // They are already added to 'images' state in handleCaptureNewImage
              // Now, we need to send them to the backend, associating with the record.barcode
              try {
                const response = await fetch(`${API_URL}/api/barcode/add-image`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    images: capturedImages.map(img => img.url), // Send only the base64 URL
                    barcode: record.barcode,
                    email: user.email,
                    full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                    department: user.department || null,
                    customer_name: record.customer_name || null,
                    expected_ship_date: record.expected_ship_date ? new Date(record.expected_ship_date).toISOString().split('T')[0] : null,
                    bol_number: record.bol_number || null,
                  })
                })
                const data = await response.json()
                if (data.success) {
                  alert('Image(s) added successfully!')
                  fetchRecords() // Refresh the records list in MyInfo
                  setIsCapturing(false)
                } else {
                  throw new Error(data.detail || 'Failed to add image(s)')
                }
              } catch (error) {
                alert('Error adding image(s): ' + error.message)
              }
            }}
          />
        )}
      </div>
    </div>
  )
}

export default ImageGalleryModal

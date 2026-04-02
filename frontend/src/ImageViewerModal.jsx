import React, { useState, useEffect } from 'react';
import './ImageViewerModal.css'; // We'll create this CSS file next

const ImageViewerModal = ({ images, initialIndex, barcode, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  if (!images || images.length === 0) {
    return null; // Or render a message indicating no images
  }

  const currentImage = images[currentIndex];
  const totalImages = images.length;

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? totalImages - 1 : prevIndex - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === totalImages - 1 ? 0 : prevIndex + 1));
  };

  // Assuming currentImage.url is base64 encoded and currentImage.takenBy, currentImage.timestamp exist
  // We'll need to confirm the actual data structure
  const imageUrl = currentImage.url;
  const takenBy = currentImage.takenBy || currentImage.added_by_name || 'Unknown';
  const timestamp = currentImage.timestamp ? new Date(currentImage.timestamp).toLocaleString() :
                      (currentImage.added_date ? new Date(currentImage.added_date).toLocaleString() : 'N/A');

  return (
    <div className="image-viewer-modal-overlay">
      <div className="image-viewer-modal-content">
        <button className="back-button" onClick={onClose}>&larr; Back</button>

        <div className="main-image-display">
          <img src={imageUrl} alt={`Barcode Image ${barcode} - ${currentIndex + 1}`} className="displayed-image" />
        </div>

        <div className="navigation-controls">
          <button onClick={goToPrevious} className="nav-button left-arrow">&larr;</button>
          <button onClick={goToNext} className="nav-button right-arrow">&rarr;</button>
        </div>

        <div className="image-info">
          <p><strong>Taken By:</strong> {takenBy}</p>
          <p><strong>Timestamp:</strong> {timestamp}</p>
          <p className="pagination">{currentIndex + 1}/{totalImages}</p>
        </div>
      </div>
    </div>
  );
};

export default ImageViewerModal;

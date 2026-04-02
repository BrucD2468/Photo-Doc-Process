import React, { useState, useRef, useEffect } from 'react'
import ImageViewerModal from './ImageViewerModal';
import './ImageCapture.css' // Link the new CSS file

function MediaCapture({ onClose, onCapture, onDelete, onClear, onSave, allowSave = false, barcode, headerTitle, images: initialImages = [], currentUser }) {
  const [mode, setMode] = useState(null)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [capturedImages, setCapturedImages] = useState(initialImages)
  const [showImageViewer, setShowImageViewer] = useState(false);
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const MAX_IMAGES = 10

  useEffect(() => {
    // Format initial images to the expected object structure if they are raw base64 strings
    const formattedInitialImages = initialImages.map(img =>
      typeof img === 'string' ? { url: img, takenBy: 'Unknown', timestamp: new Date().toISOString() } : (img && img.url ? img : { url: undefined, takenBy: 'Unknown', timestamp: new Date().toISOString() })
    );
    setCapturedImages(formattedInitialImages);
  }, [initialImages]);

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    if (!mode) {
      requestCameraPermissionAndStart();
    }
  }, [barcode, mode]);

  useEffect(() => {
    if (mode && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(err => console.error('Error playing video:', err))
    }
  }, [mode])

  const requestCameraPermissionAndStart = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Camera API not supported in this browser.");
      return;
    }

    try {
      const permissionStatus = await navigator.permissions.query({ name: 'camera' });

      if (permissionStatus.state === 'granted') {
        startCamera();
      } else if (permissionStatus.state === 'prompt') {
        // Attempt to get user media, which will trigger the prompt
        setInfo("Please allow camera access to continue.");
        startCamera(); // This will trigger the permission prompt
      } else if (permissionStatus.state === 'denied') {
        setError("Camera permission denied. Please enable camera access in your browser settings.");
      }
    } catch (err) {
      setError(`Error checking camera permissions: ${err.message || err}`);
    }
  };

  const startCamera = async () => {
    try {
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        setError('Camera access requires HTTPS. Please ensure you\'re accessing the site via HTTPS.')
        return
      }
      const constraints = isMobile 
        ? { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } } 
        : { video: { facingMode: 'environment' } }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      setMode('camera')
      setError('')
      setInfo('')
    } catch (err) {
      let errorMessage = 'Camera access failed. '
      if (err.name === 'NotAllowedError') errorMessage += 'Camera permission was denied. Please allow camera access in your browser and try again.'
      else if (err.name === 'NotFoundError') errorMessage += 'No camera found. Please connect a camera and try again.'
      else if (err.name === 'NotReadableError') errorMessage += 'Camera is already in use by another application.'
      else if (err.name === 'OverconstrainedError') {
        errorMessage += 'Camera does not support the required settings. Trying simpler constraints...'
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true })
          streamRef.current = fallbackStream
          setMode('camera')
          setError('')
          setInfo('')
          return
        } catch {
          errorMessage += 'Even basic camera access failed.'
        }
      } else if (err.name === 'SecurityError') errorMessage += 'Camera access blocked. This may be due to: 1) Not using HTTPS, 2) Browser security restrictions, or 3) Corporate policy.'
      else if (err.name === 'AbortError') errorMessage += 'Camera access was interrupted. Please try again.'
      else if (err.name === 'NotSupportedError') errorMessage += 'Camera access is not supported in this browser.'
      else errorMessage += `Unexpected error: ${err.message || 'Unknown error'}. Please check browser console for details.`
      setError(errorMessage)
    }
  }

  const startScreen = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
      streamRef.current = stream
      setMode('screen')
      stream.getVideoTracks()[0].addEventListener('ended', () => { stopStream() })
    } catch (err) {
      let errorMessage = 'Screen capture failed. '
      if (err.name === 'NotAllowedError') errorMessage += 'Screen sharing permission denied. Please allow screen sharing and try again.'
      else if (err.name === 'NotFoundError') errorMessage += 'Screen sharing not available.'
      else if (err.name === 'InvalidStateError') errorMessage += 'Screen capture cancelled by user.'
      else if (err.name === 'NotSupportedError') errorMessage += 'Screen sharing is not supported in this browser.'
      else errorMessage += `Unexpected error: ${err.message || 'Unknown error'}. Please check browser console for details.`
      setError(errorMessage)
    }
  }

  const capturePhoto = () => {
    if (capturedImages.length >= MAX_IMAGES) {
      setInfo(`You can only store up to ${MAX_IMAGES} images per session.`)
      return
    }
    const canvas = canvasRef.current
    const video = videoRef.current
    try {
      canvas.width = video.videoWidth || 1920
      canvas.height = video.videoHeight || 1080
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
      const imageData = canvas.toDataURL('image/jpeg').split(',')[1]
      const capturedImageObject = {
        url: imageData,
        takenBy: currentUser?.email || 'Unknown',
        timestamp: new Date().toISOString(),
      };
      setCapturedImages(prevImages => [...prevImages, capturedImageObject])
      onCapture(capturedImageObject) // Call the onCapture prop to send image to parent if needed
      setInfo('Image captured!')
      setTimeout(() => setInfo(''), 2000) // Clear info message after 2s
    } catch (err) {
      setError('Capture failed: ' + err.message)
    }
  }

  const deleteImage = (index) => {
    setCapturedImages(prevImages => prevImages.filter((_, i) => i !== index))
    if (onDelete) onDelete(index) // Call the onDelete prop if provided
  }

  const clearImages = () => {
    setCapturedImages([])
    if (onClear) onClear() // Call the onClear prop if provided
  }

  const saveImages = () => {
    if (onSave) onSave(capturedImages)
  }

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setMode(null)
  }

  useEffect(() => () => stopStream(), [])

  return (
    <div className="image-capture-container">
      <div className="capture-header">
        <button onClick={onClose} className="back-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        </button>
        <h2 className="header-title">{headerTitle || 'Image Capture'}</h2>
      </div>

      {/* Camera Preview Area */}
      {mode === 'camera' && streamRef.current && (
        <div className="camera-preview-wrapper">
          <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
          <div className="scan-guide-overlay">
            <div className="corner-bracket top-left"></div>
            <div className="corner-bracket top-right"></div>
            <div className="corner-bracket bottom-left"></div>
            <div className="corner-bracket bottom-right"></div>
            <div className="scan-indicator-arrow">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </div>
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      )}

      {/* Info/Error Messages */}
      {error && <p className="error-message">{error}</p>}
      {info && <p className="info-message">{info}</p>}

      {/* Bottom Control Panel */}
      {mode === 'camera' && (
        <div className="capture-controls-bottom">
          <button className="gallery-thumbnail-button" onClick={() => setShowImageViewer(true)}>
            {capturedImages.length > 0 ? (
              <img src={capturedImages[capturedImages.length - 1].url.startsWith('http') ? capturedImages[capturedImages.length - 1].url : `data:image/jpeg;base64,${capturedImages[capturedImages.length - 1].url}`} alt="Last capture" className="thumbnail-image" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            )}
          </button>
          <button className="shutter-button" onClick={capturePhoto} disabled={capturedImages.length >= MAX_IMAGES}>
            <div className="shutter-inner-ring"></div>
          </button>
          <button className="camera-switch-button" onClick={() => alert('Switch Camera - TBD')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-camera-off"><path d="M10.21 6.29A6 6 0 0 1 12 6a6 6 0 0 1 6 6v2"/><path d="M4 14a6 6 0 0 0 6 6h2"/><path d="M2 2l20 20"/><path d="m6 6 8.25 8.25"/><path d="M7.8 20.7L9 18h3.34L18 22h-8Z"/><path d="M16 12a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z"/><path d="M12 3a2 2 0 0 0-2 2h0"/><path d="M5 7L3 5"/></svg>
          </button>
        </div>
      )}

      {showImageViewer && capturedImages.length > 0 && (
        <ImageViewerModal
          images={capturedImages}
          initialIndex={capturedImages.length - 1}
          barcode={barcode}
          onClose={() => setShowImageViewer(false)}
        />
      )}

      {/* Old Mode selection, only show if no images are captured and not in capture mode */}
      {/* Will be replaced by new control panel */}
      {/* {!mode && capturedImages.length === 0 && (
        <div className="buttons">
          {isMobile ? (
            <button onClick={startCamera} className="icon-button edit-btn" title="Start Camera">📷</button>
          ) : (
            <>
              <button onClick={startCamera} className="icon-button edit-btn" title="Start Camera">📷</button>
              <button onClick={startScreen} className="icon-button edit-btn" title="Start Screen Capture">🖥️</button>
            </>
          )}
          <button onClick={onClose} className="icon-button delete-btn" title="Back">⬅️</button>
        </div>
      )} */}

      {/* Gallery display / manage captured images */}
      {capturedImages.length > 0 && !mode && (
        <div>
          <h3>Saved Images ({capturedImages.length}/{MAX_IMAGES})</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent:'center', marginBottom:16 }}>
            {capturedImages.map((img, idx) => (
              <div key={idx} style={{ position: 'relative' }}>
                <img src={img.url.startsWith('http') ? img.url : `data:image/jpeg;base64,${img.url}`} alt={`Captured-${idx+1}`} style={{ width: 120, height: 90, objectFit:'cover', border: '1px solid #ccc', borderRadius:4 }} />
                <button onClick={()=>deleteImage(idx)} style={{ position:'absolute', top:2, right:2, background:'rgba(255,255,255,0.8)', borderRadius:'50%', border:'none', cursor:'pointer', width:22, height:22, lineHeight:'14px', fontSize:17 }} title="Delete">×</button>
              </div>
            ))}
          </div>
          <div className="buttons">
            {capturedImages.length < MAX_IMAGES && (
              isMobile ? (
                <button onClick={startCamera} className="icon-button edit-btn" title="Add Image">➕📷</button>
              ) : (
                <>
                  <button onClick={startCamera} className="icon-button edit-btn" title="Add Camera Image">➕📷</button>
                  <button onClick={startScreen} className="icon-button edit-btn" title="Add Screen Image">➕🖥️</button>
                </>
              )
            )}
            {onClear && <button onClick={clearImages} className="icon-button delete-btn" title="Clear All Images">🗑️</button>}
            {allowSave && <button onClick={saveImages} disabled={capturedImages.length === 0}>Save Record</button>}
            <button onClick={onClose} className="icon-button delete-btn" title="Back to Main">⬅️</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MediaCapture

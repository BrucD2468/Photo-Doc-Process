import React, { useState, useRef, useEffect } from 'react'
import ImageViewerModal from './ImageViewerModal';

import { Button, IconButton, Tooltip, Stack, Box, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CameraswitchIcon from '@mui/icons-material/Cameraswitch';
import DeleteIcon from '@mui/icons-material/Delete';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useSnackbar } from 'notistack';

function MediaCapture({ onClose, onCapture, onDelete, onClear, onSave, allowSave = false, barcode, headerTitle, images: initialImages = [], currentUser, toggleSidebar, hamburgerButtonRef }) {
  const { enqueueSnackbar } = useSnackbar();
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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#222' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 2, backgroundColor: '#333', color: '#fff' }}>
        {currentUser && currentUser.role === 1 && (
          <Tooltip title="Menu">
            <IconButton ref={hamburgerButtonRef} onClick={toggleSidebar} color="inherit">
              <MenuIcon />
            </IconButton>
          </Tooltip>
        )}
        <Typography variant="h6" component="h2" sx={{ margin: 0, fontSize: '1.2rem' }}>{headerTitle || 'Image Capture'}</Typography>
          {mode === 'camera' && (
            <Tooltip title="Close Camera">
              <IconButton onClick={onClose} color="inherit">
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
          )}
      </Box>

      {/* Camera Preview Area */}
      {mode === 'camera' && streamRef.current && (
        <Box sx={{ position: 'relative', width: '100%', flexGrow: 1, overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
          <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Box sx={{ position: 'absolute', width: 20, height: 20, borderTop: '3px solid #fff', borderLeft: '3px solid #fff', top: 0, left: 0 }} />
            <Box sx={{ position: 'absolute', width: 20, height: 20, borderTop: '3px solid #fff', borderRight: '3px solid #fff', top: 0, right: 0 }} />
            <Box sx={{ position: 'absolute', width: 20, height: 20, borderBottom: '3px solid #fff', borderLeft: '3px solid #fff', bottom: 0, left: 0 }} />
            <Box sx={{ position: 'absolute', width: 20, height: 20, borderBottom: '3px solid #fff', borderRight: '3px solid #fff', bottom: 0, right: 0 }} />
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', padding: '10px 15px', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '5px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </Box>
          </Box>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </Box>
      )}

      {/* Info/Error Messages */}
      {error && <Typography color="error" textAlign="center" padding="8px">{error}</Typography>}
      {info && <Typography color="success" textAlign="center" padding="8px">{info}</Typography>}
      {/* Bottom Control Panel */}
      {mode === 'camera' && (

      <Stack direction="row" justifyContent="space-around" alignItems="center" spacing={1} sx={{ width: '100%', padding: 2 }}>
        <Tooltip title="View Gallery">
          <IconButton
            onClick={() => setShowImageViewer(true)}
            color="primary"
            size="large"
            sx={{
              width: 70,
              height: 70,
              borderRadius: '50%',
              border: '2px solid #fff',
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden',
              p: 0,
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
            }}
          >
            {capturedImages.length > 0 ? (
              <img
                src={capturedImages[capturedImages.length - 1].url.startsWith('http') ? capturedImages[capturedImages.length - 1].url : `data:image/jpeg;base64,${capturedImages[capturedImages.length - 1].url}`}
                alt="Last capture"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <PhotoLibraryIcon sx={{ fontSize: 40, color: '#fff' }} />
            )}
          </IconButton>
        </Tooltip>

        <Tooltip title="Capture Photo">
          <IconButton
            onClick={capturePhoto}
            disabled={capturedImages.length >= MAX_IMAGES}
            color="primary"
            size="large"
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              border: '4px solid #fff',
              backgroundColor: '#f44336',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              transition: 'background-color 0.3s ease',
              p: 0,
              '&:hover': { backgroundColor: '#d32f2f' },
            }}
          >
            <CameraAltIcon sx={{ fontSize: 40, color: '#fff' }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Switch Camera (TBD)">
          <IconButton
            onClick={() => enqueueSnackbar('Switch Camera - TBD', { variant: 'info' })}
            color="primary"
            size="large"
            sx={{
              width: 70,
              height: 70,
              borderRadius: '50%',
              border: '2px solid #fff',
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              p: 0,
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
            }}
          >
            <CameraswitchIcon sx={{ fontSize: 40, color: '#fff' }} />
          </IconButton>
        </Tooltip>
      </Stack>
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
        </Box>
      )} */}

      {/* Gallery display / manage captured images */}
      {capturedImages.length > 0 && !mode && (
        <Box sx={{ flexGrow: 1, padding: 2, backgroundColor: '#333', color: '#fff', overflowY: 'auto' }}>
          <Typography variant="h6">Saved Images ({capturedImages.length}/{MAX_IMAGES})</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent:'center', marginBottom:16 }}>
            {capturedImages.map((img, idx) => (
              <Box key={idx} sx={{ position: 'relative' }}>
                <img src={img.url.startsWith('http') ? img.url : `data:image/jpeg;base64,${img.url}`} alt={`Captured-${idx+1}`} style={{ width: 120, height: 90, objectFit:'cover', border: '1px solid #ccc', borderRadius:4 }} />
                <Tooltip title="Delete Image">
                  <IconButton
                    onClick={() => deleteImage(idx)}
                    sx={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      background: 'rgba(255,255,255,0.8)',
                      borderRadius: '50%',
                      border: 'none',
                      cursor: 'pointer',
                      width: 28,
                      height: 28,
                      p: 0,
                      '&:hover': { background: 'rgba(255,255,255,1)' }
                    }}
                    size="small"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Box>
          <Stack direction="row" spacing={1} justifyContent="center" sx={{ marginTop: 2, flexWrap: 'wrap' }}>
            {capturedImages.length < MAX_IMAGES && (
              isMobile ? (
                <Tooltip title="Add Image">
                  <Button
                    variant="contained"
                    onClick={startCamera}
                    startIcon={<AddAPhotoIcon />}
                  >
                    Add Image
                  </Button>
                </Tooltip>
              ) : (
                <>
                  <Tooltip title="Add Camera Image">
                    <Button
                      variant="contained"
                      onClick={startCamera}
                      startIcon={<AddAPhotoIcon />}
                    >
                      Add Camera Image
                    </Button>
                  </Tooltip>
                  <Tooltip title="Add Screen Image">
                    <Button
                      variant="contained"
                      onClick={startScreen}
                      startIcon={<ScreenShareIcon />}
                    >
                      Add Screen Image
                    </Button>
                  </Tooltip>
                </>
              )
            )}
            {onClear && (
              <Tooltip title="Clear All Images">
                <Button
                  variant="outlined"
                  color="error"
                  onClick={clearImages}
                  startIcon={<DeleteForeverIcon />}
                >
                  Clear All
                </Button>
              </Tooltip>
            )}
            {allowSave && (
              <Tooltip title="Save Record">
                <Button
                  variant="contained"
                  color="success"
                  onClick={saveImages}
                  disabled={capturedImages.length === 0}
                  startIcon={<SaveIcon />}
                >
                  Save Record
                </Button>
              </Tooltip>
            )}
            <Tooltip title="Back to Main">
              <Button
                variant="outlined"
                onClick={onClose}
                startIcon={<ArrowBackIcon />}
              >
                Back
              </Button>
            </Tooltip>
          </Stack>
        </Box>
      )}
    </Box>
  )
}

export default MediaCapture

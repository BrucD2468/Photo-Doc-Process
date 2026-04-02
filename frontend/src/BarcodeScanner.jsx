import React, { useState, useRef, useEffect } from 'react'
import Quagga from '@ericblade/quagga2'

function BarcodeScanner({ mode, onDetected, onClose }) {
  const scannerRef = useRef(null) // For camera
  const videoElementRef = useRef(null) // For screen capture (not used in current camera mode but kept for consistency)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Determine if it's a mobile device
  useEffect(() => {
    const userAgent = navigator.userAgent
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) ||
                          (window.innerWidth <= 768 && window.innerHeight <= 1024)
    setIsMobile(isMobileDevice)
  }, [])

  useEffect(() => {
    let active = true // Flag to ensure Quagga.stop() is called only once after detection

    if (mode === 'camera' && scannerRef.current) {
      setLoading(true)
      setError('') // Clear any previous errors

      // Check if on HTTPS (required for camera access)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        setError('Camera access requires HTTPS. Please ensure you are accessing the site over a secure connection.')
        setLoading(false)
        return
      }

      const initQuagga = setTimeout(() => {
        Quagga.init(
          {
            inputStream: {
              type: 'LiveStream',
              target: scannerRef.current,
              constraints: isMobile ? {
                facingMode: 'environment',
                width: { ideal: 640 },
                height: { ideal: 480 },
              } : {
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
            },
            decoder: {
              readers: [
                'ean_reader',
                'code_128_reader',
                'code_39_reader',
                'upc_reader',
                'ean_8_reader',
              ],
            },
            locate: true,
            frequency: 5,
          },
          (err) => {
            if (err) {
              setLoading(false)
              console.error('Camera initialization error:', err)
              
              let errorMessage = 'Camera initialization failed. '

              if (err.name === 'NotAllowedError') {
                errorMessage += 'Camera access denied. Please allow camera permissions and try again.'
              } else if (err.name === 'NotFoundError') {
                errorMessage += 'No camera found. Please connect a camera and try again.'
              } else if (err.name === 'NotReadableError') {
                errorMessage += 'Camera is already in use by another application.'
              } else if (err.name === 'OverconstrainedError') {
                errorMessage += 'Camera does not support the required settings. Try adjusting resolution or aspect ratio.'
              } else if (err.name === 'SecurityError') {
                errorMessage += 'Camera access blocked. Please ensure you are using HTTPS.';
              } else if (err.name === 'AbortError') {
                errorMessage += 'Camera access was interrupted. Please try again.'
              } else {
                errorMessage += `Unexpected error: ${err.message || 'Unknown error'}. Please check browser console for details.`
              }

              setError(errorMessage)
              Quagga.stop() // Stop Quagga and implicitly the stream on error
              return
            }
            Quagga.start()
          }
        )
      }, 100);
          

      const handleDetected = (data) => {
        if (!active) return // Ensure we only process one detection
        const code = data.codeResult.code
        if (code) {
          localStorage.setItem('scannedBarcode', code) // Save to localStorage as per user request
          onDetected(code)
          Quagga.stop()
          active = false // Deactivate after successful detection
        }
      }

      const handleProcessed = (result) => {
        const drawingCtx = Quagga.canvas.ctx.overlay
        const drawingCanvas = Quagga.canvas.dom.overlay
        drawingCanvas.style.display = 'block' // Make sure it is visible

        if (result) {
          if (result.boxes) {
            drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute("width")), parseInt(drawingCanvas.getAttribute("height")))
            result.boxes.filter(box => box !== result.box).forEach(box => {
              Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, { color: "green", lineWidth: 2 })
            })
          }
          if (result.box) {
            Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, { color: "#00F", lineWidth: 2 })
          }
          if (result.codeResult && result.codeResult.code) {
            Quagga.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, drawingCtx, { color: 'red', lineWidth: 3 })
          }
        }
      }

      Quagga.onDetected(handleDetected)
      Quagga.onProcessed(handleProcessed) // Re-add for visual feedback

      return () => {
        clearTimeout(initQuagga); // Clear timeout if component unmounts before init
        active = false // Ensure cleanup if component unmounts during active scanning
        Quagga.offDetected(handleDetected)
        Quagga.offProcessed(handleProcessed)
        Quagga.stop()
      }
    }
    // eslint-disable-next-line
  }, [mode]) // Re-run effect if mode changes


  // Screen capture logic (kept for completeness but not primary focus)
  useEffect(() => {
    let stopped = false
    let processing = false
    if (mode === 'screen' && videoElementRef.current) {
      setLoading(true)
      setError('')

      const startScreenStream = async () => {
        try {
          const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
          if (videoElementRef.current) {
            videoElementRef.current.srcObject = stream
            videoElementRef.current.play()
          }
          stream.getVideoTracks()[0].addEventListener('ended', stopScreenStream)
          autoScanRef.current = requestAnimationFrame(processFrame)
          setLoading(false)
        } catch (err) {
          console.error('Screen capture failed:', err)
          setError('Screen capture cancelled or denied.')
          setLoading(false)
          onClose()
        }
      }

      const stopScreenStream = () => {
        if (videoElementRef.current && videoElementRef.current.srcObject) {
          videoElementRef.current.srcObject.getTracks().forEach(track => track.stop())
          videoElementRef.current.srcObject = null
        }
        stopped = true
        if (autoScanRef.current) cancelAnimationFrame(autoScanRef.current)
        setLoading(false)
        onClose() // Close the modal if screen capture stops
      }

      function processFrame() {
        if (stopped || !videoElementRef.current || processing || videoElementRef.current.readyState < 2) {
          if (!stopped) autoScanRef.current = requestAnimationFrame(processFrame)
          return
        }
        processing = true
        const video = videoElementRef.current
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth || 1280
        canvas.height = video.videoHeight || 720
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = canvas.toDataURL('image/png')
        Quagga.decodeSingle({
          src: imageData,
          numOfWorkers: 0,
          decoder: {
            readers: [
              'ean_reader', 'code_128_reader', 'code_39_reader', 'upc_reader', 'ean_8_reader',
            ],
          },
        }, (result) => {
          if (result && result.codeResult) {
            localStorage.setItem('scannedBarcode', result.codeResult.code)
            onDetected(result.codeResult.code)
            stopped = true
          } else if (!stopped) {
            processing = false
            autoScanRef.current = requestAnimationFrame(processFrame)
          } else {
            processing = false
          }
        })
      }

      startScreenStream()

      return () => {
        stopScreenStream()
      }
    }
    // eslint-disable-next-line
  }, [mode, onDetected, onClose])


  return (
    <div className="barcode-scanner-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Scan Barcode</h2>
          <button onClick={onClose} className="icon-button delete-btn" title="Close">✖️</button>
        </div>
        <div className="modal-body">
          {error && <p className="error" style={{ textAlign: 'center', padding: '10px', color: 'red', backgroundColor: '#ffe6e6', borderRadius: '4px', margin: '10px 0' }}>{error}</p>}
          {loading && <p style={{ textAlign: 'center' }}>Loading Camera...</p>}
          
          {mode === 'camera' && !error && (
            <div className="scanner-container">
              <div ref={scannerRef} className="scanner-view">
                {/* Quagga will insert the video stream here */}
              </div>
              <div className="scan-box">
                <div className="scan-line"></div>
              </div>
            </div>
          )}

          {mode === 'screen' && !error && (
            <video
              ref={videoElementRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                maxWidth: '800px',
                height: '480px',
                border: '3px solid #007bff',
                display: 'block',
                margin: '0 auto 20px auto',
                backgroundColor: '#000',
              }}
            />
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
            {error ? (
              <button onClick={() => {
                setError('')
                setLoading(true)
                // Re-trigger the camera mode effect to re-initialize
                // by changing mode state if needed, or by having an explicit retry mechanism
                // For now, simply closing and reopening the modal will re-trigger
                onClose() // Close to allow re-opening and re-initialization
              }} className="icon-button edit-btn" title="Retry">🔄 Retry</button>
            ) : (
              <p style={{textAlign: 'center', color: '#555'}}>Point your camera at the barcode.</p>
            )}

          </div>


        </div>
      </div>
    </div>
  )
}

export default BarcodeScanner

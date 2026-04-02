import React, { useState, useRef, useEffect } from 'react'
import Quagga from '@ericblade/quagga2'

function BarcodeScanPage({ user, onClose }) {
  const [mode, setMode] = useState(null)
  const [barcode, setBarcode] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)
  const quaggaContainerRef = useRef(null) // for camera
  const videoRef = useRef(null) // for screen
  const streamRef = useRef(null)
  const autoScanRef = useRef(null)
  const [showDebug, setShowDebug] = useState(false)
  const [debugInfo, setDebugInfo] = useState({})

  const collectDebugInfo = () => {
    const info = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      isMobile,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      devicePixelRatio: window.devicePixelRatio,
      hasGetUserMedia: !!navigator.mediaDevices?.getUserMedia,
      hasGetDisplayMedia: !!navigator.mediaDevices?.getDisplayMedia,
      quaggaContainerRefExists: !!quaggaContainerRef.current,
      quaggaElement: quaggaContainerRef.current ? {
        tagName: quaggaContainerRef.current.tagName,
        clientWidth: quaggaContainerRef.current.clientWidth,
        clientHeight: quaggaContainerRef.current.clientHeight,
        offsetWidth: quaggaContainerRef.current.offsetWidth,
        offsetHeight: quaggaContainerRef.current.offsetHeight
      } : null,
      mode,
      error: error || 'None',
      scanning
    }
    setDebugInfo(info)
    return info
  }

  useEffect(() => {
    const userAgent = navigator.userAgent
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) || 
                          (window.innerWidth <= 768 && window.innerHeight <= 1024)
    setIsMobile(isMobileDevice)
    console.log('BarcodeScanPage mobile detection:', { userAgent, isMobileDevice, width: window.innerWidth, height: window.innerHeight })
    const saved = localStorage.getItem('scannedBarcode')
    if (saved) setBarcode(saved)
    return () => stopStream()
    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    let active = true;
    if (mode === 'camera' && quaggaContainerRef.current) {
      setScanning(true)
      Quagga.init(
        {
          inputStream: {
            type: 'LiveStream',
            target: quaggaContainerRef.current,
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
            console.error('Camera initialization error:', err)
            console.error('Error name:', err.name)
            console.error('Error message:', err.message)
            
            // Collect debug info
            const debugData = collectDebugInfo()
            debugData.errorDetails = {
              name: err.name,
              message: err.message,
              stack: err.stack
            }
            setDebugInfo(debugData)
            
            let errorMessage = 'Camera initialization failed. '

            if (err.name === 'NotAllowedError') {
              errorMessage += 'Camera access denied. Please allow camera permissions and try again.'
            } else if (err.name === 'NotFoundError') {
              errorMessage += 'No camera found. Please connect a camera and try again.'
            } else if (err.name === 'NotReadableError') {
              errorMessage += 'Camera is already in use by another application.'
            } else if (err.name === 'OverconstrainedError') {
              errorMessage += 'Camera does not support the required settings.'
            } else if (err.name === 'SecurityError') {
              errorMessage += 'Camera access blocked. Please ensure you\'re using HTTPS.'
            } else if (err.name === 'AbortError') {
              errorMessage += 'Camera access was interrupted. Please try again.'
            } else {
              errorMessage += `Unexpected error: ${err.message || 'Unknown error'}. Please check browser console for details.`
            }

            setError(errorMessage)
            stopStream();
          } else {
            Quagga.start();
          }
        }
      )
      const handleDetected = (data) => {
        if (!active) return
        const code = data.codeResult.code
        if (code) {
          setBarcode(code)
          localStorage.setItem('scannedBarcode', code)
          Quagga.stop()
          active = false
          setMode(null)
          setScanning(false)
        }
      }
      Quagga.onDetected(handleDetected)

      // Drawing boxes
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
      Quagga.onProcessed(handleProcessed)

      return () => {
        active = false
        Quagga.offDetected(handleDetected)
        Quagga.offProcessed(handleProcessed) // Make sure to turn off this listener
        Quagga.stop()
      }
    }
    // eslint-disable-next-line
  }, [mode])

  // Real-time screen scanning logic
  useEffect(() => {
    if (mode !== 'screen' || !videoRef.current) return
    let stopped = false;
    let processing = false;
    setScanning(true)
    function processFrame() {
      if (stopped || barcode || !videoRef.current || processing || videoRef.current.readyState < 2) {
        if (!stopped && !barcode) autoScanRef.current = requestAnimationFrame(processFrame)
        return
      }
      processing = true;
      const video = videoRef.current
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 1920
      canvas.height = video.videoHeight || 1080
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
      const imageDataURL = canvas.toDataURL('image/jpeg', 0.9)
      Quagga.decodeSingle({
        src: imageDataURL,
        numOfWorkers: 0,
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
      }, (result) => {
        if (!stopped && result && result.codeResult && result.codeResult.code) {
          setBarcode(result.codeResult.code)
          localStorage.setItem('scannedBarcode', result.codeResult.code)
          stopStream()
          setScanning(false)
        } else if(!stopped && !barcode) {
          processing = false;
          autoScanRef.current = requestAnimationFrame(processFrame)
        } else {
          processing = false;
        }
      })
    }
    autoScanRef.current = requestAnimationFrame(processFrame)
    return () => {
      stopped = true
      setScanning(false)
      if (autoScanRef.current) cancelAnimationFrame(autoScanRef.current)
    }
    // eslint-disable-next-line
  }, [mode, barcode])

  const startCamera = () => {
    setError('')
    setBarcode('')
    setMode('camera')
    setScanning(true)
  }

  const startScreen = async () => {
    setError('')
    setBarcode('')
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      })
      streamRef.current = stream
      setMode('screen')
      setScanning(true)
      setTimeout(() => {
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
      }, 100)
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopStream()
      })
    } catch (err) {
      setError('Screen capture cancelled or denied')
    }
  }

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setMode(null)
    setScanning(false)
  }

  const clearBarcode = () => {
    setBarcode('')
    localStorage.removeItem('scannedBarcode')
  }

  return (
    <div className="scan-page">
      <div className="info-header">
        <h2>Shipping Photo App</h2>
        <button onClick={onClose}>Back</button>
      </div>
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      {barcode && (
        <div>
          <h3>Barcode Detected!</h3>
          <div className="result">
            <p><strong>Barcode:</strong> {barcode}</p>
          </div>
          <p style={{ color: 'black' }}>
            Barcode saved to temporary storage. Go back to main page and click Save.
          </p>
          <div className="buttons">
            <button onClick={clearBarcode}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '6px'}}>
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Clear Barcode
            </button>
            <button onClick={onClose}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '6px'}}>
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back to Main
            </button>
          </div>
        </div>
      )}
      {!barcode && !mode && (
        <div className="buttons">
          {isMobile ? (
            <button onClick={startCamera}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '8px'}}>
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Camera
            </button>
          ) : (
            <>
              <button onClick={startCamera}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '8px'}}>
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Camera
              </button>
              <button onClick={startScreen}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '8px'}}>
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                  <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" strokeWidth="2"/>
                  <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Screen Capture
              </button>
            </>
          )}
        </div>
      )}
      {!barcode && scanning && mode === 'camera' && (
        <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f5f5f5', minHeight: '80vh' }}>
          <p style={{ marginBottom: '10px', color: '#007bff', fontWeight: 'bold', fontSize: '20px' }}>
            Camera Mode: Point your camera at the barcode. Detection is automatic.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              ref={quaggaContainerRef}
              style={{
                width: '100%',
                maxWidth: '100%',
                height: isMobile ? '50vh' : '480px',
                minHeight: '300px',
                border: '3px solid #007bff',
                backgroundColor: '#000',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            ></div>
            <button onClick={stopStream} style={{ marginTop: 20 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '6px'}}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="m15 9-6 6m0-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Cancel
            </button>
          </div>
        </div>
      )}
      {!barcode && scanning && mode === 'screen' && (
        <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f5f5f5', minHeight: '80vh' }}>
          <p style={{ marginBottom: '10px', color: '#007bff', fontWeight: 'bold', fontSize: '20px' }}>
            Screen Capture Mode: Position the barcode in view. Detection is automatic.
          </p>
          <video
            ref={videoRef}
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
          <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            display: 'flex',
            gap: '10px',
          }}>
            <button
              onClick={stopStream}
              style={{
                fontSize: '18px',
                padding: '20px 40px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showDebug && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '90vw',
            maxHeight: '80vh',
            overflow: 'auto',
            fontSize: '12px'
          }}>
            <h3 style={{ marginTop: 0, color: '#333' }}>Debug Information</h3>
            <div style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
              {Object.entries(debugInfo).map(([key, value]) => (
                <div key={key} style={{ marginBottom: '8px' }}>
                  <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </div>
              ))}
            </div>
            <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
              <button onClick={() => navigator.clipboard?.writeText(JSON.stringify(debugInfo, null, 2))}>
                Copy to Clipboard
              </button>
              <button onClick={() => setShowDebug(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BarcodeScanPage

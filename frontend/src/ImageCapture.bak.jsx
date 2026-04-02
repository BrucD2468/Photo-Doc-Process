import React, { useRef, useEffect, useState } from 'react';

const MediaCapture = ({ barcode, onCapture, onClose, API_URL, user, headerTitle }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState('');

  const setupCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setError('');
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError('Camera access denied or no camera found. Please ensure you have a camera and have granted permission.');
    }
  };

  useEffect(() => {
    setupCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      setError("Video or canvas not ready.");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg');
    onCapture(imageData.split(',')[1]); // Pass base64 data without the prefix
  };

  return (
    <div className="media-capture-modal">
      <div className="modal-header">
        <h2>{headerTitle || 'Capture Image'}</h2>
        <button onClick={onClose} className="close-button">&times;</button>
      </div>
      <div className="modal-content">
        {error && <p className="error-message">{error}</p>}
        <video ref={videoRef} autoPlay playsInline className="camera-feed"></video>
        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
        <button onClick={takePhoto} className="capture-button">Take Photo</button>
      </div>
    </div>
  );
};

export default MediaCapture;

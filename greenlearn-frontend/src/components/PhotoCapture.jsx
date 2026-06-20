import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, RefreshCw, Upload, X } from 'lucide-react';

export default function PhotoCapture({ value, onChange, inputId, label }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const previewUrl = useMemo(() => (value ? URL.createObjectURL(value) : ''), [value]);

  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    stopTracks();
    setCameraOpen(false);
  }, [stopTracks]);

  useEffect(() => () => stopTracks(), [stopTracks]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    if (!cameraOpen || !videoRef.current || !streamRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    videoRef.current.play().catch(() => {});
  }, [cameraOpen]);

  const startCamera = async () => {
    setCameraError('');
    onChange(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Камера недоступна в этом браузере.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      setCameraError('Не получилось открыть камеру.');
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
      onChange(file);
      stopCamera();
    }, 'image/jpeg', 0.92);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    stopCamera();
    setCameraError('');
    onChange(file);
  };

  return (
    <div className="photo-capture">
      {label && <label className="form-label" htmlFor={inputId}>{label}</label>}

      {cameraOpen ? (
        <div className="camera-panel">
          <video ref={videoRef} className="camera-video" autoPlay muted playsInline />
          <div className="photo-capture-actions">
            <button type="button" className="btn btn-primary btn-sm" onClick={capturePhoto}>
              <Camera size={15} /> Снять
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={stopCamera}>
              <X size={15} /> Закрыть
            </button>
          </div>
        </div>
      ) : previewUrl ? (
        <div className="camera-panel">
          <img src={previewUrl} className="camera-preview" alt="preview" />
          <div className="photo-capture-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={startCamera}>
              <RefreshCw size={15} /> Переснять
            </button>
          </div>
        </div>
      ) : null}

      <div className="photo-capture-actions">
        <input
          id={inputId}
          className="visually-hidden"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
        <label className="btn btn-secondary btn-sm" htmlFor={inputId}>
          <Upload size={15} /> Выбрать файл
        </label>
        <button type="button" className="btn btn-secondary btn-sm" onClick={startCamera}>
          <Camera size={15} /> Камера
        </button>
      </div>

      {cameraError && <p className="field-error">{cameraError}</p>}
      <canvas ref={canvasRef} className="visually-hidden" />
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, QrCode } from 'lucide-react';
import type { Event } from '../../store/eventStore';
import { inputClass } from './constants';

interface QrCheckInPanelProps {
  event: Event;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (token: string) => Promise<boolean>;
}

export const QrCheckInPanel = ({ event, isLoading, onClose, onSubmit }: QrCheckInPanelProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const stopCamera = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    frameRef.current = null;
    setCameraActive(false);
  };

  useEffect(() => stopCamera, []);

  const parseToken = (value: string) => {
    const text = value.trim();
    if (!text) return '';
    try {
      const parsed = JSON.parse(text);
      if (parsed.eventId && parsed.eventId !== event.id) {
        setScannerError('Bu QR başka bir etkinliğe ait.');
        return '';
      }
      return String(parsed.token || '').trim();
    } catch {
      return text;
    }
  };

  const submitToken = async (value: string) => {
    const token = parseToken(value);
    if (!token) return;
    const ok = await onSubmit(token);
    if (ok) {
      stopCamera();
      setManualToken('');
    }
  };

  const startCamera = async () => {
    setScannerError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const scan = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const video = videoRef.current;
          if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
            const canvas = canvasRef.current || document.createElement('canvas');
            canvasRef.current = canvas;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d', { willReadFrequently: true });
            if (context) {
              context.drawImage(video, 0, 0, canvas.width, canvas.height);
              const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
              });
              if (code?.data) {
                await submitToken(code.data);
                return;
              }
            }
          }
        } catch {
          setScannerError('QR okunamadı. Kamerayı QR koda biraz daha yaklaştır.');
        }
        frameRef.current = requestAnimationFrame(scan);
      };
      frameRef.current = requestAnimationFrame(scan);
    } catch {
      setScannerError('Kamera açılamadı. Tarayıcı izinlerini kontrol et veya tokenı manuel gir.');
    }
  };

  return (
    <div className="mt-4 rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-black text-white">
            <QrCode className="w-4 h-4 text-emerald-200" />
            QR Katılım Kontrolü
          </div>
          <p className="mt-1 text-xs text-white/45">Kayıtlı öğrencinin kişisel QR biletini okut.</p>
        </div>
        <button type="button" onClick={() => { stopCamera(); onClose(); }} className="rounded-xl px-3 py-2 text-xs font-bold text-white/65 bg-white/[0.06] hover:bg-white/[0.1]">
          Kapat
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/25">
        <video ref={videoRef} className="h-56 w-full object-cover" muted playsInline />
        <canvas ref={canvasRef} className="hidden" />
      </div>
      <button
        type="button"
        onClick={cameraActive ? stopCamera : startCamera}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black text-emerald-100 bg-emerald-500/15 hover:bg-emerald-500/25"
      >
        <Camera className="w-4 h-4" />
        {cameraActive ? 'Kamerayı Durdur' : 'Kamerayı Aç ve Oku'}
      </button>
      {scannerError && <p className="text-xs font-semibold text-amber-100">{scannerError}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
        <input
          value={manualToken}
          onChange={e => setManualToken(e.target.value)}
          className={inputClass}
          placeholder="QR token veya QR içeriği"
        />
        <button
          type="button"
          disabled={isLoading || !manualToken.trim()}
          onClick={() => submitToken(manualToken)}
          className="rounded-2xl px-4 py-3 text-sm font-black text-white gradient-btn disabled:opacity-45"
        >
          Yoklamayı Al
        </button>
      </div>
    </div>
  );
};

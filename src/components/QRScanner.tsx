import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  isOpen: boolean;
}

export default function QRScanner({ onScan, isOpen }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    let activeScanner: Html5Qrcode | null = null;
    let isMounted = true;

    const startScanner = async () => {
      if (!isOpen) return;
      
      setIsInitializing(true);
      setErrorMsg(null);

      try {
        // Short delay to ensure DOM is ready and the reader element is present
        await new Promise((resolve) => setTimeout(resolve, 200));
        if (!isMounted) return;

        const qrReaderElem = document.getElementById("qr-reader");
        if (!qrReaderElem) {
          throw new Error("عنصر قراءة كود الـ QR غير متاح بالصفحة");
        }

        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;
        activeScanner = scanner;

        // Configuration with QR Box size responsive to container limits
        const config = {
          fps: 15,
          qrbox: (width: number, height: number) => {
            const minSize = Math.min(width, height);
            const boxSize = Math.floor(minSize * 0.7);
            return { width: boxSize, height: boxSize };
          },
          aspectRatio: 1.0,
        };

        // Attempting to directly start with environmental back-camera
        await scanner.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            if (isMounted) {
              onScan(decodedText);
            }
          },
          () => {
            // Frame error ignore
          }
        );

        if (isMounted) {
          setIsInitializing(false);
        }
      } catch (err: any) {
        console.warn("Environmental camera initiation failed, trying user camera...", err);
        
        // Let's try user-facing (front) or default camera
        try {
          if (activeScanner && isMounted) {
            await activeScanner.start(
              { facingMode: "user" },
              {
                fps: 15,
                qrbox: { width: 220, height: 220 },
                aspectRatio: 1.0,
              },
              (decodedText) => {
                if (isMounted) {
                  onScan(decodedText);
                }
              },
              () => {}
            );
            if (isMounted) {
              setIsInitializing(false);
              return;
            }
          }
        } catch (fallbackErr: any) {
          console.error("All camera options failed", fallbackErr);
        }

        if (isMounted) {
          setIsInitializing(false);
          setErrorMsg(
            "تم رفض تشغيل الكاميرا أو قد تكون غير متوفرة. تأكد من منح الصلاحيات الكافية للمتصفح."
          );
        }
      }
    };

    if (isOpen) {
      startScanner();
    } else {
      setIsInitializing(false);
      setErrorMsg(null);
    }

    return () => {
      isMounted = false;
      if (activeScanner) {
        if (activeScanner.isScanning) {
          activeScanner.stop()
            .then(() => {
              console.log("Scanner stream release complete");
            })
            .catch((err) => console.error("Error releasing scanner stream:", err));
        }
      }
      scannerRef.current = null;
    };
  }, [isOpen, onScan]);

  return (
    <div className={`mt-4 ${isOpen ? 'block' : 'hidden'} w-full max-w-md mx-auto`}>
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-lg aspect-square flex flex-col items-center justify-center">
        
        {/* The video container */}
        <div id="qr-reader" className="absolute inset-0 w-full h-full object-cover"></div>

        {/* Loading display */}
        {isInitializing && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center text-white z-15 p-6 text-center">
            <RefreshCw className="w-9 h-9 text-indigo-400 animate-spin mb-3" />
            <p className="text-sm font-bold">جاري تنشيط الكاميرا تلقائياً...</p>
            <p className="text-xs text-slate-400 mt-1">يرجى تأكيد إذن الكاميرا للموقع</p>
          </div>
        )}

        {/* Access Or Driver Errors */}
        {errorMsg && (
          <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-rose-200 z-15 p-6 text-center">
            <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
            <p className="text-sm font-bold leading-relaxed">{errorMsg}</p>
            <button 
              type="button"
              onClick={() => {
                // Toggle resize simulation to trigger raw state reload
                window.dispatchEvent(new Event('resize'));
              }}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              تحديث والمحاولة مجدداً
            </button>
          </div>
        )}

        {/* Overlaid QR Scanning Target Sight */}
        {!isInitializing && !errorMsg && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
            {/* Soft dark perimeter */}
            <div className="absolute inset-0 bg-black/45"></div>
            {/* Viewport Box */}
            <div className="w-[220px] h-[220px] bg-transparent rounded-2xl border-4 border-indigo-400 relative shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]">
              {/* Sight angle bracket graphics */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-4 border-l-4 border-white rounded-tl-sm"></div>
              <div className="absolute top-2 right-2 w-4 h-4 border-t-4 border-r-4 border-white rounded-tr-sm"></div>
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-4 border-l-4 border-white rounded-bl-sm"></div>
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-4 border-r-4 border-white rounded-br-sm"></div>
              
              {/* Pulsing red laser tracker indicator */}
              <div className="absolute top-0 left-0 w-full h-[3px] bg-rose-500/90 shadow-[0_0_12px_#ef4444] animate-[bounce_2.2s_infinite]"></div>
            </div>
            
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 text-indigo-300 px-4 py-1.5 rounded-full text-[11px] font-black tracking-tight whitespace-nowrap border border-slate-800 z-20">
              وجّه الكود التلقائي QR للمسح وبدء التحضير
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

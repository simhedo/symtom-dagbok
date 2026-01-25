'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Camera, Scan, Image as ImageIcon, Plus, Trash2, Clock, ChevronUp, ChevronDown } from 'lucide-react';
import { EntryType } from '@/types';

interface ScannedProduct {
  barcode: string;
  name: string;
  brand?: string;
  ingredients: string;
  imageUrl?: string;
}

interface UniversalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: EntryType;
  onSave: (text: string, type: EntryType, timestamp: Date, meta?: { gasLevel?: number; products?: ScannedProduct[]; images?: string[] }) => void;
  selectedDate?: Date;
}

const modalConfig: Record<EntryType, { title: string; placeholder: string; emoji: string }> = {
  FOOD: { title: 'Mat', placeholder: 'Skriv vad du åt eller skanna produkt...', emoji: '🍽️' },
  SYMPTOM: { title: 'Symtom', placeholder: 'Beskriv hur du mår...', emoji: '🩺' },
  EXERCISE: { title: 'Träning', placeholder: 'Vad gjorde du?', emoji: '🏃' },
  MOOD: { title: 'Mående', placeholder: 'Hur känner du dig?', emoji: '😊' },
  MEDICATION: { title: 'Medicin', placeholder: 'Vilken medicin?', emoji: '💊' }
};

export default function UniversalEntryModal({ isOpen, onClose, type, onSave, selectedDate }: UniversalEntryModalProps) {
  const [text, setText] = useState('');
  const [scannedProducts, setScannedProducts] = useState<ScannedProduct[]>([]);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [scanError, setScanError] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [time, setTime] = useState(formatTime(new Date()));
  const [hours, setHours] = useState(new Date().getHours());
  const [minutes, setMinutes] = useState(new Date().getMinutes());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<ScannedProduct | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const config = modalConfig[type];

  // Reset form och sätt tid till "nu" när modal öppnas
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      setHours(now.getHours());
      setMinutes(now.getMinutes());
      setTime(formatTime(now));
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setText('');
      setScannedProducts([]);
      setCapturedImages([]);
      setIsScanning(false);
      setScanError('');
      setPendingProduct(null);
      stopCamera();
    }
  }, [isOpen]);

  // Synka tid med state
  useEffect(() => {
    setTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
  }, [hours, minutes]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setShowCamera(true);
      }
    } catch (err) {
      console.error('Kunde inte starta kamera:', err);
      setScanError('Kunde inte starta kamera. Kontrollera behörigheter.');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImages(prev => [...prev, imageData]);
        stopCamera();
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCapturedImages(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const scanBarcode = async () => {
    setIsScanning(true);
    setScanError('');

    try {
      // Använd Web Barcode Detection API om tillgängligt
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector();
        
        // Starta kamera för skanning
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setShowCamera(true);
          
          // Vänta på att video är redo
          await new Promise(resolve => {
            videoRef.current!.onloadedmetadata = resolve;
          });
          
          // Försök detektera streckkod kontinuerligt
          const detectBarcode = async () => {
            if (!videoRef.current || !isScanning) return;
            
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const barcode = barcodes[0].rawValue;
                await fetchProductData(barcode);
                stopCamera();
                setIsScanning(false);
              } else {
                // Försök igen
                requestAnimationFrame(detectBarcode);
              }
            } catch (err) {
              console.error('Barcode detection error:', err);
              requestAnimationFrame(detectBarcode);
            }
          };
          
          detectBarcode();
        }
      } else {
        // Fallback: Manuell inmatning av streckkod
        const barcode = prompt('Ange streckod manuellt (Barcode Detection API ej tillgänglig):');
        if (barcode) {
          await fetchProductData(barcode);
        }
        setIsScanning(false);
      }
    } catch (err) {
      console.error('Scanning error:', err);
      setScanError('Kunde inte starta streckkodsläsare');
      setIsScanning(false);
    }
  };

  const confirmProduct = () => {
    if (pendingProduct) {
      setScannedProducts(prev => [...prev, pendingProduct]);
      setText(prev => {
        const productText = `${pendingProduct.brand ? pendingProduct.brand + ' ' : ''}${pendingProduct.name}`;
        return prev ? `${prev}, ${productText}` : productText;
      });
      setPendingProduct(null);
    }
  };

  const productCache = new Map<string, ScannedProduct>();

  const fetchProductData = async (barcode: string) => {
    setIsLoadingProduct(true);
    setScanError('');

    try {
      // Kontrollera om produkten redan finns i cachen
      if (productCache.has(barcode)) {
        const cachedProduct = productCache.get(barcode)!;
        setPendingProduct(cachedProduct);
        return;
      }

      const response = await fetch(`/api/product?barcode=${barcode}`);
      
      if (!response.ok) {
        throw new Error('Produkt ej hittad');
      }

      const productData = await response.json();
      
      const product: ScannedProduct = {
        barcode: productData.barcode,
        name: productData.name,
        brand: productData.brand,
        ingredients: productData.ingredients,
        imageUrl: productData.imageUrl
      };

      // Lägg till produkten i cachen
      productCache.set(barcode, product);

      setPendingProduct(product); // Visa produkt för bekräftelse
      
    } catch (err) {
      console.error('Produktdatafel:', err);
      setScanError('Kunde inte hämta produktdata');
    } finally {
      setIsLoadingProduct(false);
    }
  };

  const removeProduct = (index: number) => {
    setScannedProducts(prev => prev.filter((_, i) => i !== index));
  };

  const removeImage = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!text.trim() && scannedProducts.length === 0) return;

    // Kompilera all produktdata till texten
    let finalText = text.trim();
    if (scannedProducts.length > 0) {
      const productTexts = scannedProducts.map(p => 
        `${p.brand ? p.brand + ' ' : ''}${p.name}${p.ingredients ? ` (Ingredienser: ${p.ingredients})` : ''}`
      );
      finalText = finalText 
        ? `${finalText}. Produkter: ${productTexts.join(', ')}` 
        : productTexts.join(', ');
    }

    const meta = {
      products: scannedProducts,
      images: capturedImages
    };

    // Skapa timestamp från vald tid och datum
    const baseDate = selectedDate || new Date();
    const timestamp = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      hours,
      minutes
    );

    onSave(finalText, type, timestamp, meta);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60">
      <div className="bg-gray-900 w-full sm:max-w-lg sm:rounded-2xl max-h-[90vh] overflow-y-auto border-t sm:border border-gray-800">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span>{config.emoji}</span>
            {config.title}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Universal Input Toolbar */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg p-3 flex items-center justify-center gap-2 transition-colors"
              title="Ta bild eller välj från galleri"
            >
              <Camera className="w-5 h-5" />
              <span className="text-sm">Bild</span>
            </button>
            
            {type === 'FOOD' && (
              <button
                onClick={scanBarcode}
                disabled={isScanning || isLoadingProduct}
                className="flex-1 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg p-3 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                title="Skanna streckkod"
              >
                <Scan className="w-5 h-5" />
                <span className="text-sm">
                  {isLoadingProduct ? 'Laddar...' : isScanning ? 'Skannar...' : 'Skanna'}
                </span>
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Error message */}
          {scanError && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-sm text-red-300">
              {scanError}
            </div>
          )}

          {/* Camera view */}
          {showCamera && (
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                <button
                  onClick={capturePhoto}
                  className="bg-white hover:bg-gray-200 text-black rounded-full p-4 transition-colors"
                >
                  <Camera className="w-6 h-6" />
                </button>
                <button
                  onClick={stopCamera}
                  className="bg-gray-800 hover:bg-gray-700 text-white rounded-full p-4 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}

          {/* Captured images */}
          {capturedImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {capturedImages.map((img, i) => (
                <div key={i} className="relative group">
                  <img src={img} alt={`Bild ${i + 1}`} className="w-full h-24 object-cover rounded-lg" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Scanned products */}
          {scannedProducts.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-400">Skannade produkter:</div>
              {scannedProducts.map((product, i) => (
                <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-3 flex items-start gap-3">
                  {product.imageUrl && (
                    <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{product.brand && `${product.brand} - `}{product.name}</div>
                    {product.ingredients && (
                      <div className="text-xs text-gray-400 mt-1 line-clamp-2">{product.ingredients}</div>
                    )}
                  </div>
                  <button
                    onClick={() => removeProduct(i)}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tidshantering */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTimePicker(!showTimePicker)}
              className="flex items-center gap-2 text-gray-400 hover:text-gray-200 bg-gray-800 px-3 py-2 rounded-lg transition-colors border border-gray-700"
            >
              <Clock className="w-4 h-4" />
              <span className="text-sm font-mono">{time}</span>
            </button>
            {showTimePicker && (
              <button
                onClick={() => {
                  const now = new Date();
                  setHours(now.getHours());
                  setMinutes(now.getMinutes());
                }}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Nu
              </button>
            )}
          </div>

          {/* 24h Time Picker */}
          {showTimePicker && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-center gap-4">
                {/* Timmar */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => setHours(h => h === 23 ? 0 : h + 1)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                  >
                    <ChevronUp className="w-5 h-5" />
                  </button>
                  <span className="text-2xl font-mono text-white w-12 text-center py-1">
                    {String(hours).padStart(2, '0')}
                  </span>
                  <button
                    onClick={() => setHours(h => h === 0 ? 23 : h - 1)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </div>
                
                <span className="text-2xl font-mono text-gray-500">:</span>
                
                {/* Minuter */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => setMinutes(m => m === 59 ? 0 : m + 1)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                  >
                    <ChevronUp className="w-5 h-5" />
                  </button>
                  <span className="text-2xl font-mono text-white w-12 text-center py-1">
                    {String(minutes).padStart(2, '0')}
                  </span>
                  <button
                    onClick={() => setMinutes(m => m === 0 ? 59 : m - 1)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Snabbval */}
                <div className="flex flex-col gap-1 ml-4">
                  {[5, 15, 30].map(min => (
                    <button
                      key={min}
                      onClick={() => setMinutes(m => (m + min) % 60)}
                      className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                    >
                      +{min}m
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setShowTimePicker(false)}
                className="w-full mt-3 text-sm text-blue-400 hover:text-blue-300"
              >
                Klar
              </button>
            </div>
          )}

          {/* Bekräftelse för skannad produkt */}
          {pendingProduct && (
            <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
              <p className="text-sm text-green-300 mb-2">Hittad produkt:</p>
              <div className="flex items-start gap-3 mb-3">
                {pendingProduct.imageUrl && (
                  <img src={pendingProduct.imageUrl} alt={pendingProduct.name} className="w-12 h-12 object-cover rounded" />
                )}
                <div>
                  <div className="font-medium text-white">
                    {pendingProduct.brand && `${pendingProduct.brand} - `}{pendingProduct.name}
                  </div>
                  {pendingProduct.ingredients && (
                    <div className="text-xs text-gray-400 mt-1 line-clamp-2">{pendingProduct.ingredients}</div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={confirmProduct}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Lägg till
                </button>
                <button 
                  onClick={() => setPendingProduct(null)}
                  className="px-4 bg-gray-700 hover:bg-gray-600 text-gray-200 py-2 rounded-lg text-sm transition-colors"
                >
                  Avbryt
                </button>
              </div>
            </div>
          )}

          {/* Text input */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={config.placeholder}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gray-600 min-h-[100px] resize-none"
            autoFocus={!showCamera && !isScanning}
          />

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!text.trim() && scannedProducts.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-600 text-white font-medium py-3 rounded-lg transition-colors"
          >
            Spara
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTime(date: Date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

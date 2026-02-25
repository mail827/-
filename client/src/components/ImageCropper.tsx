import { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Check, RotateCcw } from 'lucide-react';

interface Props {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
  aspect?: number;
  originalFile?: File | null;
}

const ASPECT_OPTIONS = [
  { label: '16:9', value: 16 / 9 },
  { label: '4:3', value: 4 / 3 },
  { label: '1:1', value: 1 },
  { label: '자유', value: 0 },
];

function getCenterCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

export default function ImageCropper({ imageSrc, onCropComplete, onCancel, aspect: initialAspect, originalFile }: Props) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(initialAspect);
  const imgRef = useRef<HTMLImageElement>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (aspect) {
      setCrop(getCenterCrop(naturalWidth, naturalHeight, aspect));
    } else {
      setCrop({ unit: '%', x: 5, y: 5, width: 90, height: 90 });
    }
  }, [aspect]);

  const handleAspectChange = (value: number) => {
    if (value === 0) {
      setAspect(undefined);
      setCrop({ unit: '%', x: 5, y: 5, width: 90, height: 90 });
    } else {
      setAspect(value);
      if (imgRef.current) {
        const { naturalWidth, naturalHeight } = imgRef.current;
        setCrop(getCenterCrop(naturalWidth, naturalHeight, value));
      }
    }
  };

  const handleReset = () => {
    if (imgRef.current) {
      const { naturalWidth, naturalHeight } = imgRef.current;
      if (aspect) {
        setCrop(getCenterCrop(naturalWidth, naturalHeight, aspect));
      } else {
        setCrop({ unit: '%', x: 5, y: 5, width: 90, height: 90 });
      }
    }
  };

  const handleConfirm = async () => {
    if (!completedCrop || !imgRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imgRef.current;
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropW = completedCrop.width * scaleX;
    const cropH = completedCrop.height * scaleY;

    canvas.width = cropW;
    canvas.height = cropH;

    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    canvas.toBlob(
      (blob) => {
        if (blob) onCropComplete(blob);
      },
      'image/jpeg',
      0.92
    );
  };

  const handleUseOriginal = () => {
    if (originalFile) onCropComplete(originalFile);
  };

  useEffect(() => {
    setAspect(initialAspect);
  }, [initialAspect]);

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/90 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-700">
        <button onClick={onCancel} className="p-2 text-stone-400 hover:text-stone-100 transition-colors">
          <X className="w-5 h-5" />
        </button>
        <p className="text-stone-200 text-sm font-medium">대표 이미지 크롭</p>
        <div className="flex items-center gap-2">
          {originalFile && (
            <button
              onClick={handleUseOriginal}
              className="px-3 py-1.5 text-xs text-stone-400 hover:text-stone-100 border border-stone-600 rounded-lg hover:border-stone-500 transition-colors"
            >
              원본 그대로
            </button>
          )}
          <button
            onClick={handleConfirm}
            disabled={!completedCrop}
            className="flex items-center gap-1.5 px-4 py-2 bg-stone-100 text-stone-800 text-sm font-medium rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Check className="w-4 h-4" />
            확인
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center overflow-auto p-4">
        <ReactCrop
          crop={crop}
          onChange={(_, pc) => setCrop(pc)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={aspect}
          className="max-h-full"
        >
          <img
            ref={imgRef}
            src={imageSrc}
            onLoad={onImageLoad}
            crossOrigin="anonymous"
            alt="크롭"
            className="max-h-[65vh] max-w-full object-contain block"
          />
        </ReactCrop>
      </div>

      <div className="px-4 py-3 border-t border-stone-700 flex items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          {ASPECT_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => handleAspectChange(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                (opt.value === 0 && !aspect) || (aspect && Math.abs(aspect - opt.value) < 0.01)
                  ? 'bg-stone-100 text-stone-800'
                  : 'bg-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-500 hover:text-stone-200 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          초기화
        </button>
      </div>
    </div>
  );
}

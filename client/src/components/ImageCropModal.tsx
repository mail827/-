import { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Check, RotateCcw, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  file: File;
  onComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

const RATIO_OPTIONS = [
  { label: '1:1', value: 1 },
  { label: '3:4', value: 3 / 4 },
  { label: '4:3', value: 4 / 3 },
  { label: 'FREE', value: 0 },
];

function getCenterCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

export default function ImageCropModal({ file, onComplete, onCancel, aspectRatio }: Props) {
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(aspectRatio || 1);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => setImgSrc(reader.result as string);
    reader.readAsDataURL(file);
  }, [file]);

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

    const maxDim = 2400;
    let outW = cropW;
    let outH = cropH;
    if (outW > maxDim || outH > maxDim) {
      const scale = maxDim / Math.max(outW, outH);
      outW *= scale;
      outH *= scale;
    }

    canvas.width = outW;
    canvas.height = outH;

    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, outW, outH);

    canvas.toBlob(
      (blob) => {
        if (blob) onComplete(blob);
      },
      'image/jpeg',
      0.92
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 flex flex-col"
      >
        <div className="flex items-center justify-between px-4 py-3 bg-black/60">
          <button onClick={onCancel} className="p-2 text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <p className="text-white text-sm font-medium">{file.name}</p>
          <button
            onClick={handleConfirm}
            disabled={!completedCrop}
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-stone-900 text-sm font-medium rounded-lg disabled:opacity-40"
          >
            <Check className="w-4 h-4" />
            <span>완료</span>
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
          {imgSrc && (
            <ReactCrop
              crop={crop}
              onChange={(_, pc) => setCrop(pc)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              className="max-h-full"
            >
              <img
                ref={imgRef}
                src={imgSrc}
                onLoad={onImageLoad}
                className="max-h-[60vh] max-w-full object-contain"
                style={{ display: 'block' }}
              />
            </ReactCrop>
          )}
        </div>

        <div className="px-4 py-4 bg-black/60">
          <div className="flex items-center justify-center gap-2 mb-3">
            {RATIO_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                onClick={() => handleAspectChange(opt.value)}
                className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
                  (opt.value === 0 && !aspect) || (aspect && Math.abs(aspect - opt.value) < 0.01)
                    ? 'bg-white text-stone-900'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                {opt.label === 'FREE' ? <Maximize2 className="w-3.5 h-3.5" /> : opt.label}
              </button>
            ))}
          </div>
          <div className="flex justify-center">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/50 hover:text-white/80"
            >
              <RotateCcw className="w-3 h-3" />
              초기화
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

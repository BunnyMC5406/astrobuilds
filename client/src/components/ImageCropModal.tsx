import { useState } from "react";
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ImageCropModalProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  onCropComplete: (croppedImage: string) => void;
  aspectRatio?: number;
}

export function ImageCropModal({
  open,
  onClose,
  imageUrl,
  onCropComplete,
  aspectRatio = 21 / 9,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 100,
    height: (100 / aspectRatio),
    x: 0,
    y: 0
  });
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
    const cropHeight = (height / width) * 100;
    
    setCrop({
      unit: '%',
      width: 100,
      height: cropHeight > 100 ? 100 : cropHeight,
      x: 0,
      y: 0
    });
    
    setImageRef(e.currentTarget);
  };

  const getCroppedImg = async () => {
    if (!imageRef) return null;

    const canvas = document.createElement('canvas');
    const scaleX = imageRef.naturalWidth / imageRef.width;
    const scaleY = imageRef.naturalHeight / imageRef.height;
    
    const pixelRatio = window.devicePixelRatio;
    canvas.width = Math.floor(crop.width * scaleX);
    canvas.height = Math.floor(crop.height * scaleY);

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = 'high';

    const cropX = crop.x * scaleX;
    const cropY = crop.y * scaleY;

    ctx.drawImage(
      imageRef,
      cropX,
      cropY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );

    return canvas.toDataURL('image/jpeg', 0.95);
  };

  const handleComplete = async () => {
    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg();
      if (croppedImage) {
        onCropComplete(croppedImage);
      }
    } finally {
      setIsProcessing(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>
        <div className="overflow-hidden rounded-lg">
          <ReactCrop
            crop={crop}
            onChange={c => setCrop(c)}
            aspect={aspectRatio}
            className="max-h-[60vh]"
          >
            <img
              src={imageUrl}
              onLoad={onImageLoad}
              alt="Crop preview"
              className="max-w-full h-auto"
            />
          </ReactCrop>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleComplete}
            disabled={isProcessing}
            className="gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing
              </>
            ) : (
              'Apply Crop'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useState } from "react";

interface TouchImageViewerProps {
  src: string;
  alt: string;
}

export default function TouchImageViewer({ src, alt }: TouchImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const handlePanStart = () => {
    setIsPanning(true);
  };

  const handlePanEnd = () => {
    setIsPanning(false);
    // Reset position if scale is 1
    if (scale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handlePan = (event: any, info: PanInfo) => {
    if (scale > 1) {
      setPosition(prev => ({
        x: prev.x + info.delta.x,
        y: prev.y + info.delta.y
      }));
    }
  };

  const handleDoubleTap = () => {
    setScale(prev => (prev === 1 ? 2 : 1));
    if (scale === 2) {
      setPosition({ x: 0, y: 0 });
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden touch-none">
      <AnimatePresence>
        <motion.div
          className="w-full h-full"
          drag={scale > 1}
          dragConstraints={{
            left: -100 * (scale - 1),
            right: 100 * (scale - 1),
            top: -100 * (scale - 1),
            bottom: 100 * (scale - 1)
          }}
          dragElastic={0.1}
          onPanStart={handlePanStart}
          onPan={handlePan}
          onPanEnd={handlePanEnd}
          onTap={handleDoubleTap}
          animate={{
            scale,
            x: position.x,
            y: position.y,
            transition: { type: "spring", stiffness: 300, damping: 30 }
          }}
        >
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover select-none"
            draggable={false}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

import { useEffect, useRef } from 'react';

export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to window size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Create stars with improved properties
    const stars = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 1.5 + 0.5, // More consistent star sizes
      speed: Math.random() * 0.3 + 0.1, // Slower, more controlled speeds
      opacity: Math.random() * 0.5 + 0.3 // Varied opacity for depth
    }));

    // Animation loop with improved clearing
    let animationFrame: number;
    const animate = () => {
      // Clear the entire canvas with higher opacity for less trailing
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      stars.forEach(star => {
        // Draw stars with their individual opacity
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Update star position with wrapping
        star.y = (star.y + star.speed) % canvas.height;

        // Reset opacity when star wraps around
        if (star.y < 1) {
          star.opacity = Math.random() * 0.5 + 0.3;
        }
      });

      animationFrame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ 
        background: 'linear-gradient(to bottom, #000022, #000066)',
        opacity: 0.8 // Slightly reduce overall intensity
      }}
    />
  );
}
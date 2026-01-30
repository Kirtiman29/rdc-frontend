import React, { useState, useEffect, useRef } from 'react';

interface SpotlightProps {
  imageUrl: string;
  zoomLevel?: number;
  magnifierRadius?: number;
}

const SpotlightMagnifier = ({ 
  imageUrl, 
  zoomLevel = 1.8, 
  magnifierRadius = 110 
}: SpotlightProps) => {
  const [isBlurred, setIsBlurred] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsBlurred(false);
    const timer = setTimeout(() => setIsBlurred(true), 3000);
    return () => clearTimeout(timer);
  }, [imageUrl]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div 
      ref={containerRef}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}
      className="relative aspect-square w-full overflow-hidden rounded-sm bg-slate-50 border border-slate-100 select-none shadow-sm"
      onContextMenu={(e) => e.preventDefault()}
    >
      <img
        src={imageUrl}
        alt="Industrial Design"
        draggable={false}
        className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ease-in-out ${
          isBlurred ? 'blur-xl saturate-[0.85]' : 'blur-0'
        }`}
      />

      {isBlurred && isHovering && (
        <div
          className="pointer-events-none absolute inset-0 z-20"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundPosition: `${mousePos.x}% ${mousePos.y}%`,
            backgroundSize: `${zoomLevel * 100}%`,
            backgroundRepeat: 'no-repeat',
            WebkitMaskImage: `radial-gradient(circle ${magnifierRadius}px at ${mousePos.x}% ${mousePos.y}%, black 100%, transparent 100%)`,
            maskImage: `radial-gradient(circle ${magnifierRadius}px at ${mousePos.x}% ${mousePos.y}%, black 100%, transparent 100%)`,
          }}
        />
      )}

      {/* ✅ Increased Watermark Font Size */}
      <div 
        className="pointer-events-none absolute inset-0 z-30 opacity-[0.15]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-family='Arial, sans-serif' font-size='18' font-weight='900' fill='none' stroke='white' stroke-width='0.6' text-anchor='middle' transform='rotate(-35 60 60)'%3ERDC%3C/text%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}
      />
    </div>
  );
};

export default SpotlightMagnifier;
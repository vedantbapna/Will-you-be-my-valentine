type HeartPhotoProps = {
  src: string;
  alt: string;
  size?: number | string;
  scale?: number;
  offsetX?: number;
  offsetY?: number;
  className?: string;
};

export default function HeartPhoto({
  src,
  alt,
  size = "clamp(260px, 28vw, 320px)",
  scale = 1.45,
  offsetX = 0,
  offsetY = -26,
  className
}: HeartPhotoProps) {
  const dimension = typeof size === "number" ? `${size}px` : size;

  return (
    <div className={`heartPhoto ${className ?? ""}`.trim()} style={{ width: dimension }}>
      <svg viewBox="0 0 100 90" role="img" aria-label={alt}>
        <defs>
          <clipPath id="heartClip" clipPathUnits="userSpaceOnUse">
            <path d="M50 84C23 64 8 49 8 32C8 18 19 8 33 8C41 8 47 12 50 20C53 12 59 8 67 8C81 8 92 18 92 32C92 49 77 64 50 84Z" />
          </clipPath>
        </defs>
        <rect width="100" height="90" fill="#fff2f7" clipPath="url(#heartClip)" />
        <g clipPath="url(#heartClip)">
          <image
            href={src}
            x="-10"
            y="-9"
            width="120"
            height="108"
            preserveAspectRatio="xMidYMid slice"
            style={{ transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})` }}
          />
        </g>
        <path
          d="M50 84C23 64 8 49 8 32C8 18 19 8 33 8C41 8 47 12 50 20C53 12 59 8 67 8C81 8 92 18 92 32C92 49 77 64 50 84Z"
          fill="none"
          stroke="rgba(255, 126, 181, 0.7)"
          strokeWidth="3"
        />
      </svg>
      <img src={src} alt={alt} className="heartFallback" />
    </div>
  );
}

import React, { useState } from 'react';

const sizeMap = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-20 h-20',
};

export default function Avatar({ src, name, size = 'md', className = '' }) {
  const [imgError, setImgError] = useState(false);

  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const colorIndex = name
    ? name.charCodeAt(0) % 6
    : 0;

  const bgColors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-green-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-teal-500',
  ];

  return (
    <div
      className={`${sizeMap[size]} rounded-full overflow-hidden flex-shrink-0 ${className}`}
    >
      {src && !imgError ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className={`w-full h-full ${bgColors[colorIndex]} flex items-center justify-center text-white font-semibold`}
          style={{ fontSize: size === 'sm' ? '0.65rem' : size === 'lg' ? '1.1rem' : '0.8rem' }}
        >
          {initials || '?'}
        </div>
      )}
    </div>
  );
}
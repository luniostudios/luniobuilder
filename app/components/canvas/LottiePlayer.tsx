'use client';

import React, { useEffect, useRef } from 'react';

interface LottiePlayerProps {
  src: string;
  autoplay: boolean;
  loop: boolean;
  speed: number;
  style?: React.CSSProperties;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

export const LottiePlayer: React.FC<LottiePlayerProps> = ({ src, autoplay, loop, speed, style, onClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let animation: import('lottie-web').AnimationItem | undefined;

    import('lottie-web').then(({ default: lottie }) => {
      if (cancelled || !containerRef.current) return;
      animation = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop,
        autoplay,
        path: src,
        rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
      });
      animation.setSpeed(Math.min(4, Math.max(0.1, speed)));
    });

    return () => {
      cancelled = true;
      animation?.destroy();
    };
  }, [autoplay, loop, speed, src]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', ...style }} onClick={onClick} />;
};
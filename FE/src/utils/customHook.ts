import { useState, useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import { WaveSurferOptions } from "wavesurfer.js";

export const useHasMounted = () => {
  const [hasMounted, setHasMounted] = useState<boolean>(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted;
};

export const useWavesurfer = (
  containerRef: React.RefObject<HTMLDivElement>,
  options: Omit<WaveSurferOptions, "container">
) => {
  const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  const destroyCurrentWaveSurfer = () => {
    const currentWs = wavesurferRef.current;

    if (currentWs) {
      try {
        currentWs.pause();
      } catch {}

      try {
        currentWs.empty();
      } catch {}

      try {
        currentWs.destroy();
      } catch {}
    }

    wavesurferRef.current = null;
    setWavesurfer(null);

    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    destroyCurrentWaveSurfer();

    const ws = WaveSurfer.create({
      ...options,
      container: containerRef.current,
      backend: "MediaElement",
      mediaControls: false,
      autoplay: false,
      renderFunction: (channels, ctx) => {
        const { width, height } = ctx.canvas;
        const barWidth = options.barWidth || 2;
        const barGap = options.barGap || 1;

        const barCount = Math.floor(width / (barWidth + barGap));
        const step = Math.max(1, Math.floor(channels[0].length / barCount));

        const topPartHeight = height * 0.7;
        const bottomPartHeight = height * 0.3;

        ctx.beginPath();

        for (let i = 0; i < barCount; i++) {
          let sumTop = 0;
          let sumBottom = 0;

          for (let j = 0; j < step; j++) {
            const index = i * step + j;
            const topValue = Math.abs(channels[0][index] || 0);
            const bottomValue = Math.abs(channels[1]?.[index] || 0);

            sumTop += topValue;
            sumBottom += bottomValue;
          }

          const avgTop = sumTop / step;
          const avgBottom = sumBottom / step;
          const barHeight = (avgTop + avgBottom) * 1.2;

          let yTop = topPartHeight - barHeight * topPartHeight;
          let yBottom = topPartHeight + barHeight * bottomPartHeight;

          if (options.barAlign === "top") {
            yTop = 0;
            yBottom = bottomPartHeight;
          } else if (options.barAlign === "bottom") {
            yTop = height - topPartHeight;
            yBottom = height;
          }

          ctx.rect(
            i * (barWidth + barGap),
            yTop,
            barWidth,
            barHeight * topPartHeight
          );

          ctx.rect(
            i * (barWidth + barGap),
            yBottom - barHeight * bottomPartHeight,
            barWidth,
            barHeight * bottomPartHeight
          );
        }

        ctx.fill();
        ctx.closePath();
      },
    });

    wavesurferRef.current = ws;
    setWavesurfer(ws);

    return () => {
      try {
        ws.pause();
      } catch {}

      try {
        ws.empty();
      } catch {}

      try {
        ws.destroy();
      } catch {}

      if (wavesurferRef.current === ws) {
        wavesurferRef.current = null;
      }

      setWavesurfer(null);

      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [containerRef, options]);

  return wavesurfer;
};

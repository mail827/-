import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  duration?: number;
  className?: string;
}

export default function AnimatedNumber({ value, duration = 1500, className }: Props) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            const start = performance.now();
            const from = 0;
            const to = value;
            const tick = (now: number) => {
              const elapsed = now - start;
              const progress = Math.min(elapsed / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              setDisplay(Math.round(from + (to - from) * eased));
              if (progress < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration]);

  useEffect(() => {
    if (started.current) setDisplay(value);
  }, [value]);

  return (
    <span
      ref={ref}
      className={className}
      style={{
        fontFamily: "Pretendard, sans-serif",
        fontSize: "clamp(40px, 6vw, 56px)",
        fontWeight: 300,
        color: "#1a1a1a",
        letterSpacing: "-0.03em",
        fontVariantNumeric: "tabular-nums",
        lineHeight: 1,
      }}
    >
      {display.toLocaleString()}
    </span>
  );
}

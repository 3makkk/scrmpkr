import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { useRoom } from "../../../hooks/useRoom";

function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export default function ConfettiOverlay() {
  const { roomState } = useRoom();
  const hasTriggeredRef = useRef(false);

  const hasConsensus =
    roomState?.currentRoundState?.status === "revealed" &&
    roomState.currentRoundState?.stats?.hasConsensus;

  useEffect(() => {
    if (hasConsensus && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;

      const duration = 2000;
      const speed = 1.5;
      const delay = 0;
      const animationEnd = Date.now() + duration;
      let intervalId: number | undefined;
      let timeoutId: number | undefined;

      const startAnimation = () => {
        intervalId = setInterval(() => {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            if (intervalId) clearInterval(intervalId);
            return;
          }

          // Left side firework
          confetti({
            startVelocity: 30,
            spread: 360,
            ticks: 60,
            zIndex: 0,
            particleCount: 150,
            origin: {
              x: randomInRange(0.1, 0.3),
              y: Math.random() - 0.2,
            },
          });

          // Right side firework
          confetti({
            startVelocity: 30,
            spread: 360,
            ticks: 60,
            zIndex: 0,
            particleCount: 150,
            origin: {
              x: randomInRange(0.7, 0.9),
              y: Math.random() - 0.2,
            },
          });
        }, 800 / speed) as unknown as number;
      };

      if (delay > 0) {
        timeoutId = setTimeout(startAnimation, delay) as unknown as number;
      } else {
        startAnimation();
      }

      return () => {
        if (intervalId) clearInterval(intervalId);
        if (timeoutId) clearTimeout(timeoutId);
      };
    }

    // Reset when round changes
    if (!hasConsensus) {
      hasTriggeredRef.current = false;
    }
  }, [hasConsensus]);

  return null;
}

import Fireworks from "react-canvas-confetti/dist/presets/Fireworks";
import { useRoom } from "../hooks/useRoom";

export default function ConfettiOverlay() {
  const { revealed } = useRoom();

  if (!revealed) return null;

  // Compute consensus
  const hasConsensus = new Set(revealed.map((r) => r.value)).size === 1;

  return (
    hasConsensus && (
      <div
        style={{
          position: "fixed",
          pointerEvents: "none",
          inset: 0,
          zIndex: 50,
        }}
      >
        <Fireworks
          autorun={{ speed: 1.5, duration: 1500, delay: 0 }}
          width={window.innerWidth}
          height={window.innerHeight}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    )
  );
}

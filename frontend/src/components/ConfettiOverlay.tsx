import Fireworks from "react-canvas-confetti/dist/presets/fireworks";
import { useRoom } from "../hooks/useRoom";

export default function ConfettiOverlay() {
  const { roomState } = useRoom();

  const hasConsensus =
    roomState?.currentRoundState?.status === "revealed" &&
    roomState.currentRoundState?.stats?.hasConsensus;

  if (!hasConsensus) return null;

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

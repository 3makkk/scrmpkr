import React from "react";
import { useRoom } from "../hooks/useRoom";
import Card from "./Card";

export default function CountdownTimer() {
  const { countdown } = useRoom();

  if (countdown === null || countdown <= 0) return null;

  return (
    <Card className="text-center">
      <h2 className="text-2xl font-light text-white mb-4">
        Revealing votes in
      </h2>
      <div className="text-6xl font-light text-white">{countdown}</div>
    </Card>
  );
}

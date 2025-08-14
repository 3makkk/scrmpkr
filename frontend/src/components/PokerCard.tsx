import React from "react";

type Value = number | "?";
export default function PokerCard({
  value,
  isSelected,
  onClick,
  disabled = false,
}: { value: Value; isSelected?: boolean; onClick: (value: Value) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onClick(value)}
      disabled={disabled}
      className={`poker-card ${isSelected ? "selected" : ""} ${
        disabled ? "disabled" : ""
      }`}
    >
      {value}
    </button>
  );
}

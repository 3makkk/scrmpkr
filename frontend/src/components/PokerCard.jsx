import React from "react";

export default function PokerCard({
  value,
  isSelected,
  onClick,
  disabled = false,
}) {
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

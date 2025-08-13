import React from "react";

export default function PageLayout({ children, className = "" }) {
  return <div className={`min-h-screen ${className}`}>{children}</div>;
}

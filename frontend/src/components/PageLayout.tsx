import React from "react";

export default function PageLayout({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`min-h-screen ${className}`}>{children}</div>;
}

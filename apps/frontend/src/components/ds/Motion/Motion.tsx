// Animation utilities using Tailwind CSS animations
// These replace the previous Framer Motion variants with pure CSS

export const animationClasses = {
  // Fade animations
  fadeIn: "animate-fade-in-scale",

  // Slide animations
  slideInFromBottom: "animate-fade-in-down",
  slideInFromTop: "animate-fade-in-down",
  slideInFromLeft: "animate-slide-in-left",
  slideInFromRight: "animate-slide-in-right",

  // Scale animations
  scaleIn: "animate-fade-in-scale",
  bounceIn: "animate-bounce-in",

  // Special effects
  rotate: "animate-rotate-in",
  float: "animate-float",
  glowPulse: "animate-glow-pulse",
  shimmer: "animate-shimmer",
} as const;

// Stagger animations can be achieved with CSS custom properties and nth-child
export const staggerDelay = (index: number, baseDelay = 30) => ({
  className: `animation-delay-${index * baseDelay}`,
});

// Legacy exports for backwards compatibility - these are now just type aliases
export const motionVariants = {
  fadeIn: animationClasses.fadeIn,
  slideInFromBottom: animationClasses.slideInFromBottom,
  slideInFromTop: animationClasses.slideInFromTop,
  slideInFromLeft: animationClasses.slideInFromLeft,
  slideInFromRight: animationClasses.slideInFromRight,
  scaleIn: animationClasses.scaleIn,
} as const;

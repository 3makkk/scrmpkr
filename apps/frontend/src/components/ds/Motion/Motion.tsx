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

// Hover and interaction classes using Tailwind
export const interactionClasses = {
  cardHover: "transition-transform duration-200 hover:-translate-y-0.5",
  cardActive: "active:scale-[0.99]",

  buttonHover: "transition-transform duration-150 hover:scale-[1.01]",
  buttonActive: "active:scale-[0.99]",

  scaleOnHover: "transition-transform duration-200 hover:scale-105",
  liftOnHover:
    "transition-all duration-200 hover:-translate-y-1 hover:shadow-xl",
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

export const motionInteractions = interactionClasses;

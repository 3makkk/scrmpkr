import { motion, type HTMLMotionProps, type Variants } from "framer-motion";
import { forwardRef, type ReactNode } from "react";

// Common animation variants for consistent motion across the app
export const motionVariants = {
  // Fade animations
  fadeIn: {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut" as const,
      },
    },
  },

  // Slide animations - more subtle
  slideInFromBottom: {
    hidden: {
      opacity: 0,
      y: 10,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut" as const,
      },
    },
  },

  slideInFromTop: {
    hidden: {
      opacity: 0,
      y: -10,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut" as const,
      },
    },
  },

  slideInFromLeft: {
    hidden: {
      opacity: 0,
      x: -15,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut" as const,
      },
    },
  },

  slideInFromRight: {
    hidden: {
      opacity: 0,
      x: 15,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut" as const,
      },
    },
  },

  // Scale animations - subtle
  scaleIn: {
    hidden: {
      opacity: 0,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.25,
        ease: "easeOut" as const,
      },
    },
  },

  // Stagger animations - reduced timing
  staggerContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
        delayChildren: 0.05,
      },
    },
  },

  staggerItem: {
    hidden: {
      opacity: 0,
      y: 10,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.25,
        ease: "easeOut" as const,
      },
    },
  },
} as const;

// Common hover and tap animations - more subtle
export const motionInteractions = {
  cardHover: {
    y: -2,
    transition: {
      duration: 0.2,
      ease: "easeOut" as const,
    },
  },

  cardTap: {
    scale: 0.99,
    transition: {
      duration: 0.1,
      ease: "easeOut" as const,
    },
  },

  buttonHover: {
    scale: 1.01,
    transition: {
      duration: 0.15,
      ease: "easeOut" as const,
    },
  },

  buttonTap: {
    scale: 0.99,
    transition: {
      duration: 0.1,
      ease: "easeOut" as const,
    },
  },
} as const;

// Motion components for different HTML elements
export const MotionDiv = motion.div;
export const MotionButton = motion.button;
export const MotionSpan = motion.span;
export const MotionSection = motion.section;
export const MotionArticle = motion.article;
export const MotionHeader = motion.header;
export const MotionNav = motion.nav;
export const MotionMain = motion.main;
export const MotionFooter = motion.footer;
export const MotionUl = motion.ul;
export const MotionLi = motion.li;
export const MotionP = motion.p;
export const MotionH1 = motion.h1;
export const MotionH2 = motion.h2;
export const MotionH3 = motion.h3;

// Generic Motion component with forwarded ref
interface MotionProps extends HTMLMotionProps<"div"> {
  children?: ReactNode;
}

export const Motion = forwardRef<HTMLDivElement, MotionProps>(
  ({ children, ...props }, ref) => (
    <motion.div ref={ref} {...props}>
      {children}
    </motion.div>
  ),
);

Motion.displayName = "Motion";

export default Motion;

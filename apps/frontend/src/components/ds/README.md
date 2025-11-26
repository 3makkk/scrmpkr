# Design System Motion Components

This document describes the motion-enabled Design System components that have been enhanced with Framer Motion animations.

## Overview

All DS components now support motion capabilities through a unified API. This ensures consistent animations across the application while maintaining flexibility for custom motion behaviors.

## Motion-Enabled Components

### Core Components

1. **Button** - Enhanced with hover, tap, and configurable motion states
2. **Card** - Default slide-in animation with customizable motion props
3. **PokerCard** - Interactive card animations with selection states
4. **Badge** - Scale-in animation with motion support

### Motion Props Interface

All motion-enabled components support these optional props:

```typescript
interface MotionProps {
  animate?: Target;
  initial?: Target;
  exit?: Target;
  transition?: Transition;
  variants?: Variants;
  whileHover?: Target;
  whileTap?: Target;
  whileFocus?: Target;
  whileInView?: Target;
  layout?: boolean | "position" | "size";
  layoutId?: string;
  enableMotion?: boolean; // Disable motion if needed
}
```

## Motion Variants Library

### Available Variants (`motionVariants`)

- `fadeIn` - Simple opacity and scale fade-in
- `slideInFromBottom` - Slide up with scale
- `slideInFromTop` - Slide down with scale
- `slideInFromLeft` - Slide right with scale
- `slideInFromRight` - Slide left with scale
- `scaleIn` - Scale up with back easing
- `staggerContainer` - Container for staggered children
- `staggerItem` - Individual staggered item

### Interaction Variants (`motionInteractions`)

- `cardHover` - Standard card hover effect
- `cardTap` - Standard card tap effect
- `buttonHover` - Button hover animation
- `buttonTap` - Button tap animation

## Usage Examples

### Basic Component with Motion

```tsx
import Card from "./ds/Card/Card";

<Card
  variants={motionVariants.slideInFromBottom}
  initial="hidden"
  animate="visible"
>
  Content here
</Card>;
```

### Custom Motion Props

```tsx
import Button from "./ds/Button/Button";

<Button
  whileHover={{ scale: 1.1 }}
  whileTap={{ scale: 0.9 }}
  transition={{ duration: 0.2 }}
>
  Custom Button
</Button>;
```

### Disabling Motion

```tsx
<Card enableMotion={false}>Static content without animations</Card>
```

### Staggered Animations

```tsx
import { motionVariants } from "./ds/Motion/Motion";

<motion.div
  variants={motionVariants.staggerContainer}
  initial="hidden"
  animate="visible"
>
  {items.map((item) => (
    <motion.div key={item.id} variants={motionVariants.staggerItem}>
      <Card enableMotion={false}>{item.content}</Card>
    </motion.div>
  ))}
</motion.div>;
```

## Migration Benefits

1. **Consistency** - Unified motion language across all components
2. **Performance** - Optimized animations using Framer Motion
3. **Flexibility** - Easy to override default animations
4. **Accessibility** - Respects `prefers-reduced-motion`
5. **Developer Experience** - Type-safe motion props
6. **Maintainability** - Centralized animation definitions

## Best Practices

1. Use the predefined `motionVariants` for consistency
2. Set `enableMotion={false}` when handling motion at a parent level
3. Prefer `variants` over inline animation objects for reusability
4. Use `layoutId` for shared element transitions
5. Consider performance impact of complex animations on low-end devices

## Future Enhancements

- Add more sophisticated transition patterns
- Implement shared element transitions between pages
- Add scroll-triggered animations
- Create specialized motion components for data visualization
- Add sound feedback integration for accessibility

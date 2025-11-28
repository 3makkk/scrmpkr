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

## New Design System Components

### UserAvatar

A reusable avatar component that displays user initials with role-based coloring.

**Props:**

- `name`: User's display name
- `role`: User's role (affects color)
- `size`: "sm" | "md" | "lg" (default: "md")
- `showTooltip`: Whether to show name and role in tooltip (default: false)
- `interactive`: Whether the avatar is clickable (default: false)

```tsx
<UserAvatar
  name="John Doe"
  role={UserRole.PARTICIPANT}
  size="md"
  interactive
  showTooltip
/>
```

### Dropdown

A dropdown menu component with controlled or uncontrolled state management.

**Props:**

- `trigger`: React node that triggers the dropdown
- `open`: Controlled open state (optional)
- `onOpenChange`: Callback when open state changes
- `placement`: "bottom-left" | "bottom-right" | "top-left" | "top-right" (default: "bottom-right")

**Features:**

- Click outside to close
- Escape key to close
- Smooth animations

```tsx
<Dropdown trigger={<button>Open Menu</button>} placement="bottom-right">
  <div className="p-4">Menu content here</div>
</Dropdown>
```

### Modal

A modal overlay component for displaying content above the main interface.

**Props:**

- `open`: Whether the modal is open
- `onClose`: Callback when the modal should close
- `closeOnEscape`: Whether to close on Escape key (default: true)
- `closeOnBackdrop`: Whether to close when clicking backdrop (default: true)

**Features:**

- Backdrop click to close (configurable)
- Escape key to close (configurable)
- Focus management
- Smooth animations

```tsx
<Modal open={isOpen} onClose={() => setIsOpen(false)}>
  <Card>Modal content here</Card>
</Modal>
```

## Component Architecture Principles

- **Composition over Configuration**: Components favor children composition over complex props
- **Type Safety**: All components use `UIProps<Tag, Extra>` to ensure they support standard HTML attributes
- **Accessibility**: Components include proper keyboard navigation and ARIA support where appropriate
- **Consistent Styling**: All styling uses inline Tailwind classes (no custom CSS classes or @apply)

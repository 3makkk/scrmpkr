import { useState, useRef, useEffect, useCallback, forwardRef } from "react";
import clsx from "clsx";
import type { UIProps } from "../uiTypes";

/**
 * Props that are passed to the trigger render function
 */
type TriggerProps = {
  /** Click handler that toggles the dropdown */
  onClick: () => void;
  /** Whether the dropdown is currently open */
  isOpen: boolean;
  /** Additional className for positioning (contains 'relative') */
  className?: string;
};

/**
 * Props for the Dropdown component
 */
type DropdownProps = UIProps<
  "div",
  {
    /** Render function for the trigger element. Receives trigger props to handle dropdown state */
    trigger: (props: TriggerProps) => React.ReactNode;
    /** Controlled open state. When provided, component becomes controlled */
    open?: boolean;
    /** Callback fired when the open state should change */
    onOpenChange?: (open: boolean) => void;
    /**
     * Position of the dropdown relative to the trigger element.
     * - `bottom-left` / `bottom-start`: Below trigger, left edges aligned
     * - `bottom-right` / `bottom-end`: Below trigger, right edges aligned
     * - `bottom-center`: Below trigger, centered
     * - `top-left` / `top-start`: Above trigger, left edges aligned
     * - `top-right` / `top-end`: Above trigger, right edges aligned
     * - `top-center`: Above trigger, centered
     */
    placement?:
      | "bottom-left"
      | "bottom-right"
      | "top-left"
      | "top-right"
      | "bottom-start"
      | "bottom-end"
      | "top-start"
      | "top-end"
      | "bottom-center"
      | "top-center";
  }
>;

/**
 * A dropdown menu component that displays content when triggered.
 *
 * Features:
 * - Click outside to close
 * - Escape key to close
 * - Smooth animations
 * - Multiple placement options
 * - Controlled and uncontrolled modes
 * - Positioned relative to the trigger element
 *
 * @example
 * ```tsx
 * <Dropdown
 *   trigger={({ onClick, isOpen, className }) => (
 *     <Button onClick={onClick} className={className}>
 *       Open Menu {isOpen ? '▲' : '▼'}
 *     </Button>
 *   )}
 *   placement="bottom-start"
 * >
 *   <div className="p-4">
 *     <button>Menu Item 1</button>
 *     <button>Menu Item 2</button>
 *   </div>
 * </Dropdown>
 * ```
 */
const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(
  (
    {
      children,
      trigger,
      open: controlledOpen,
      onOpenChange,
      placement = "bottom-right",
      className,
      ...props
    },
    ref
  ) => {
    const [internalOpen, setInternalOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const isControlled = controlledOpen !== undefined;
    const isOpen = isControlled ? controlledOpen : internalOpen;

    const handleToggle = () => {
      const newOpen = !isOpen;
      if (isControlled) {
        onOpenChange?.(newOpen);
      } else {
        setInternalOpen(newOpen);
      }
    };

    const handleClose = useCallback(() => {
      if (isControlled) {
        onOpenChange?.(false);
      } else {
        setInternalOpen(false);
      }
    }, [isControlled, onOpenChange]);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        if (containerRef.current && !containerRef.current.contains(target)) {
          handleClose();
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
          document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [isOpen, handleClose]);

    // Close dropdown when escape is pressed
    useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          handleClose();
        }
      };

      if (isOpen) {
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
      }
    }, [isOpen, handleClose]);

    const getPlacementClasses = () => {
      switch (placement) {
        // Original placement options (edge-aligned)
        case "bottom-left":
          return "left-0 top-full mt-2";
        case "bottom-right":
          return "right-0 top-full mt-2";
        case "top-left":
          return "left-0 bottom-full mb-2";
        case "top-right":
          return "right-0 bottom-full mb-2";

        // More intuitive placement options (directional)
        case "bottom-start":
          return "left-0 top-full mt-2";
        case "bottom-end":
          return "right-0 top-full mt-2";
        case "top-start":
          return "left-0 bottom-full mb-2";
        case "top-end":
          return "right-0 bottom-full mb-2";

        // Centered options
        case "bottom-center":
          return "left-1/2 transform -translate-x-1/2 top-full mt-2";
        case "top-center":
          return "left-1/2 transform -translate-x-1/2 bottom-full mb-2";

        default:
          return "right-0 top-full mt-2";
      }
    };

    // Combine external ref with internal ref
    const combinedRef = (node: HTMLDivElement | null) => {
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
      if (containerRef.current !== node) {
        containerRef.current = node;
      }
    };

    return (
      <div
        ref={combinedRef}
        className={clsx("relative inline-block", className)}
        {...props}
      >
        {/* Trigger */}
        <div className="relative">
          {trigger({
            onClick: handleToggle,
            isOpen,
            className: "relative",
          })}

          {/* Dropdown Menu positioned relative to trigger */}
          {isOpen && (
            <div
              ref={menuRef}
              className={clsx(
                "absolute rounded-lg border border-gray-700 bg-gray-800",
                "z-50 animate-fade-in-scale shadow-lg",
                getPlacementClasses()
              )}
            >
              {children}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Dropdown.displayName = "Dropdown";

export default Dropdown;

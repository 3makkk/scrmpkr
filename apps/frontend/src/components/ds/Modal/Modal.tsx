import { forwardRef, useEffect, useRef } from "react";
import type { UIProps } from "../uiTypes";

type ModalProps = UIProps<
  "dialog",
  {
    open: boolean;
    onClose?: () => void;
    closeOnEscape?: boolean;
    closeOnBackdrop?: boolean;
  }
>;

const Modal = forwardRef<HTMLDialogElement, ModalProps>(
  (
    {
      children,
      open,
      onClose,
      closeOnEscape = true,
      closeOnBackdrop = true,
      className = "",
      onClick,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const dialogRef = useRef<HTMLDialogElement>(null);

    // Combine external ref with internal ref
    const combinedRef = (node: HTMLDialogElement | null) => {
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
      if (dialogRef.current !== node) {
        dialogRef.current = node;
      }
    };

    // Handle dialog open/close state
    useEffect(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;

      if (open && !dialog.open) {
        dialog.showModal();
      } else if (!open && dialog.open) {
        dialog.close();
      }
    }, [open]);

    // Handle dialog events
    useEffect(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;

      const handleCancel = (event: Event) => {
        if (!closeOnEscape) {
          event.preventDefault();
          return;
        }
        onClose?.();
      };

      const handleClose = () => {
        onClose?.();
      };

      const handleClick = (event: MouseEvent) => {
        if (!closeOnBackdrop) return;

        // Check if click is on the backdrop (dialog element itself)
        const rect = dialog.getBoundingClientRect();
        const isClickOnBackdrop =
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom;

        if (isClickOnBackdrop) {
          onClose?.();
        }
      };

      dialog.addEventListener("cancel", handleCancel);
      dialog.addEventListener("close", handleClose);
      dialog.addEventListener("click", handleClick);

      return () => {
        dialog.removeEventListener("cancel", handleCancel);
        dialog.removeEventListener("close", handleClose);
        dialog.removeEventListener("click", handleClick);
      };
    }, [onClose, closeOnEscape, closeOnBackdrop]);

    const dataTestId = (props as Record<string, unknown>)["data-testid"] as
      | string
      | undefined;

    if (!open) return null;

    return (
      <dialog
        ref={combinedRef}
        data-testid={dataTestId}
        className="backdrop:bg-black/50 bg-transparent border-none outline-none p-4 max-w-none max-h-none w-full h-full flex items-center justify-center animate-fade-in-scale"
      >
        {children}
      </dialog>
    );
  },
);

Modal.displayName = "Modal";

export default Modal;

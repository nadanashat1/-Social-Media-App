import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared modal accessibility behavior:
 * - focuses the dialog when it opens and restores focus on close
 * - keeps Tab / Shift+Tab cycling inside the dialog (focus trap)
 * - closes on Escape unless closing is disabled (e.g. while submitting)
 *
 * @param {boolean} isOpen
 * @param {() => void} onClose
 * @param {{ disableClose?: boolean }} [options]
 * @returns {import('react').RefObject<HTMLElement|null>} ref to attach to the dialog element
 */
export default function useModalA11y(isOpen, onClose, { disableClose = false } = {}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const container = containerRef.current;
    if (!container) return undefined;

    const previouslyFocused = document.activeElement;

    const focusables = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
    if (focusables.length > 0) {
      focusables[0].focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (!disableClose) {
          e.stopPropagation();
          onClose?.();
        }
        return;
      }
      if (e.key !== 'Tab') return;

      const items = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || !container.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !container.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, [isOpen, onClose, disableClose]);

  return containerRef;
}

import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * Global keyboard shortcuts:
 *   Cmd/Ctrl + K  →  /search
 *   Cmd/Ctrl + N  →  /properties/new
 *   /             →  /search  (when not in an input)
 *   ?             →  show shortcuts dialog (dispatches custom event)
 */
export function useKeyboardShortcuts() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    function isEditableTarget(el: EventTarget | null) {
      if (!el) return false;
      const tag = (el as HTMLElement).tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (el as HTMLElement).isContentEditable
      );
    }

    function onKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + K → search
      if (meta && e.key === "k") {
        e.preventDefault();
        setLocation("/search");
        return;
      }

      // Cmd/Ctrl + N → new property
      if (meta && e.key === "n") {
        e.preventDefault();
        setLocation("/properties/new");
        return;
      }

      // "/" → search (only when not in an input)
      if (e.key === "/" && !isEditableTarget(e.target)) {
        e.preventDefault();
        setLocation("/search");
        return;
      }

      // "?" → show shortcuts overlay
      if (e.key === "?" && !isEditableTarget(e.target)) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("aqar:shortcuts-help"));
        return;
      }

      // "g h" → home (dashboard) — two-key chord not implemented; keeping simple
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setLocation]);
}

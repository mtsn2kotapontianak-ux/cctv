"use client";

import { useEffect } from "react";

function isRawBrowserEvent(value: unknown) {
  return typeof Event !== "undefined" && value instanceof Event;
}

export function RuntimeEventGuard() {
  useEffect(() => {
    function handleWindowError(event: ErrorEvent) {
      if (isRawBrowserEvent(event.error) || event.message === "[object Event]") {
        event.preventDefault();
      }
    }

    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      if (isRawBrowserEvent(event.reason) || String(event.reason) === "[object Event]") {
        event.preventDefault();
      }
    }

    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}

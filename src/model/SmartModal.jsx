import React, { useEffect } from "react";
import { createPortal } from "react-dom";

export function SmartModal({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return;

    const handleKey = e => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  );
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};

const modalStyle = {
  background: "#fff",
  padding: "1rem",
  borderRadius: "8px",
  minWidth: "300px"
};

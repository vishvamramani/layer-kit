import React, { useState } from "react";
import { SmartModal } from "./SmartModal";

export default {
  title: "LayerKit/SmartModal",
  component: SmartModal,
};

export const Default = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open Modal</button>
      <SmartModal open={open} onClose={() => setOpen(false)}>
        Hello from LayerKit
      </SmartModal>
    </>
  );
};

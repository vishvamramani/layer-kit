"use client";

import Image from "next/image";
import React from "react";
import { Drag } from "@/DockPanel/Drag";
export default function Home() {
  return (
    <>
      <div style={{ padding: "50px" }}>
        <Drag
          
        >
          <div className="w-32 h-32 bg-orange-500 text-white flex items-center justify-center">
            Drag & log state
          </div>
        </Drag>
      </div>
    </>
  );
}

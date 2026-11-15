import React from "react";
import { createRoot } from "react-dom/client";
import "./globals.css";
import Orchestra from "../components/Orchestra";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Orchestra />
  </React.StrictMode>,
);

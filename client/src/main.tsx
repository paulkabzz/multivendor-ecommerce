import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@src/index.css";
import App from "@src/app";
import { BrowserRouter } from "react-router";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@src/index.css";
import App from "@src/App";
import { BrowserRouter } from "react-router";
import { Provider } from "react-redux";
import { store } from "@src/store";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);

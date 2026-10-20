import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./i18n/index.js";
import "./index.css";
import { SettingsProvider } from "./context/SettingsContext";
import {
  SmoothScrollProvider,
  SitePreloader,
  CustomCursor,
} from "./components/animations";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <SmoothScrollProvider>
        <SitePreloader>
          <CustomCursor />
          <SettingsProvider>
            <App />
          </SettingsProvider>
        </SitePreloader>
      </SmoothScrollProvider>
    </BrowserRouter>
  </React.StrictMode>
);

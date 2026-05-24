import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.js";
import { LocaleProvider } from "./locale.js"; // .tsx compiles to .js
import { ToastProvider } from "./components/Toast.js";
import "./styles/app.css";
import "./styles/light.css";

// Apply saved theme
const savedTheme = localStorage.getItem("reasonix-theme") || "dark";
document.documentElement.setAttribute("data-theme", savedTheme);
document.documentElement.lang = localStorage.getItem("reasonix-locale") || "zh";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LocaleProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </LocaleProvider>
  </React.StrictMode>,
);

import React from "react";
import ReactDOM from "react-dom/client";

import "./App.css";
import App from "./src/app/App";


const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register SW in both DEV and PROD so Web Push can work locally.
// (Previously DEV unregistered all SWs, which left "Enable notifications" hanging.)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log("Service Worker registered:", registration.scope);
      })
      .catch((err) => {
        console.error("Service Worker registration failed:", err);
      });
  });
}

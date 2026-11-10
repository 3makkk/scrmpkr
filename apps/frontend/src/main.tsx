import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import * as Sentry from "@sentry/react";
import React from "react";

Sentry.init({
  dsn: "https://6f2afb7439faac05535aa70414c9462e@o4510325216575488.ingest.de.sentry.io/4510325224177744",
  // Preserve automatic user info collection (including IP addresses) in Sentry 11.
  dataCollection: { userInfo: true },
  integrations: [Sentry.browserTracingIntegration()],
  // Tracing
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

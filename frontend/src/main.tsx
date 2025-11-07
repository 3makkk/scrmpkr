import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import React from "react";
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://6f2afb7439faac05535aa70414c9462e@o4510325216575488.ingest.de.sentry.io/4510325224177744",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  integrations: [Sentry.browserTracingIntegration()],
  // Tracing
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
  // Enable logs to be sent to Sentry
  enableLogs: true,
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

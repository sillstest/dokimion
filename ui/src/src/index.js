import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import ErrorBoundary from "./common/ErrorBoundary";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "semantic-ui-css/components/checkbox.min.css";
import "jquery/dist/jquery.min.js";
import "bootstrap/dist/js/bootstrap.min.js";
import "prismjs/prism.js";
import "prismjs/themes/prism.css";
import "react-date-picker/dist/DatePicker.css";
import "react-calendar/dist/Calendar.css";

import App from "./App";

const root = createRoot(document.getElementById("root"));
// NOTE: Do NOT wrap in <React.StrictMode>. In development it double-mounts every
// component (mount → unmount → remount), which breaks TinyMCE's <Editor>: the first
// editor's iframe isn't fully torn down, leaving orphaned/duplicate iframes and stale
// editor instance refs. That shifts iframe ordering (WriteToIframe targets the wrong
// frame, so step editors come up empty) and can make step saves silently fail.
root.render(
  <HelmetProvider>
    <BrowserRouter>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </HelmetProvider>,
);

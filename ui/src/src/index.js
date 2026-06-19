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
// React 18 upgrade — Phase 6.1 decision: StrictMode is intentionally DISABLED (final).
//
// In development StrictMode double-mounts every component (mount → unmount → remount),
// which breaks TinyMCE's <Editor>: the first editor's iframe isn't fully torn down,
// leaving orphaned/duplicate iframes and stale editor instance refs. That shifts iframe
// ordering (WriteToIframe targets the wrong frame, so step editors come up empty) and can
// make step saves silently fail — i.e. it regresses the test-case step editor.
//
// This is a known @tinymce/tinymce-react teardown limitation, not cleanly fixable here.
// Note: the double-invoke only happens in `yarn start` (dev); production builds render once,
// and the Selenium suite runs against a built/deployed app — so prod and tests are unaffected
// either way. The dev-only bug-detection benefit does not justify breaking the editor in dev.
// Do NOT re-enable without first making the TinyMCE editors StrictMode-safe.
root.render(
  <HelmetProvider>
    <BrowserRouter>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </HelmetProvider>,
);

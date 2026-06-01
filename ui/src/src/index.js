import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import ErrorBoundary from "./common/ErrorBoundary";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "semantic-ui-css/components/checkbox.min.css";
import "jquery/dist/jquery.min.js";
import "bootstrap/dist/js/bootstrap.min.js";
import "prismjs/prism.js";
import "prismjs/themes/prism.css";

import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </BrowserRouter>,
);

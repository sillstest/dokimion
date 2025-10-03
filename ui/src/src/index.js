import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import ErrorBoundary from "./common/ErrorBoundary";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "jquery/dist/jquery.min.js";
import "bootstrap/dist/js/bootstrap.min.js";
import "prismjs/prism.js";
import "prismjs/themes/prism.css";

import App from "./App";
import registerServiceWorker from "./registerServiceWorker";

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
);
registerServiceWorker();

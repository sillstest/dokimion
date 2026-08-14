import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";

// React 19 removed ReactDOM.render/unmountComponentAtNode; this uses the createRoot API.
// App must be wrapped in the same providers index.js supplies — Header/Main/Footer consume
// router and Helmet context, so a bare <App /> throws.
it("renders without crashing", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      <HelmetProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </HelmetProvider>,
    );
  });

  await act(async () => {
    root.unmount();
  });
  container.remove();
});

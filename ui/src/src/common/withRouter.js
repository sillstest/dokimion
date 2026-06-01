import React from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";

// Compatibility shim: provides React Router v4-shaped props (history, match, location)
// to class components via React Router v6 hooks, so class components need no changes.
export function withRouter(Component) {
  function ComponentWithRouterProp(props) {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();

    const history = {
      push: (path, state) => navigate(path, { state }),
      replace: (path, state) => navigate(path, { replace: true, state }),
      goBack: () => navigate(-1),
    };

    return <Component {...props} navigate={navigate} location={location} match={{ params }} history={history} />;
  }
  ComponentWithRouterProp.displayName = `withRouter(${Component.displayName || Component.name || "Component"})`;
  return ComponentWithRouterProp;
}

export default withRouter;

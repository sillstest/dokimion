import React, { useEffect } from "react";
import { withRouter } from "../common/withRouter";
import Backend from "../services/backend";

function IdpAuth({ location, onSessionChange }) {
  useEffect(() => {
    Backend.get("user/auth?" + location.search.substring(1))
      .then(response => {
        if (onSessionChange) onSessionChange(response);
        if (response.metainfo && response.metainfo.organizationsEnabled) {
          window.location = "/orgselect";
        } else {
          window.location = "/";
        }
      })
      .catch(() => {
        window.location = "/auth";
      });
  }, []);

  return <div></div>;
}

export default withRouter(IdpAuth);

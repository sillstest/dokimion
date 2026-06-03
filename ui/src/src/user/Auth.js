import React, { useEffect } from "react";
import { withRouter } from "../common/withRouter";
import qs from "qs";
import Backend from "../services/backend";

function Auth({ location }) {
  useEffect(() => {
    const params = qs.parse(location.search.substring(1));
    Backend.get("user/login-redirect")
      .then(response => {
        let url = response.url || "/login";
        let retpath = params.retpath || "";
        if (!response.strictUrl) {
          const retpathParamName = response.retpathParamName || "retpath";
          if (
            retpath.startsWith(window.location.origin + "/auth") ||
            retpath.startsWith(window.location.origin + "/login")
          ) {
            retpath = "/";
          }
          url = url + "?" + retpathParamName + "=" + encodeURIComponent(retpath);
        }
        window.location = url;
      })
      .catch(error => console.log(error));
  }, []);

  return <div></div>;
}

export default withRouter(Auth);

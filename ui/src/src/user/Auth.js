import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import qs from "qs";
import Backend from "../services/backend";

const Auth = () => {
  const location = useLocation();
  const navigate = useNavigate();

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
  }, [location.search]); // Re-run if search params change

  return <div></div>;
};

export default Auth;

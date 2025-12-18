import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Backend from "../services/backend";

const IdpAuth = ({ onSessionChange }) => {
  const location = useLocation();

  useEffect(() => {
    Backend.get("user/auth?" + location.search.substring(1))
      .then(response => {
        if (onSessionChange) {
          onSessionChange(response);
        }
        if (response.metainfo && response.metainfo.organizationsEnabled) {
          window.location = "/orgselect";
        } else {
          window.location = "/";
        }
      })
      .catch(error => {
        window.location = "/auth";
      });
  }, [location.search, onSessionChange]);

  return <div></div>;
};

export default IdpAuth;

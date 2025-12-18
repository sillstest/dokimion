import React, { useEffect } from "react";
import backend from "../services/backend";

function Redirect({ requestUrl }) {
  useEffect(() => {
    backend
      .get(requestUrl)
      .then(response => {
        window.location = response.url;
      })
      .catch(error => console.log(error));
  }, [requestUrl]);

  return <div></div>;
}

export default Redirect;

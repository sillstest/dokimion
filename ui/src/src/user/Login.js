import React, { useState } from "react";
import { withRouter } from "../common/withRouter";
import qs from "qs";
import Backend from "../services/backend";
import { LinkButtons, forgotButton } from "./components";
import ControlledPopup from "../common/ControlledPopup";

function Login({ location, onSessionChange }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function handleSubmit(event) {
    Backend.postPlain("user/login?login=" + login + "&password=" + password)
      .then(response => {
        if (onSessionChange) onSessionChange(response);
        if (response.ok === false) {
          setErrorMessage("Unauthorized user id / password combination");
        } else {
          const params = qs.parse(location.search.substring(1));
          const retpath = decodeURIComponent(params.retpath || "");
          window.location = decodeURI(retpath || "/");
        }
      })
      .catch(error => setErrorMessage("Unable to login: " + error));
    event.preventDefault();
  }

  return (
    <div className="text-center">
      <ControlledPopup popupMessage={errorMessage} />
      <form className="form-signin">
        <h1 className="h3 mb-3 font-weight-normal">Please sign in</h1>
        <label htmlFor="login" className="sr-only">Login</label>
        <input type="text" id="login" name="login" className="form-control" placeholder="Login" required onChange={e => setLogin(e.target.value)} />
        <label htmlFor="password" className="sr-only">Password</label>
        <input type="password" id="password" name="password" className="form-control" placeholder="Password" required onChange={e => setPassword(e.target.value)} />
        <button className="btn btn-lg btn-primary btn-block" onClick={handleSubmit}>Sign in</button>
      </form>
      <LinkButtons buttonStyle={forgotButton} buttonText="Forgot Password" link="/forgot_password" />
    </div>
  );
}

export default withRouter(Login);

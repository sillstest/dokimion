import React, { useState, useRef } from "react";
import { withRouter } from "../common/withRouter";
import qs from "qs";
import Backend from "../services/backend";
import Turnstile from "react-turnstile";
import { LinkButtons, forgotButton } from "./components";
import ControlledPopup from "../common/ControlledPopup";

function Login({ location, onSessionChange }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [recaptcha, setRecaptcha] = useState("");
  const turnstile = useRef(null);

  function handleRecaptcha(token, boundTurnstile) {
    // keep a handle to the widget so we can issue a fresh token on retry
    turnstile.current = boundTurnstile;
    // store the token in state so the button enables only once it's ready
    setRecaptcha(token || "");
  }

  function handleSubmit(event) {
    event.preventDefault();

    // the Sign in button is disabled until Turnstile issues a token, so it's always set here
    const token = recaptcha;
    setRecaptcha("");

    // token is single-use; reset the (invisible) widget so a fresh token is issued for any retry
    if (turnstile.current) {
      turnstile.current.reset();
    }

    Backend.postPlain("user/login?login=" + login + "&password=" + password + "&recaptcha=" + token)
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
  }

  return (
    <div className="text-center">
      <ControlledPopup popupMessage={errorMessage} />
      <form className="form-signin">
        <h1 className="h3 mb-3 font-weight-normal">Please sign in</h1>
        <label htmlFor="login" className="sr-only">
          Login
        </label>
        <input
          type="text"
          id="login"
          name="login"
          className="form-control"
          placeholder="Login"
          required
          onChange={e => setLogin(e.target.value)}
        />
        <label htmlFor="password" className="sr-only">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          className="form-control"
          placeholder="Password"
          required
          onChange={e => setPassword(e.target.value)}
        />
        <Turnstile sitekey={process.env.REACT_APP_SITE_KEY} onVerify={handleRecaptcha} />
        <button className="btn btn-lg btn-primary btn-block" disabled={!recaptcha} onClick={handleSubmit}>
          Sign in
        </button>
      </form>
      <LinkButtons buttonStyle={forgotButton} buttonText="Forgot Password" link="/forgot_password" />
    </div>
  );
}

export default withRouter(Login);

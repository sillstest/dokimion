import React, { useState, useRef } from "react";
import { withRouter } from "../common/withRouter";
import Backend from "../services/backend";
import Turnstile from "react-turnstile";
import ControlledPopup from "../common/ControlledPopup";

function ForgotPassword() {
  const [login, setLogin] = useState("");
  const [message, setMessage] = useState("");
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

    // the submit button is disabled until Turnstile issues a token, so it's always set here
    const token = recaptcha;
    setRecaptcha("");

    // token is single-use; reset the (invisible) widget so a fresh token is issued for any retry
    if (turnstile.current) {
      turnstile.current.reset();
    }

    Backend.postPlain("user/forgot_password?login=" + login + "&recaptcha=" + token)
      .then(() => {
        setMessage("Success: Sent temporary password email for login");
        window.location = decodeURI("/");
      })
      .catch(() => setMessage("Error: Unable to retrieve email for login"));
  }

  return (
    <div className="text-center">
      <ControlledPopup popupMessage={message} />
      <form className="form-signin">
        <h1 className="h3 mb-3 font-weight-normal">Forgot Password</h1>
        <label htmlFor="login" className="sr-only">Login</label>
        <input type="text" id="login" name="login" className="form-control" placeholder="Login" required onChange={e => setLogin(e.target.value)} />
        <Turnstile sitekey={process.env.REACT_APP_SITE_KEY} onVerify={handleRecaptcha} />
        <button className="btn btn-lg btn-primary btn-block" disabled={!recaptcha} onClick={handleSubmit}>
          Send Email with Temporary Password
        </button>
      </form>
    </div>
  );
}

export default withRouter(ForgotPassword);

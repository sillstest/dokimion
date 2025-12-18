/* eslint-disable no-console */
import React, { useState } from 'react';
import Backend from "../services/backend";
import ControlledPopup from '../common/ControlledPopup';
import ReCAPTCHA from "react-google-recaptcha";

const ForgotPassword = () => {
  const [login, setLogin] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [recaptcha, setRecaptcha] = useState("");

  const handleRecaptcha = (value) => {
    if (value) {
      setRecaptcha(value);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === "login") {
      setLogin(value);
    } else if (name === "email") {
      setEmail(value);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    let recaptchaValue = "";
    if (process.env.REACT_APP_SITE_KEY !== process.env.REACT_APP_TEST_SITE_KEY) {
      // no automated test - send recaptcha string to back end
      recaptchaValue = recaptcha;

      if (recaptcha === "") {
        alert("Enter recaptcha");
        return;
      }
    } else {
      // automated test - send recaptcha string = "" to back end
      recaptchaValue = "";
    }

    setRecaptcha("");

    Backend.postPlain("user/forgot_password?login=" + login + "&recaptcha=" + recaptchaValue)
      .then(response => {
        setMessage("Success: Sent temporary password email for login");
        window.location = decodeURI("/");
      })
      .catch(error => {
        setMessage("handleSubmit::Error: Unable to retrieve email for login");
      });
  };

  return (
    <div className="text-center">
      <ControlledPopup popupMessage={message} />
      <form className="form-signin" onSubmit={handleSubmit}>
        <h1 className="h3 mb-3 font-weight-normal">Forgot Password</h1>
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
          autoFocus
          value={login}
          onChange={handleChange}
        />
        {(process.env.REACT_APP_SITE_KEY !== process.env.REACT_APP_TEST_SITE_KEY) && (
          <ReCAPTCHA
            sitekey={process.env.REACT_APP_SITE_KEY}
            onChange={handleRecaptcha}
          />
        )}
        <button className="btn btn-lg btn-primary btn-block" type="submit">
          Send Email with Temporary Password
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;

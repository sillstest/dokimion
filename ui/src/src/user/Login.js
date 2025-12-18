import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import qs from "qs";
import Backend from "../services/backend";
import ReCAPTCHA from "react-google-recaptcha";
import { LinkButtons, forgotButton } from './components';
import ControlledPopup from '../common/ControlledPopup';

const Login = ({ onSessionChange }) => {
  const location = useLocation();

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
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
    } else if (name === "password") {
      setPassword(value);
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

    Backend.postPlain("user/login?login=" + login + "&password=" + password + "&recaptcha=" + recaptchaValue)
      .then(response => {
        if (onSessionChange) {
          onSessionChange(response);
        }
        if (response.ok === false) {
          setErrorMessage("Unauthorized user id / password combination");
        } else {
          const params = qs.parse(location.search.substring(1));
          const retpath = decodeURIComponent(params.retpath || "");
          let decodedRetpath = decodeURI(retpath);
          if (decodedRetpath === "") {
            decodedRetpath = "/";
          }
          window.location = decodeURI(decodedRetpath);
        }
      })
      .catch(error => {
        setErrorMessage("handleSubmit::Unable to login, error: " + error);
      });
  };

  return (
    <div className="text-center">
      <ControlledPopup popupMessage={errorMessage} />
      <form className="form-signin" onSubmit={handleSubmit}>
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
          autoFocus
          value={login}
          onChange={handleChange}
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
          value={password}
          onChange={handleChange}
        />
        {(process.env.REACT_APP_SITE_KEY !== process.env.REACT_APP_TEST_SITE_KEY) && (
          <ReCAPTCHA
            sitekey={process.env.REACT_APP_SITE_KEY}
            onChange={handleRecaptcha}
          />
        )}
        <button className="btn btn-lg btn-primary btn-block" type="submit">
          Sign in
        </button>
      </form>
      <LinkButtons
        buttonStyle={forgotButton}
        buttonText="Forgot Password"
        link="/forgot_password"
      />
    </div>
  );
};

export default Login;

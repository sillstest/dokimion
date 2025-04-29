import React, { Component } from "react";
import { withRouter } from "react-router";
import qs from "qs";
import * as Utils from "../common/Utils";
import Backend from "../services/backend";
import TextField from '@material-ui/core/TextField';
import ReCAPTCHA from "react-google-recaptcha";
import { LinkButtons, forgotButton } from './components';
import ControlledPopup from '../common/ControlledPopup';

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      login: "",
      password: "",
      errorMessage:"",
      recaptcha: "",
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleRecaptcha = this.handleRecaptcha.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.onSessionChange = this.onSessionChange.bind(this);
  }

  handleRecaptcha(value) {
    if (value) {
      this.state.recaptcha = value;
    }
  }

  onSessionChange(session) {
    this.props.onSessionChange(session);
  }

  handleChange(event) {
    // eslint-disable-next-line react/no-direct-mutation-state
    this.state[event.target.name] = event.target.value;
    this.setState(this.state);
  }

  handleSubmit(event) {

      let recaptcha = "";
      if (process.env.REACT_APP_SITE_KEY !== process.env.REACT_APP_TEST_SITE_KEY) {
        // no automated test - send reacaptcha string to back end
        recaptcha = this.state.recaptcha;

        if (this.state.recaptcha === "") {
          alert("Enter recaptcha");
	  return;
        }

      } else {
        // automated test - send recaptcha string = "" to back end
        recaptcha = "";
      }

      this.state.recaptcha = "";
      this.setState(this.state);

      Backend.postPlain("user/login?login=" + this.state.login + "&password=" + this.state.password + "&recaptcha=" + recaptcha)
        .then(response => {
          this.onSessionChange(response);
          var params = qs.parse(this.props.location.search.substring(1));
          var retpath = decodeURIComponent(params.retpath || "");
          var decodedReptath = decodeURI(retpath);
          if (decodedReptath === "") {
            decodedReptath = "/";
          }
          window.location = decodeURI(decodedReptath);
        }).catch(error => {
	    this.setState({errorMessage: "handleSubmit::Unable to login, error: " + error});
        });
      event.preventDefault();
  }

  render() {
    return (
      <div className="text-center">
        <ControlledPopup popupMessage={this.state.errorMessage}/>
        <form className="form-signin">
          <h1 className="h3 mb-3 font-weight-normal">Please sign in</h1>
          <label for="login" className="sr-only">
            Login
          </label>
          <input
            type="text"
            id="login"
            name="login"
            className="form-control"
            placeholder="Login"
            required=""
            autofocus=""
            onChange={this.handleChange}
          />
          <label for="password" className="sr-only">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            className="form-control"
            placeholder="Password"
            required=""
            onChange={this.handleChange}
          />
	  {(process.env.REACT_APP_SITE_KEY !== process.env.REACT_APP_TEST_SITE_KEY) && (
	  <ReCAPTCHA
	   sitekey={process.env.REACT_APP_SITE_KEY}
	   onChange={this.handleRecaptcha}
	  />
	  )}
          <button className="btn btn-lg btn-primary btn-block" onClick={this.handleSubmit}>
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
  }
}

export default withRouter(Login);

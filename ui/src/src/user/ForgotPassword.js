/* eslint-disable no-console */
import React, { Component } from 'react';
import { withRouter } from "react-router";
import Backend from "../services/backend";
import ControlledPopup from '../common/ControlledPopup';
import qs from "qs";
import TextField from '@material-ui/core/TextField';
import Turnstile from "react-turnstile";

class ForgotPassword extends Component {
	constructor(props) {
	   super(props);
           this.state = {
             login: "",
	     email: "",
             message: "",
             recaptcha: "",
	   };
           this.handleChange = this.handleChange.bind(this);
           this.handleRecaptcha = this.handleRecaptcha.bind(this);
	   this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleRecaptcha(token, boundTurnstile) {
          // keep a handle to the widget so we can issue a fresh token on retry
          this.turnstile = boundTurnstile;
          // store the token in state so render() can enable the button only once it's ready
          this.setState({ recaptcha: token || "" });
        }

	handleChange(event) {
           this.state[event.target.name] = event.target.value;
	   this.setState(this.state);
	};

	handleSubmit(event) {

          // the submit button is disabled until Turnstile issues a token, so it's always set here
          let recaptcha = this.state.recaptcha;

          this.state.recaptcha = "";
          this.setState(this.state);

          // token is single-use; reset the (invisible) widget so a fresh token is issued for any retry
          if (this.turnstile) {
            this.turnstile.reset();
          }

	  const { login } = this.state;

          Backend.postPlain("user/forgot_password?login=" + login + "&recaptcha=" + recaptcha)
           .then(response => {
	      this.setState({message: "Success: Sent temporary password email for login"});
	      window.location = decodeURI("/");
	   }).catch(error => {
             this.setState({message: "handleSubmit::Error: Unable to retrieve email for login"});
           });
          event.preventDefault();

        };


	render() {
          return (
	    <div className="text-center">
	      <ControlledPopup popupMessage={this.state.errorMessage}/>
              <form className="form-signin">
		<h1 className="h3 mb-3 font-weight-normal">Forgot Password</h1>
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
		<Turnstile
		 sitekey={process.env.REACT_APP_SITE_KEY}
		 onVerify={this.handleRecaptcha}
		/>
                <button className="btn btn-lg btn-primary btn-block" disabled={!this.state.recaptcha} onClick={this.handleSubmit}>
	          Send Email with Temporary Password
		</button>
	      </form>
	    </div>
          );
	}
}

export default withRouter(ForgotPassword);

/* eslint-disable no-console */
import React, { Component } from 'react';
import ReCAPTCHA from "react-google-recaptcha";
import { withRouter } from "react-router";
import Backend from "../services/backend";
import ControlledPopup from '../common/ControlledPopup';
import qs from "qs";
import TextField from '@material-ui/core/TextField';

class ForgotPassword extends Component {
	constructor(props) {
	   super(props);
           this.state = {
             login: "",
	     email: "",
             message: "",
	     recaptchaValue: false,
	   };
           this.handleChange = this.handleChange.bind(this);
	   this.handleSubmit = this.handleSubmit.bind(this);
	   this.handleRecaptcha = this.handleRecaptcha.bind(this);
	}

	handleRecaptcha(event) {
	   this.state.recaptchaValue = !this.state.recaptchaValue;
	   this.setState(this.state);
	}

	handleChange(event) {
           this.state[event.target.name] = event.target.value;
	   this.setState(this.state);
	};

	handleSubmit(event) {
	  if (this.state.recaptchaValue == false) {
	     alert("Click to Verify you are not a Robot");
	  } else {
	     this.setState({recaptchaValue: false});

	     const { login } = this.state;
             Backend.post("user/forgot_password?login=" + login )
                .then(response => {
	           this.setState({message: "Success: Retrieved email for login"});
	           window.location = decodeURI("/");
	        }).catch(error => {
		   this.setState({message: "Error: Unable to retrieve email for login: " + error});
                });
	   }
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
                <button className="btn btn-lg btn-primary btn-block" onClick={this.handleSubmit}>
	          Send Email with Temporary Password
		</button>
		<ReCAPTCHA
		 sitekey={process.env.REACT_APP_SITE_KEY}
		 onChange={this.handleRecaptcha}
		/>
	      </form>
	    </div>
          );
	}
}

export default withRouter(ForgotPassword);

/* eslint-disable no-console */
import React, { Component } from 'react';
import { withRouter } from "react-router";
import Backend from "../services/backend";
import ControlledPopup from '../common/ControlledPopup';
import qs from "qs";
import TextField from '@material-ui/core/TextField';
import ReCAPTCHA from "react-google-recaptcha";

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

	handleRecaptcha(value) {
	  if (value) {
	    this.state.recaptcha = value;
          }
        }

	handleChange(event) {
           this.state[event.target.name] = event.target.value;
	   this.setState(this.state);
	};

	handleSubmit(event) {
	  if (this.state.recaptcha === "") {
	    alert("Enter recaptcha");
	  } else {
	    const { login } = this.state;
	    const recaptcha = this.state.recaptcha;
	    this.state.recaptcha = "";
	    this.setState(this.state);

            Backend.postPlain("user/forgot_password?login=" + login + "&recaptcha=" + recaptcha)
             .then(response => {
	        this.setState({message: "Success: Sent temporary password email for login"});
	        window.location = decodeURI("/");
	     }).catch(error => {
		this.setState({message: "Error: Unable to retrieve email for login: " + error});
             });
            event.preventDefault();
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
		<ReCAPTCHA
		 sitekey={process.env.REACT_APP_SITE_KEY}
		 onChange={this.handleRecaptcha}
		/>
                <button className="btn btn-lg btn-primary btn-block" onClick={this.handleSubmit}>
	          Send Email with Temporary Password
		</button>
	      </form>
	    </div>
          );
	}
}

export default withRouter(ForgotPassword);

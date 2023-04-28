/* eslint-disable no-console */
import React, { Component } from 'react';
import { withRouter } from "react-router";
import Backend from "../services/backend";
import * as Utils from "../common/Utils";
import qs from "qs";
import TextField from '@material-ui/core/TextField';

import {
	LinkButtons,
	SubmitButtons,
	registerButton,
	homeButton,
	forgotButton,
	inputStyle,
	HeaderBar,
} from './components';

const title = {
	pageTitle: 'Forgot Password Screen',
};

class ForgotPassword extends Component {
	constructor(props) {
	   super(props);
           this.state = {
             login: "",
	     email: "",
	   };
           this.handleChange = this.handleChange.bind(this);
	   this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleChange(event) {
           this.state[event.target.name] = event.target.value;
	   this.setState(this.state);
	};

	handleSubmit(event) {
	  const { login } = this.state;
          Backend.post("user/forgot_password?login=" + login )
             .then(response => {
	       window.location = decodeURI("/" + response.email);
	     }).catch(error => {
		Utils.onErrorMessage("Unable to retrieve email for login: ", error);
             });
	};

	render() {
		return (
			<div>
			<HeaderBar title={title} />
			<form className="profile-form">
			   <h1 className="h3 mb-3 font-weight-normal">Send Email with Link</h1>
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
			</form>
			<button className="btn btn-lg btn-primary btn-block" onClick={this.handleSubmit}>
			 Send Email with Link
			</button>
			</div>
		);
	}
}

export default withRouter(ForgotPassword);

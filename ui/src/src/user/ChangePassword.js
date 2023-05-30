import React from "react";
import { withRouter } from "react-router";
import SubComponent from "../common/SubComponent";
import * as Utils from '../common/Utils';
import Backend from "../services/backend";
import ControlledPopup from '../common/ControlledPopup';

class ChangePassword extends SubComponent {
  state = {session: {person:{}}, message: ""}

  constructor(props) {
    super(props);
    this.state.profileId = this.props.match.params.profileId;
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.getSession = this.getSession.bind(this);
  }

  componentDidMount() {
    super.componentDidMount();
    this.getSession();
  }

  getSession() {
    Backend.get("user/session")
      .then(response => {
        this.state.session = response;
        this.setState(this.state);
      })
      .catch(() => {console.log("Unable to fetch session");});
  }

  handleChange(event) {
    this.state[event.target.name] = event.target.value;
    this.setState(this.state);
  }

  handleSubmit(event) {
    Backend.postPlain("user/change-password", { newPassword: this.state.password, login: this.state.profileId })
      .then(response => {
	this.setState({message: "Password successfully updated"});
      })
      .catch(error => {
	this.setState({message: "Couldn't change password"});
      });
    event.preventDefault();
  }

  render() {
    return (
      <div className="text-center">
	<ControlledPopup popupMessage={this.state.message}/>
        {Utils.isUserOwnerOrAdmin(this.state.session, this.state.session.person.login) && (
            <form className="form-signin">
              <h1 className="h3 mb-3 font-weight-normal">Change Password</h1>
              <input
                type="password"
                id="password"
                name="password"
                className="form-control"
                placeholder="New Password"
                required=""
                onChange={this.handleChange}
              />
              <button className="btn btn-lg btn-primary btn-block" onClick={this.handleSubmit}>
                Submit
              </button>
            </form>
        )}
      </div>
    );
  }
}

export default withRouter(ChangePassword);

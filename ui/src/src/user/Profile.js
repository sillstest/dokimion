import React from "react";
import { withRouter } from "../common/withRouter";
import SubComponent from "../common/SubComponent";
import { Link } from "react-router-dom";
import ControlledPopup from '../common/ControlledPopup';
import Backend from "../services/backend";
import "../App.css";

class Profile extends SubComponent {
  state = {
    profile: {},
    session: {person:{}},
    message: "",
  };

  constructor(props) {
    super(props);
    this.getUser = this.getUser.bind(this);
    this.getSession = this.getSession.bind(this);
  }

  componentDidMount() {
    super.componentDidMount();

    this.state.profile.id = this.props.router.profileId;
    this.getSession();
    this.getUser();
  }

  getUser() {
    Backend.get("user/" + this.state.profile.id)
      .then(response => {
        this.state.profile = response;
        this.setState(this.state);
      })
      .catch(error => {
        this.setState({message: "Couldn't get user: " + error});
      });
  }

  getSession() {
    Backend.get("user/session")
          .then(response => {
                this.state.session = response;
          })
          .catch(() => {
            this.setState({message: "Unable to fetch session"});
          });
  }

  render() {
    return (
      <div>
        <h3>
          <span className="text-muted">User: {this.state.profile.login}</span>{" "}
        </h3>
        <table className="tableUserProfile">
          <tr>
            <th className="headerUserProfile">Attribute</th>
            <th className="headerUserProfile">Value</th>
          </tr>
          <tr>
            <td className="cellUserProfile">Login</td>
            <td className="cellUserProfile">{this.state.profile.login}</td>
          </tr>
          <tr>
            <td className="cellUserProfile">First Name</td>
            <td className="cellUserProfile">{this.state.profile.firstName}</td>
	  </tr>
          <tr>
            <td className="cellUserProfile">Last Name</td>
            <td className="cellUserProfile">{this.state.profile.lastName}</td>
          </tr>
          <tr>
            <td className="cellUserProfile">Email</td>
            <td className="cellUserProfile">{this.state.profile.email}</td>
          </tr>
          <tr>
            <td className="cellUserProfile">Role</td>
            <td className="cellUserProfile">{this.state.profile.role}</td>
          </tr>
        </table>
        <div>
          <div className="row">
            <div className="col-12">
              <Link to={"/user/change-password-redirect/" + this.state.profile.id}>Change Password</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(Profile);

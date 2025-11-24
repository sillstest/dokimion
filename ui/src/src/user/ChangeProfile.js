import React from "react";
import { withRouter } from "react-router";
import SubComponent from "../common/SubComponent";
import * as Utils from '../common/Utils';
import Backend from "../services/backend";
import ControlledPopup from '../common/ControlledPopup';

class ChangeProfile extends SubComponent {
  state = {
    session: {person:{}}, 
    message: "",
    profile: {},
    profileId: "",
  };

  constructor(props) {
    super(props);
    this.state.profileId = this.props.match.params.profileId;
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.getUser = this.getUser.bind(this);
    this.getSession = this.getSession.bind(this);
  }

  componentDidMount() {
    super.componentDidMount();
    this.getSession();
    this.getUser();
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
    Backend.postPlain("user/change-profile", 
	    { newPassword: this.state.password, 
	      login:       this.state.profile.id ,
	      firstName:   this.state.profile.firstName,
	      lastName:    this.state.profile.lastName,
	      email:       this.state.profile.email,
	      role:        this.state.profile.role
	    })
      .then(response => {
	if (response.status !== 200) {
	   this.setState({message: "Error: Change Profile Failed"});
	} else {
	   this.setState({message: "Success: Profile updated"});
	   window.location = decodeURI("/");
        }
      })
      .catch(error => {
	this.setState({message: "Error: Couldn't change profile"});
      });
    event.preventDefault();
  }

  getUser() {
    Backend.get("user/" + this.state.profileId)
      .then(response => {
        this.state.profile = response;
        this.setState(this.state);
      })
      .catch(error => {
        this.setState({message: "Couldn't get user: " + error});
      });
  }

  render() {
    return (
      <div className="text-center">
        <ControlledPopup popupMessage={this.state.message}/>
        {Utils.isUserOwnerOrAdmin(this.state.session, this.state.session.person.login) && (
            <form className="dropdown_menu">
              <h1 className="h3 mb-3 font-weight-normal">Change User Profile</h1>
              <label>First Name</label>
              <input
                type="firstname"
                id="firstname"
                name="firstname"
                className="form-control"
                placeholder={this.state.profile.firstName}
                required=""
                onChange={this.handleChange}
              />
              <label>Last Name</label>
              <input
                type="lastname"
                id="lastname"
                name="lastname"
                className="form-control"
                placeholder={this.state.profile.lastName}
                required=""
                onChange={this.handleChange}
              />
              <label>Password</label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-control"
                placeholder="New Password"
                required=""
                onChange={this.handleChange}
              />
              <label>Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-control"
                placeholder={this.state.profile.email}
                required=""
                onChange={this.handleChange}
              />
              <label>User Role</label>
              <select
                name="role"
                value={this.state.profile.role}
                onChange={this.handleChange}
              >
                <option key="role1" value="TESTER">TESTER</option>
                <option key="role2" value="TESTDEVELOPER">TESTDEVELOPER</option>
                <option key="role3" value="ADMIN">ADMINISTRATOR</option>
                <option key="role4" value="OBSERVERONLY">OBSERVERONLY</option>
              </select>
              <br></br>
              <button className="btn btn-lg btn-primary btn-block" onClick={this.handleSubmit}>
                Submit
              </button>
            </form>
        )}
      </div>
    );
  }
}

export default withRouter(ChangeProfile);

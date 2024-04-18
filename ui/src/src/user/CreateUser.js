import React, { Component } from "react";
import { withRouter } from "react-router";
import ControlledPopup from '../common/ControlledPopup';
import Backend from "../services/backend";
import * as Utils from "../common/Utils";

class CreateUser extends Component {
  constructor(props) {
    super(props);
    this.state = {
      users: [],
      filter: {
        skip: 0,
        limit: 20,
        orderby: "firstName",
        orderdir: "ASC",
        includedFields: "firstName,lastName,login,id,email,role",
      },
      oneUser: {
        login: "",
        password: "",
        firstName: "",
        lastName: "",
        role: "TESTER",
      },
      message: "",
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.getUsers     = this.getUsers.bind(this);
    this.isNewAdminAllowed = this.isNewAdminAllowed.bind(this);

  }

  // called after 1st render
  componentDidMount() {
    this.getUsers();
  }

  handleChange(event) {
    // eslint-disable-next-line react/no-direct-mutation-state
    this.state.oneUser[event.target.name] = event.target.value;
    this.setState(this.state);
  }

  isNewAdminAllowed = () => {
    let noAdmins = 0;
    for (let i = 0; i < (this.state.users.length-1); i++)
    {
       if (this.state.users[i].role == 'ADMIN') {
          noAdmins += 1;
       }

    }
    if (noAdmins <= 1)
    {
       // true if 1 more Admin can be created
       return true;
    }
    return false;
  }

  handleSubmit(event) {
    if (this.state.oneUser.login.toLowerCase() == "admin") {
       this.setState({message: "Error - System admin reserved"});
       return;
    }
    if ((this.state.oneUser.role.toLowerCase() == "admin") && 
        (this.isNewAdminAllowed() == false)) {
       this.setState({message: "Number of users with role = \'ADMIN\' is MAXIMUM already"});
       return;
    }
    if (this.state.oneUser.login == "" || this.state.oneUser.firstName == "" ||
	this.state.oneUser.lastName == "" || this.state.oneUser.password == "") {
        this.setState({message: "All fields must have a non-null value"});
	return;
    }
    Backend.post("user", this.state.oneUser)
        .then(response => {
          window.location = decodeURI("/user/profile/" + response.login);
        }).catch(error => {
          this.setState({message: "Couldn't create a user: " + error});
        });
    event.preventDefault();
  }


  getUsers() {
    Backend.get("user?" + Utils.filterToQuery(this.state.filter))
      .then(response => {
        this.state.users = response;
        this.setState(this.state);
      })
      .catch(error => {
        this.setState({message: "Couldn't get users: " + error});
        this.setState(this.state);
      });
  }

  render() {
    return (
      <div>
	<ControlledPopup popupMessage={this.state.message}/>
        <h1>Create User</h1>
        <div className="create-user-form">
          <form>
            <div class="form-row">
              <div class="form-group col-md-6">
                <label for="login">Login</label>
                <input type="email" class="form-control" name="login" id="login" onChange={this.handleChange} />
              </div>
              <div class="form-group col-md-6">
                <label for="password">Password</label>
                <input
                  type="password"
                  class="form-control"
                  name="password"
                  id="password"
                  onChange={this.handleChange}
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group col-md-6">
                <label for="firstName">First Name</label>
                <input type="text" class="form-control" name="firstName" id="firstName" onChange={this.handleChange} />
              </div>
              <div class="form-group col-md-6">
                <label for="lastName">Last Name</label>
                <input type="text" class="form-control" name="lastName" id="lastName" onChange={this.handleChange} />
              </div>
           </div>
           <div class="form-row">
              <div class="form-group col-md-6">
                <label for="email">Email</label>
                <input type="text" class="form-control" name="email" id="email" onChange={this.handleChange} />
              </div>
              <div class="form-group col-md-6">
                <label for="user_role">User Role</label>
                <br></br>
                <select
                  name="role"
                  value={this.state.oneUser.role}
                  onChange={this.handleChange}
                >
                  <option key="role" value="TESTER">TESTER</option>
                  <option key="role" value="TESTDEVELOPER">TESTDEVELOPER</option>
		  <option key="role" value="ADMIN">ADMINISTRATOR</option>
		  <option key="role" value="NONTESTGROUP">NONTESTGROUP</option>
                </select>
              </div>
           </div>
            <button onClick={this.handleSubmit} class="btn btn-primary">
              Create
            </button>
          </form>
        </div>
      </div>
    );
  }

}

export default withRouter(CreateUser);

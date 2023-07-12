import React, { Component } from "react";
import { withRouter } from "react-router";
import ControlledPopup from '../common/ControlledPopup';
import Backend from "../services/backend";

class CreateUser extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: {
        login: "",
        password: "",
        firstName: "",
        lastName: "",
        role: "Tester",
      },
      message: "",
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }
 
  handleChange(event) {
    // eslint-disable-next-line react/no-direct-mutation-state
    this.state.user[event.target.name] = event.target.value;
    this.setState(this.state);
  }

  handleSubmit(event) {
    Backend.post("user", this.state.user)
        .then(response => {
          window.location = decodeURI("/user/profile/" + response.login);
        }).catch(error => {
          this.setState({message: "Couldn't create a user: " + error});
        });
    event.preventDefault();
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
                  value={this.state.user.role}
                  onChange={this.handleChange}
                >
                  <option key="role" value="Tester">Tester</option>
		  <option key="role" value="Admin">Administrator</option>
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

  componentDidMount() {}
}

export default withRouter(CreateUser);

import React, { Component } from "react";
import { withRouter } from "react-router";
import ControlledPopup from '../common/ControlledPopup';
import Backend from "../services/backend";
import * as Utils from "../common/Utils";

class DeleteUser extends Component {
  constructor(props) {
    super(props);
    this.state = {
      login: "",
      filter: {
        skip: 0,
        limit: 20,
        orderby: "login",
        orderdir: "ASC",
        includedFields: "login",
      },
      message: "",
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

  }

  // called after 1st render
  componentDidMount() {
  }

  handleChange(event) {
    // eslint-disable-next-line react/no-direct-mutation-state
    this.setState({ login: event.target.value });
  }


  handleSubmit(event) {
    Backend.post("user/delete?login=", this.state.login)
        .then(response => {
          window.location = decodeURI("/user/profile/" + response.login);
        }).catch(error => {
          this.setState({message: "Couldn't delete a user: " + error});
        });
    event.preventDefault();
  }


  render() {
    return (
     <div>
        <ControlledPopup popupMessage={this.state.message}/>
        <h1>Delete User</h1>
        <div className="delete-user-form">
          <form>
            <div class="form-row">
              <div class="form-group col-md-6">
                <div>
                  <label for="login">Login: </label>
                </div>
                <div className="mx-auto">
                  <input style={{width: "300px"}} class="form-control" type="text" name="login" id="login" onChange={this.handleChange} />
                </div>
              </div>
            </div>
            <button onClick={this.handleSubmit} class="btn btn-primary">
              Delete
            </button>
          </form>
        </div>
     </div>
    );
  }

}

export default withRouter(DeleteUser);

/* eslint-disable eqeqeq */
import React, { useState, useEffect } from "react";
import { withRouter } from "../common/withRouter";
import ControlledPopup from "../common/ControlledPopup";
import Backend from "../services/backend";
import * as Utils from "../common/Utils";

const defaultFilter = { skip: 0, limit: 20, orderby: "firstName", orderdir: "ASC", includedFields: "firstName,lastName,login,id,email,role" };
const defaultUser = { login: "", password: "", firstName: "", lastName: "", role: "TESTER" };

function CreateUser() {
  const [users, setUsers] = useState([]);
  const [oneUser, setOneUser] = useState({ ...defaultUser });
  const [message, setMessage] = useState("");

  useEffect(() => {
    Backend.get("user?" + Utils.filterToQuery(defaultFilter))
      .then(response => setUsers(response))
      .catch(error => setMessage("Couldn't get users: " + error));
  }, []);

  function isNewAdminAllowed() {
    return users.filter(u => u.role == "ADMIN").length <= 1;
  }

  function handleChange(event) {
    setOneUser(prev => ({ ...prev, [event.target.name]: event.target.value }));
  }

  function handleSubmit(event) {
    if (oneUser.login.toLowerCase() == "admin") { setMessage("Error - System admin reserved"); return; }
    if (oneUser.role.toLowerCase() == "admin" && !isNewAdminAllowed()) { setMessage("Number of users with role = 'ADMIN' is MAXIMUM already"); return; }
    if (!oneUser.login || !oneUser.firstName || !oneUser.lastName || !oneUser.password) { setMessage("All fields must have a non-null value"); return; }

    Backend.post("user", oneUser)
      .then(response => { window.location = decodeURI("/user/profile/" + response.login); })
      .catch(error => setMessage("Couldn't create a user: " + error));
    event.preventDefault();
  }

  return (
    <div>
      <ControlledPopup popupMessage={message} />
      <h1>Create User</h1>
      <div className="create-user-form">
        <form>
          <div className="form-row">
            <div className="form-group col-md-6">
              <label htmlFor="login">Login</label>
              <input type="email" className="form-control" name="login" id="login" onChange={handleChange} />
            </div>
            <div className="form-group col-md-6">
              <label htmlFor="password">Password</label>
              <input type="password" className="form-control" name="password" id="password" onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group col-md-6">
              <label htmlFor="firstName">First Name</label>
              <input type="text" className="form-control" name="firstName" id="firstName" onChange={handleChange} />
            </div>
            <div className="form-group col-md-6">
              <label htmlFor="lastName">Last Name</label>
              <input type="text" className="form-control" name="lastName" id="lastName" onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group col-md-6">
              <label htmlFor="email">Email</label>
              <input type="text" className="form-control" name="email" id="email" onChange={handleChange} />
            </div>
            <div className="form-group col-md-6">
              <label htmlFor="user_role">User Role</label><br />
              <select name="role" value={oneUser.role} onChange={handleChange}>
                <option value="TESTER">TESTER</option>
                <option value="TESTDEVELOPER">TESTDEVELOPER</option>
                <option value="ADMIN">ADMINISTRATOR</option>
                <option value="OBSERVERONLY">OBSERVERONLY</option>
              </select>
            </div>
          </div>
          <button onClick={handleSubmit} className="btn btn-primary">Create</button>
        </form>
        <br />
        <table>
          <tbody>
            <tr><th>Valid Password Rules</th></tr>
            <tr><td>Length between 8 and 15 characters</td></tr>
            <tr><td>No whitespace</td></tr>
            <tr><td>At least one upper case character</td></tr>
            <tr><td>At least one lower case character</td></tr>
            <tr><td>At least one digit</td></tr>
            <tr><td>At least one special character</td></tr>
            <tr><td>Illegal character sequence: USQwerty</td></tr>
            <tr><td>Illegal character sequence: Alphabetical</td></tr>
            <tr><td>Illegal character sequence: Numerical</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default withRouter(CreateUser);

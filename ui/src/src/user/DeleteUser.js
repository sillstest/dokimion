import React, { useState } from "react";
import { withRouter } from "../common/withRouter";
import ControlledPopup from "../common/ControlledPopup";
import Backend from "../services/backend";

function DeleteUser() {
  const [login, setLogin] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event) {
    Backend.postPlain("user/delete?login=" + login)
      .then(response => {
        if (response.statusText !== "Internal Server Error") {
          window.location = decodeURI("/");
        } else {
          setMessage("Couldn't delete user: " + login);
        }
      })
      .catch(error => setMessage("Couldn't delete a user: " + error));
    event.preventDefault();
  }

  return (
    <div>
      <ControlledPopup popupMessage={message} />
      <h1>Delete User</h1>
      <div className="delete-user-form">
        <form>
          <div className="form-row">
            <div className="form-group col-md-6">
              <div><label htmlFor="login">Login: </label></div>
              <div className="mx-auto">
                <input style={{ width: "300px" }} className="form-control" type="text" name="login" id="login" onChange={e => setLogin(e.target.value)} />
              </div>
            </div>
          </div>
          <button onClick={handleSubmit} className="btn btn-primary">Delete</button>
        </form>
      </div>
    </div>
  );
}

export default withRouter(DeleteUser);

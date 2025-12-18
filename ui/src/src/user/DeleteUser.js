import React, { useState } from "react";
import ControlledPopup from '../common/ControlledPopup';
import Backend from "../services/backend";

const DeleteUser = () => {
  const [login, setLogin] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    setLogin(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    Backend.postPlain("user/delete?login=" + login)
      .then(response => {
        if (response.statusText !== "Internal Server Error") {
          window.location = decodeURI("/");
        } else {
          setMessage("Couldn't delete user: " + login);
        }
      })
      .catch(error => {
        setMessage("Couldn't delete a user: " + error);
      });
  };

  return (
    <div>
      <ControlledPopup popupMessage={message} />
      <h1>Delete User</h1>
      <div className="delete-user-form">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group col-md-6">
              <div>
                <label htmlFor="login">Login: </label>
              </div>
              <div className="mx-auto">
                <input
                  style={{width: "300px"}}
                  className="form-control"
                  type="text"
                  name="login"
                  id="login"
                  value={login}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
          <button type="submit" className="btn btn-primary">
            Delete
          </button>
        </form>
      </div>
    </div>
  );
};

export default DeleteUser;

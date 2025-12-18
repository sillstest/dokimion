import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import * as Utils from '../common/Utils';
import Backend from "../services/backend";
import ControlledPopup from '../common/ControlledPopup';

const ChangePassword = () => {
  const { profileId } = useParams();
  const [session, setSession] = useState({ person: {} });
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    getSession();
  }, []);

  const getSession = () => {
    Backend.get("user/session")
      .then(response => {
        setSession(response);
      })
      .catch(() => {
        console.log("Unable to fetch session");
      });
  };

  const handleChange = (event) => {
    setPassword(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    
    Backend.postPlain("user/change-password", { 
      newPassword: password, 
      login: profileId 
    })
      .then(response => {
        if (response.status !== 200) {
          setMessage("Error: Change Password Failed");
        } else {
          setMessage("Success: Password updated");
          window.location = decodeURI("/");
        }
      })
      .catch(error => {
        setMessage("Error: Couldn't change password");
      });
  };

  return (
    <div className="text-center">
      <ControlledPopup popupMessage={message} />
      {Utils.isUserOwnerOrAdmin(session, session.person.login) && (
        <form className="form-signin">
          <h1 className="h3 mb-3 font-weight-normal">Change Password</h1>
          <input
            type="password"
            id="password"
            name="password"
            className="form-control"
            placeholder="New Password"
            required=""
            onChange={handleChange}
          />
          <button 
            className="btn btn-lg btn-primary btn-block" 
            onClick={handleSubmit}
          >
            Submit
          </button>
        </form>
      )}
    </div>
  );
};

export default ChangePassword;

import React, { useState, useEffect } from "react";
import { withRouter } from "../common/withRouter";
import * as Utils from "../common/Utils";
import Backend from "../services/backend";
import ControlledPopup from "../common/ControlledPopup";

function ChangeProfile({ match }) {
  const profileId = match?.params?.profileId;
  const [profile, setProfile] = useState({ id: "", firstName: "", lastName: "", email: "", role: "" });
  const [session, setSession] = useState({ person: {} });
  const [message, setMessage] = useState("");

  useEffect(() => {
    Backend.get("user/session")
      .then(response => setSession(response))
      .catch(() => console.log("Unable to fetch session"));
    if (profileId) {
      Backend.get("user/" + profileId)
        .then(response => setProfile(response))
        .catch(error => setMessage("Couldn't get user: " + error));
    }
  }, [profileId]);

  function handleChange(event) {
    setProfile(prev => ({ ...prev, [event.target.name]: event.target.value }));
  }

  function handleSubmit(event) {
    Backend.postPlain("user/change-profile", {
      newPassword: profile.password,
      login: profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      role: profile.role,
    })
      .then(response => {
        if (response.status !== 200) {
          setMessage("Error: Change Profile Failed");
        } else {
          setMessage("Success: Profile updated");
          window.location = decodeURI("/");
        }
      })
      .catch(() => setMessage("Error: Couldn't change profile"));
    event.preventDefault();
  }

  return (
    <div className="text-center">
      <ControlledPopup popupMessage={message} />
      {Utils.isUserOwnerOrAdmin(session, session.person.login) && (
        <form className="dropdown_menu">
          <h1 className="h3 mb-3 font-weight-normal">Change User Profile</h1>
          <label>First Name</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            className="form-control"
            value={profile.firstName || ""}
            required
            onChange={handleChange}
          />
          <label>Last Name</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            className="form-control"
            value={profile.lastName || ""}
            required
            onChange={handleChange}
          />
          <label>Password</label>
          <input
            type="password"
            id="password"
            name="password"
            className="form-control"
            placeholder="New Password"
            required
            onChange={handleChange}
          />
          <label>Email</label>
          <input
            type="email"
            id="email"
            name="email"
            className="form-control"
            value={profile.email || ""}
            required
            onChange={handleChange}
          />
          <label>User Role</label>
          <select name="role" value={profile.role || ""} onChange={handleChange}>
            <option value="TESTER">TESTER</option>
            <option value="TESTDEVELOPER">TESTDEVELOPER</option>
            <option value="ADMIN">ADMINISTRATOR</option>
            <option value="OBSERVERONLY">OBSERVERONLY</option>
          </select>
          <br />
          <button className="btn btn-lg btn-primary btn-block" onClick={handleSubmit}>
            Submit
          </button>
        </form>
      )}
    </div>
  );
}

export default withRouter(ChangeProfile);

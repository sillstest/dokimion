import React, { useState, useEffect } from "react";
import { withRouter } from "../common/withRouter";
import { Link } from "react-router-dom";
import ControlledPopup from "../common/ControlledPopup";
import Backend from "../services/backend";
import "../App.css";

function Profile({ match }) {
  const profileId = match?.params?.profileId;
  const [profile, setProfile] = useState({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!profileId) return;
    Backend.get("user/" + profileId)
      .then(response => setProfile(response))
      .catch(error => setMessage("Couldn't get user: " + error));
  }, [profileId]);

  return (
    <div>
      <ControlledPopup popupMessage={message} />
      <h3>
        <span className="text-muted">User: {profile.login}</span>
      </h3>
      <table className="tableUserProfile">
        <thead>
          <tr>
            <th className="headerUserProfile">Attribute</th>
            <th className="headerUserProfile">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="cellUserProfile">Login</td>
            <td className="cellUserProfile">{profile.login}</td>
          </tr>
          <tr>
            <td className="cellUserProfile">First Name</td>
            <td className="cellUserProfile">{profile.firstName}</td>
          </tr>
          <tr>
            <td className="cellUserProfile">Last Name</td>
            <td className="cellUserProfile">{profile.lastName}</td>
          </tr>
          <tr>
            <td className="cellUserProfile">Email</td>
            <td className="cellUserProfile">{profile.email}</td>
          </tr>
          <tr>
            <td className="cellUserProfile">Role</td>
            <td className="cellUserProfile">{profile.role}</td>
          </tr>
        </tbody>
      </table>
      <div className="row">
        <div className="col-12">
          <Link to={"/user/change-profile-redirect/" + profile.id}>Change Profile</Link>
        </div>
      </div>
    </div>
  );
}

export default withRouter(Profile);

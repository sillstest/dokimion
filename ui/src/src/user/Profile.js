import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import ControlledPopup from '../common/ControlledPopup';
import Backend from "../services/backend";
import "../App.css";

const Profile = ({ onProjectChange }) => {
  const params = useParams();
  const profileId = params.profileId;

  const [profile, setProfile] = useState({});
  const [session, setSession] = useState({ person: {} });
  const [message, setMessage] = useState("");

  // Handle SubComponent's onProjectChange callback
  useEffect(() => {
    if (onProjectChange && params.project) {
      onProjectChange(params.project);
    }
  }, [onProjectChange, params.project]);

  // Fetch user and session on mount or when profileId changes
  useEffect(() => {
    getSession();
    getUser();
  }, [profileId]);

  const getUser = () => {
    Backend.get("user/" + profileId)
      .then(response => {
        setProfile(response);
      })
      .catch(error => {
        setMessage("Couldn't get user: " + error);
      });
  };

  const getSession = () => {
    Backend.get("user/session")
      .then(response => {
        setSession(response);
      })
      .catch(() => {
        setMessage("Unable to fetch session");
      });
  };

  return (
    <div>
      <ControlledPopup popupMessage={message} />
      <h3>
        <span className="text-muted">User: {profile.login}</span>{" "}
      </h3>
      <table className="tableUserProfile">
        <tbody>
          <tr>
            <th className="headerUserProfile">Attribute</th>
            <th className="headerUserProfile">Value</th>
          </tr>
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
      <div>
        <div className="row">
          <div className="col-12">
            <Link to={"/user/change-password-redirect/" + profile.id}>Change Password</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

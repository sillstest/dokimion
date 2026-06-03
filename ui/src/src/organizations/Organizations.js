import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCogs } from "@fortawesome/free-solid-svg-icons";
import ControlledPopup from "../common/ControlledPopup";
import { FadeLoader } from "react-spinners";
import Backend from "../services/backend";

function Organizations() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    Backend.get("organization")
      .then(response => { setOrganizations(response); setLoading(false); })
      .catch(error => { setErrorMessage("Couldn't get organizations: " + error); setLoading(false); });
  }, []);

  return (
    <div className="container">
      <ControlledPopup popupMessage={errorMessage} />
      <div className="sweet-loading">
        <FadeLoader size={100} color={"#135f38"} loading={loading} />
      </div>
      {organizations.map(organization => (
        <div key={organization.id} className="card organization-card">
          <div className="card-header">
            <span><Link to={"/organizations/" + organization.id}>{organization.name}</Link></span>
            <span className="float-right">
              <Link to={"/organization/" + organization.id + "/settings"}><FontAwesomeIcon icon={faCogs} /></Link>
            </span>
          </div>
          <div className="card-body">
            <p className="card-text">{organization.description || ""}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Organizations;

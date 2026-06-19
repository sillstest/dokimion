import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCogs } from "@fortawesome/free-solid-svg-icons";
import ControlledPopup from "../common/ControlledPopup";
import Backend from "../services/backend";

function Organization({ match }) {
  const orgId = match?.params?.organization;
  const [organization, setOrganization] = useState({
    id: null,
    name: "",
    description: "",
    allowedGroups: [],
    allowedUsers: [],
    admins: [],
  });
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!orgId) return;
    Backend.get("organization/" + orgId)
      .then(response => setOrganization(response))
      .catch(error => setErrorMessage("Couldn't get organization: " + error));
  }, [orgId]);

  return (
    <div>
      <ControlledPopup popupMessage={errorMessage} />
      <div className="organization-header">
        <h1>
          {organization.name}
          <span className="float-right">
            <Link to={"/organizations/" + organization.id + "/settings"} className="organization-title-settings-link">
              <FontAwesomeIcon icon={faCogs} />
            </Link>
          </span>
        </h1>
      </div>
    </div>
  );
}

export default Organization;

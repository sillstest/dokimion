import React, { useState, useEffect } from "react";
import { withRouter } from "../common/withRouter";
import Backend from "../services/backend";
import { Link } from "react-router-dom";

function OrgSelect({ onSessionChange }) {
  const [session, setSession] = useState({ metainfo: { organizations: [] } });

  useEffect(() => {
    Backend.get("user/session")
      .then(response => {
        const s = { ...response };
        s.metainfo = s.metainfo || {};
        s.metainfo.organizations = s.metainfo.organizations || [];
        if (s.metainfo.currentOrganization) {
          window.location = "/";
        } else {
          setSession(s);
        }
      })
      .catch(error => {
        console.log("Org Select ERROR", error);
        window.location = "/auth";
      });
  }, []);

  function changeOrganization(organizationId) {
    Backend.post("user/changeorg/" + organizationId)
      .then(response => {
        if (onSessionChange) onSessionChange(response);
        window.location = "/";
      })
      .catch(() => console.log("Unable to change organization"));
  }

  const orgs = session.metainfo.organizations;

  return (
    <div className="text-center">
      {orgs.length === 0 && (
        <div>
          <h1 className="h3 mb-3 font-weight-normal">You are not a part of any organization</h1>
          <h1 className="h3 mb-3 font-weight-normal">
            Ask your organization administrator to add you or <Link to="/organizations/new"> create a new one</Link>
          </h1>
        </div>
      )}
      {orgs.length > 1 && (
        <div className="select-org">
          <h2>Select Organization</h2>
          {orgs.map((organization, index) => (
            <div key={index} className="clickable card" onClick={() => changeOrganization(organization.id)}>
              <div className="card-body">
                <div className="card-title">{organization.name}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default withRouter(OrgSelect);

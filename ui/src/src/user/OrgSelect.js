import React, { useState, useEffect } from "react";
import Backend from "../services/backend";
import { Link } from "react-router-dom";

const OrgSelect = ({ onSessionChange }) => {
  const [session, setSession] = useState({
    metainfo: { organizations: [] }
  });

  useEffect(() => {
    Backend.get("user/session")
      .then(response => {
        const updatedSession = {
          ...response,
          metainfo: {
            ...response.metainfo,
            organizations: response.metainfo?.organizations || []
          }
        };
        
        setSession(updatedSession);
        
        if (updatedSession.metainfo.currentOrganization) {
          window.location = "/";
        }
      })
      .catch(error => {
        console.log("Org Select ERROR");
        console.log(error);
        window.location = "/auth";
      });
  }, []);

  const changeOrganization = (organizationId) => {
    Backend.post("user/changeorg/" + organizationId)
      .then(response => {
        if (onSessionChange) {
          onSessionChange(response);
        }
        window.location = "/";
      })
      .catch(error => {
        console.log("Unable to change organization");
      });
  };

  return (
    <div className="text-center">
      {session.metainfo.organizations.length === 0 && (
        <div>
          <h1 className="h3 mb-3 font-weight-normal">
            You are not a part of any organization
          </h1>
          <h1 className="h3 mb-3 font-weight-normal">
            Ask your organization administrator to add you or{" "}
            <Link to={"/organizations/new"}>create a new one</Link>
          </h1>
        </div>
      )}
      {session.metainfo.organizations.length > 1 && (
        <div className='select-org'>
          <h2>Select Organization</h2>
          {session.metainfo.organizations.map((organization, index) => (
            <div
              key={organization.id || index}
              className='clickable card'
              onClick={() => changeOrganization(organization.id)}
            >
              <div className='card-body'>
                <div className='card-title'>
                  {organization.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrgSelect;

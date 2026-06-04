import React, { useState, useEffect, useRef } from "react";
import { withRouter } from "../common/withRouter";
import ControlledPopup from "../common/ControlledPopup";
import Backend from "../services/backend";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinusCircle } from "../common/icons";

function normalizeId(id) {
  return id.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
}

function OrganizationForm({ editCurrent, history }) {
  const [organization, setOrganization] = useState({
    id: null, name: "", description: "", allowedGroups: [], allowedUsers: [], admins: [],
  });
  const [administratorsEdit, setAdministratorsEdit] = useState("");
  const [usersEdit, setUsersEdit] = useState("");
  const [readonly, setReadonly] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const currentLogin = useRef("");

  useEffect(() => {
    if (editCurrent) {
      Backend.get("user/session")
        .then(response => {
          currentLogin.current = response.login;
          if ((response.metainfo || {}).organizationsEnabled) {
            Backend.get("organization/" + response.metainfo.currentOrganization)
              .then(org => {
                setOrganization(org);
                setReadonly(!(org.admins || []).includes(currentLogin.current));
              })
              .catch(() => console.log("Unable to fetch organization"));
          }
        })
        .catch(() => console.log("Unable to fetch session"));
    } else {
      Backend.get("user/session")
        .then(response => {
          currentLogin.current = response.login;
          setOrganization(prev => ({ ...prev, admins: [...prev.admins, response.login] }));
        })
        .catch(() => console.log("Unable to fetch session"));
    }
  }, [editCurrent]);

  function handleChange(event) {
    const updated = { ...organization, [event.target.name]: event.target.value };
    if (event.target.name === "name") updated.id = normalizeId(event.target.value);
    setOrganization(updated);
  }

  function handleAdminAdded(event) {
    if (administratorsEdit !== "") {
      setOrganization(prev => ({ ...prev, admins: [...prev.admins, administratorsEdit] }));
      setAdministratorsEdit("");
    }
    event.preventDefault();
  }

  function handleAdminDeleted(index) {
    setOrganization(prev => ({ ...prev, admins: prev.admins.filter((_, i) => i !== index) }));
  }

  function handleUserAdded(event) {
    if (usersEdit !== "") {
      setOrganization(prev => ({ ...prev, allowedUsers: [...prev.allowedUsers, usersEdit] }));
      setUsersEdit("");
    }
    event.preventDefault();
  }

  function handleUserDeleted(index) {
    setOrganization(prev => ({ ...prev, allowedUsers: prev.allowedUsers.filter((_, i) => i !== index) }));
  }

  function handleCreate(event) {
    Backend.post("organization", organization)
      .then(response => history.push("/organizations/" + response.id))
      .catch(error => setErrorMessage("Couldn't create organization: " + error));
    event.preventDefault();
  }

  function handleUpdate(event) {
    Backend.put("organization", organization)
      .then(response => history.push("/organizations/" + response.id))
      .catch(error => setErrorMessage("Couldn't update organization: " + error));
    event.preventDefault();
  }

  return (
    <div className="org-form">
      <ControlledPopup popupMessage={errorMessage} />
      {editCurrent ? (
        <div>
          <h1>Update Organization</h1>
          <div>
            <b>{organization.licenseCapacity}</b> parallel user sessions are currently available for organization.
            <br />
            Please <a href="https://www.testquack.com/#contacts" target="_blanc">contact us</a> to purchase more.
          </div>
        </div>
      ) : (
        <h1>Create Organization</h1>
      )}

      <form>
        <div className="org-form-block">
          <div className="form-group row">
            <label className="col-sm-3 col-form-label">Name</label>
            <div className="col-sm-9">
              <input type="text" name="name" value={organization.name} onChange={handleChange} className="form-control" disabled={readonly} />
            </div>
          </div>
          <div className="form-group row">
            <label className="col-sm-3 col-form-label">Organization ID</label>
            <div className="col-sm-9">
              <input type="text" name="id" value={organization.id || ""} onChange={handleChange} disabled={!!editCurrent} className="form-control" />
            </div>
          </div>
          <div className="form-group row">
            <label className="col-sm-3 col-form-label">Description</label>
            <div className="col-sm-9">
              <input type="text" name="description" className="form-control" value={organization.description} onChange={handleChange} disabled={readonly} />
            </div>
          </div>
        </div>

        <div className="org-form-block">
          <h4>Administrators</h4>
          {organization.admins.map((admin, index) => (
            <div key={index}>
              {admin}
              {!readonly && currentLogin.current !== admin && (
                <span className="clickable edit-icon-visible red" onClick={() => handleAdminDeleted(index)}>
                  <FontAwesomeIcon icon={faMinusCircle} />
                </span>
              )}
            </div>
          ))}
          {!readonly && (
            <div className="row org-users-form">
              <div className="col-sm-8">
                <input type="text" name="administrators" className="form-control" value={administratorsEdit} onChange={e => setAdministratorsEdit(e.target.value)} />
              </div>
              <div className="col-sm-4">
                <button type="button" className="btn btn-primary" onClick={handleAdminAdded}>Add Administrator</button>
              </div>
            </div>
          )}
        </div>

        <div className="org-form-block">
          <h4>Users</h4>
          {organization.allowedUsers.map((user, index) => (
            <div key={index}>
              {user}
              {!readonly && (
                <span className="clickable edit-icon-visible red" onClick={() => handleUserDeleted(index)}>
                  <FontAwesomeIcon icon={faMinusCircle} />
                </span>
              )}
            </div>
          ))}
          {!readonly && (
            <div className="row org-users-form">
              <div className="col-sm-8">
                <input type="text" name="users" className="form-control" value={usersEdit} onChange={e => setUsersEdit(e.target.value)} />
              </div>
              <div className="col-sm-4">
                <button type="button" className="btn btn-primary" onClick={handleUserAdded}>Add User</button>
              </div>
            </div>
          )}
        </div>

        <div className="org-form-block">
          {editCurrent && !readonly && (
            <button type="button" className="btn btn-primary" onClick={handleUpdate}>Update</button>
          )}
          {!editCurrent && (
            <button type="button" className="btn btn-primary" onClick={handleCreate}>Create</button>
          )}
        </div>
      </form>
    </div>
  );
}

export default withRouter(OrganizationForm);

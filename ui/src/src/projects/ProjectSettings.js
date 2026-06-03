/* eslint-disable eqeqeq */
import { withRouter } from "../common/withRouter";
import React, { useState, useEffect, useRef } from "react";
import AsyncSelect from "react-select/async";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt } from "@fortawesome/free-solid-svg-icons";
import $ from "jquery";
import Backend from "../services/backend";
import ControlledPopup from "../common/ControlledPopup";
import * as Utils from "../common/Utils";

const emptyProject = () => ({ id: null, name: "", description: "", readWriteUsers: [], launcherConfigs: [], environments: [] });

function mapUsersToView(users) {
  return (users || []).map(val => {
    const tokens = val.split(":");
    return tokens.length === 1 ? { value: val, label: val } : { value: tokens[0], label: tokens[1] };
  });
}

function ProjectSettings({ match, onSessionChange }) {
  const projectId = match?.params?.project;
  const [project, setProject] = useState(emptyProject());
  const [originalProject, setOriginalProject] = useState(emptyProject());
  const [usersToDisplay, setUsersToDisplay] = useState([]);
  const [launcherDescriptors, setLauncherDescriptors] = useState([]);
  const [session, setSession] = useState({ person: {} });
  const [errorMessage, setErrorMessage] = useState("");
  const launcherIndexToRemove = useRef(null);

  useEffect(() => {
    if (!projectId) return;
    Backend.get("project/" + projectId)
      .then(response => {
        setProject(response);
        setOriginalProject(response);
        setUsersToDisplay(mapUsersToView(response.readWriteUsers || []));
      })
      .catch(error => setErrorMessage("Couldn't get project: " + error));

    Backend.get("launcher/descriptors")
      .then(response => setLauncherDescriptors(response))
      .catch(error => console.log("Couldn't get launcher descriptors: " + error));

    Backend.get("user/session")
      .then(response => setSession(response))
      .catch(() => console.log("Unable to fetch session"));
  }, [projectId]);

  function getUsers(literal, callback) {
    let url = "user/users/suggest?limit=20";
    if (literal) url += "&literal=" + literal;
    return Backend.get(url)
      .then(response => {
        const mapped = mapUsersToView(response);
        callback(mapped);
        return mapped;
      })
      .catch(error => console.log(error));
  }

  function changeUsers(values) {
    const users = (values || []).map(v => v.value);
    setProject(prev => ({ ...prev, readWriteUsers: users }));
    setUsersToDisplay(mapUsersToView(users));
  }

  function handleChange(fieldName, event) {
    setProject(prev => ({ ...prev, [fieldName]: event.target.value }));
  }

  function toggleEdit(fieldName, event) {
    if (!fieldName) return;
    if ($("#" + fieldName + "-display").offsetParent !== null) {
      setOriginalProject(prev => ({ ...prev, [fieldName]: project[fieldName] }));
    }
    $("#" + fieldName + "-display").toggle();
    $("#" + fieldName + "-form").toggle();
    if (event) event.preventDefault();
  }

  function cancelEdit(fieldName, event) {
    setProject(prev => ({ ...prev, [fieldName]: originalProject[fieldName] }));
    toggleEdit(fieldName, event);
  }

  function submit(event, fieldName) {
    if (!project) return;
    Backend.put("project", project)
      .then(response => {
        setProject(response);
        setOriginalProject(response);
        if (fieldName) toggleEdit(fieldName);
        setErrorMessage("Project Settings successfully saved");
      })
      .catch(error => setErrorMessage("Couldn't save project: " + error));
    if (event) event.preventDefault();
  }

  function removeProject(event) {
    Backend.delete("project/" + project.id)
      .then(() => { window.location.href = "/"; })
      .catch(error => setErrorMessage("Couldn't delete project: " + error));
    event.preventDefault();
  }

  function undelete(event) {
    const updated = { ...project, deleted: false };
    setProject(updated);
    Backend.put("project", updated)
      .then(response => { setProject(response); setOriginalProject(response); })
      .catch(error => setErrorMessage("Couldn't save project: " + error));
    if (event) event.preventDefault();
  }

  return (
    <div>
      <ControlledPopup popupMessage={errorMessage} />
      <div id="name" className="project-header">
        <div id="name-display" className="inplace-display">
          {project.deleted ? (
            <h1>
              <s>{project.name}</s> - DELETED
              <button type="button" className="btn" onClick={undelete}>Undelete</button>
            </h1>
          ) : (
            <h1>
              {project.name}
              <span className="edit edit-icon clickable" onClick={e => toggleEdit("name", e)}>
                <FontAwesomeIcon icon={faPencilAlt} />
              </span>
            </h1>
          )}
        </div>
        <div id="name-form" className="inplace-form" style={{ display: "none" }}>
          <form>
            <div className="form-group row">
              <div className="col-8">
                <input type="text" name="name" className="form-control" onChange={e => handleChange("name", e)} value={project.name} />
              </div>
              <div className="col-4">
                <button type="button" className="btn btn-light" data-dismiss="modal" onClick={e => cancelEdit("name", e)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={e => submit(e, "name")}>Save</button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {Utils.isAdmin(session) && (
        <div className="project-settings-section">
          <h3>Permissions</h3>
          <div className="row form-group">
            <label className="col-1 col-form-label">Users</label>
            <div className="col-6">
              <AsyncSelect
                value={usersToDisplay}
                isMulti
                cacheOptions
                defaultOptions={true}
                loadOptions={getUsers}
                onChange={changeUsers}
              />
            </div>
          </div>
        </div>
      )}

      <div className="project-settings-control row">
        <div className="col-1">
          <button type="button" className="btn btn-success" onClick={submit}>Save</button>
        </div>
        <div className="col-2">
          <button type="button" className="btn btn-danger" data-toggle="modal" data-target="#remove-project-confirmation">
            Remove Project
          </button>
        </div>
      </div>

      <div className="modal fade" tabIndex="-1" role="dialog" id="remove-project-confirmation">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Remove Project</h5>
              <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">Are you sure you want to remove Project?</div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-dismiss="modal" aria-label="Cancel">Close</button>
              {!project.deleted && (
                <button type="button" className="btn btn-danger" data-dismiss="modal" onClick={removeProject}>Remove Project</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withRouter(ProjectSettings);

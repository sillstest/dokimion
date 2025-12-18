/* eslint-disable eqeqeq */
import React, { useState, useEffect, useCallback } from "react";
import AsyncSelect from "react-select/async";
import CreatableSelect from "react-select/creatable";
import LauncherForm from "../launches/LauncherForm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt, faMinusCircle } from "@fortawesome/free-solid-svg-icons";
import $ from "jquery";
import Backend from "../services/backend";
import ControlledPopup from "../common/ControlledPopup";
import * as Utils from "../common/Utils";
import { useParams } from "react-router-dom";

const ProjectSettings = ({ onSessionChange }) => {
  const { project: projectId } = useParams();

  const [project, setProject] = useState({
    id: null,
    name: "",
    description: "",
    readWriteUsers: [],
    launcherConfigs: [],
    environments: [],
  });

  const [originalProject, setOriginalProject] = useState({
    id: null,
    name: "",
    description: "",
    readWriteUsers: [],
    environments: [],
  });

  const [users, setUsers] = useState([]);
  const [usersToDisplay, setUsersToDisplay] = useState([]);
  const [launcherDescriptors, setLauncherDescriptors] = useState([]);
  const [launcherIndexToRemove, setLauncherIndexToRemove] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [session, setSession] = useState({ person: {} });

  const mapUsersToView = useCallback((usersList) => {
    return usersList.map((val) => {
      const tokens = val.split(":");
      if (tokens.length == 1) {
        return { value: val, label: val };
      }
      return { value: tokens[0], label: tokens[1] };
    });
  }, []);

  const refreshUsersToDisplay = useCallback(() => {
    setUsersToDisplay(mapUsersToView(project.readWriteUsers || []));
  }, [project.readWriteUsers, mapUsersToView]);

  const getSession = useCallback(() => {
    Backend.get("user/session")
      .then((response) => {
        setSession(response);
      })
      .catch(() => {
        console.log("Unable to fetch session");
      });
  }, []);

  const getUsers = useCallback(
    (literal, callback) => {
      let url = "user/users/suggest?limit=20";
      if (literal) {
        url = url + "&literal=" + literal;
      }
      Backend.get(url)
        .then((response) => {
          setUsers(response);
          callback(mapUsersToView(response));
        })
        .catch((error) => console.log(error));
    },
    [mapUsersToView]
  );

  const changeUsers = useCallback((values) => {
    setProject((prev) => ({
      ...prev,
      readWriteUsers: values.map((value) => value.value),
    }));
  }, []);

  const changeEnvironments = useCallback((values) => {
    setProject((prev) => ({
      ...prev,
      environments: values.map((value) => value.value),
    }));
  }, []);

  const submit = useCallback(
    (event, name) => {
      if (project === undefined || project == "") {
        console.log("project undefined or null");
        return;
      }
      Backend.put("project", project)
        .then((response) => {
          setProject(response);
          setOriginalProject(response);
          if (name) {
            toggleEdit(name);
          }
          setErrorMessage("submit::Project Settings successfully saved");
        })
        .catch((error) => {
          setErrorMessage("submit::Couldn't save project, error: " + error);
        });
      if (event) {
        event.preventDefault();
      }
    },
    [project]
  );

  const removeProject = useCallback(
    (event) => {
      Backend.delete("project/" + project.id)
        .then(() => {
          window.location.href = "/";
        })
        .catch((error) => {
          setErrorMessage("removeProject::Couldn't delete project, error: " + error);
        });
      event.preventDefault();
    },
    [project.id]
  );

  const undelete = useCallback(
    (event) => {
      setProject((prev) => ({ ...prev, deleted: false }));
      submit(event);
    },
    [submit]
  );

  const toggleEdit = useCallback((fieldName, event) => {
    if (!fieldName) return;
    const fieldId = fieldName;
    $("#" + fieldId + "-display").toggle();
    $("#" + fieldId + "-form").toggle();
    if (event) {
      event.preventDefault();
    }
  }, []);

  const handleChange = useCallback((fieldName, event) => {
    setProject((prev) => ({
      ...prev,
      [fieldName]: event.target.value,
    }));
  }, []);

  const handleLauncherChange = useCallback(
    (event, index, propertyKey) => {
      setProject((prev) => {
        const newProject = { ...prev };
        const selectedConfig = { ...newProject.launcherConfigs[index] };

        if (propertyKey == "launcherId") {
          selectedConfig.launcherId = event.target.value;
        } else if (propertyKey == "name") {
          selectedConfig.name = event.target.value;
        } else {
          selectedConfig.properties = {
            ...selectedConfig.properties,
            [propertyKey]: event.target.value,
          };
        }

        // Do not leave name blank, set either descriptor name or descriptor id
        if (selectedConfig.name == undefined) {
          const descriptor = Utils.getLaunchDescriptor(
            launcherDescriptors,
            selectedConfig.launcherId
          );
          if (descriptor.name && descriptor.name != "") {
            selectedConfig.name = descriptor.name;
          } else {
            selectedConfig.name = selectedConfig.launcherId;
          }
        }

        newProject.launcherConfigs[index] = selectedConfig;
        return newProject;
      });
    },
    [launcherDescriptors]
  );

  const cancelEdit = useCallback(
    (fieldName, event) => {
      setProject((prev) => ({
        ...prev,
        [fieldName]: originalProject[fieldName],
      }));
      toggleEdit(fieldName, event);
    },
    [originalProject, toggleEdit]
  );

  const addLauncher = useCallback(() => {
    setProject((prev) => ({
      ...prev,
      launcherConfigs: [...(prev.launcherConfigs || []), { properties: {} }],
    }));
  }, []);

  const removeLauncherConfirmation = useCallback((index) => {
    setLauncherIndexToRemove(index);
    $("#remove-launcher-confirmation").modal("show");
  }, []);

  const cancelRemoveLauncherConfirmation = useCallback(() => {
    setLauncherIndexToRemove(null);
    $("#remove-launcher-confirmation").modal("hide");
  }, []);

  const removeLauncher = useCallback(() => {
    if (launcherIndexToRemove == null) return;
    setProject((prev) => {
      const newConfigs = [...prev.launcherConfigs];
      newConfigs.splice(launcherIndexToRemove, 1);
      return { ...prev, launcherConfigs: newConfigs };
    });
    setLauncherIndexToRemove(null);
    $("#remove-launcher-confirmation").modal("hide");
    submit();
  }, [launcherIndexToRemove, submit]);

  // Initial project load
  useEffect(() => {
    Backend.get("project/" + projectId)
      .then((response) => {
        setProject(response);
        setOriginalProject(response);
      })
      .catch((error) => {
        setErrorMessage("componentWillMount::Couldn't get project: " + error);
      });
  }, [projectId]);

  // Load launcher descriptors and session
  useEffect(() => {
    Backend.get("launcher/descriptors")
      .then((response) => {
        setLauncherDescriptors(response);
      })
      .catch((error) => {
        console.log("Couldn't get launcher descriptors: " + error);
      });

    getSession();
  }, [getSession]);

  // Refresh users to display when project changes
  useEffect(() => {
    refreshUsersToDisplay();
  }, [project.readWriteUsers, refreshUsersToDisplay]);

  return (
    <div>
      <ControlledPopup popupMessage={errorMessage} />
      <div id="name" className="project-header">
        <div id="name-display" className="inplace-display">
          {project.deleted && (
            <h1>
              <s>{project.name}</s> - DELETED
              <button type="button" className="btn" onClick={undelete}>
                Undelete
              </button>
            </h1>
          )}
          {!project.deleted && (
            <h1>
              {project.name}
              <span
                className="edit edit-icon clickable"
                onClick={(e) => toggleEdit("name", e)}
              >
                <FontAwesomeIcon icon={faPencilAlt} />
              </span>
            </h1>
          )}
        </div>
        <div id="name-form" className="inplace-form" style={{ display: "none" }}>
          <form>
            <div className="form-group row">
              <div className="col-8">
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  onChange={(e) => handleChange("name", e)}
                  value={project.name}
                />
              </div>
              <div className="col-4">
                <button
                  type="button"
                  className="btn btn-light"
                  data-dismiss="modal"
                  onClick={(e) => cancelEdit("name", e)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={(e) => submit(e, "name")}
                >
                  Save
                </button>
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
                options={mapUsersToView(users)}
              />
            </div>
          </div>
        </div>
      )}

      <div className="project-settings-section">
        <form>
          <div className="row form-group">
            <label className="col-1 col-form-label">Environments</label>
            <div className="col-6">
              <CreatableSelect
                value={(project.environments || []).map((val) => ({
                  value: val,
                  label: val,
                }))}
                isMulti
                isClearable
                cacheOptions
                onChange={changeEnvironments}
                options={[]}
              />
            </div>
          </div>
        </form>

        <div className="row project-settings-launchers">
          {(project.launcherConfigs || []).map((config, i) => (
            <div className="card col-6" key={i}>
              <div className="card-header row">
                <div className="col-11">{config.name || ""}</div>
                <div className="col-1">
                  <span className="float-right clickable edit-icon-visible red">
                    <FontAwesomeIcon
                      icon={faMinusCircle}
                      index={i}
                      onClick={() => removeLauncherConfirmation(i)}
                    />
                  </span>
                </div>
              </div>
              <div className="card-body">
                <LauncherForm
                  launcherDescriptors={launcherDescriptors}
                  selectableType={true}
                  launcherConfig={config}
                  configIndex={i}
                  handleLauncherChange={handleLauncherChange}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="project-settings-control row">
        <div className="col-10">
          <button type="button" className="btn btn-success" onClick={submit}>
            Save
          </button>
        </div>
        <div className="col-2">
          <button
            type="button"
            className="btn btn-danger"
            data-toggle="modal"
            data-target="#remove-project-confirmation"
          >
            Remove Project
          </button>
        </div>
      </div>

      <div
        className="modal fade"
        tabIndex="-1"
        role="dialog"
        id="remove-project-confirmation"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Remove Project</h5>
              <button
                type="button"
                className="close"
                data-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              Are you sure you want to remove Project?
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-dismiss="modal"
                aria-label="Cancel"
              >
                Close
              </button>
              {!project.deleted && (
                <button
                  type="button"
                  className="btn btn-danger"
                  data-dismiss="modal"
                  onClick={removeProject}
                >
                  Remove Project
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className="modal fade"
        tabIndex="-1"
        role="dialog"
        id="remove-launcher-confirmation"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Remove Launcher</h5>
              <button
                type="button"
                className="close"
                onClick={cancelRemoveLauncherConfirmation}
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              Are you sure you want to remove Launcher?
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={cancelRemoveLauncherConfirmation}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={removeLauncher}
              >
                Remove Launcher
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSettings;

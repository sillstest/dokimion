/* eslint-disable eqeqeq */
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { withRouter } from "../common/withRouter";
import CreatableSelect from "react-select/creatable";
import LauncherForm from "../launches/LauncherForm";
import $ from "jquery";
import * as Utils from "../common/Utils";
import { FadeLoader } from "react-spinners";
import ControlledPopup from "../common/ControlledPopup";
import Backend from "../services/backend";

const defaultLaunch = () => ({
  name: "", testSuite: { filter: {} }, properties: [],
  launcherConfig: { properties: {} }, configAttributePairs: [],
});

function LaunchForm({ restart: restartProp, failedOnly: failedOnlyProp, testSuite: testSuiteProp,
                      launch: launchProp, modalName: modalNameProp, match }) {
  const [launch, setLaunch] = useState(defaultLaunch());
  const [restart, setRestart] = useState(restartProp || false);
  const [failedOnly, setFailedOnly] = useState(failedOnlyProp || false);
  const [modalName, setModalName] = useState(modalNameProp);
  const [project, setProject] = useState({ id: null, name: "", description: "", allowedGroups: [], launcherConfigs: [] });
  const [projectAttributes, setProjectAttributes] = useState([{ name: "", values: [] }]);
  const [projectAttributeNames, setProjectAttributeNames] = useState([]);
  const [launcherDescriptors, setLauncherDescriptors] = useState([]);
  const [noAttributes, setNoAttributes] = useState(0);
  const [displayAttributeIndex, setDisplayAttributeIndex] = useState({ top: 0, bottom: 0 });
  const [displayAttributeName, setDisplayAttributeName] = useState({ top: "", bottom: "" });
  const [displayAttributeValues, setDisplayAttributeValues] = useState({ top: [], bottom: [] });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const projectId = match?.params?.project;
    if (!projectId) return;

    Backend.get(projectId + "/attribute")
      .then(response => {
        const attrs = [];
        const names = [];
        response.forEach(r => {
          if (r.type == "LAUNCH") {
            const values = r.attrValues.map(v => v.value);
            attrs.push({ name: r.name, values });
            names.push(r.name);
          }
        });
        setProjectAttributes(attrs);
        setProjectAttributeNames(names);
      })
      .catch(error => console.log(error));

    Backend.get("project/" + projectId)
      .then(response => setProject(response))
      .catch(error => setErrorMessage("Couldn't get project: " + error));

    Backend.get("launcher/descriptors")
      .then(response => setLauncherDescriptors(response))
      .catch(error => setErrorMessage("Couldn't get launcher descriptors: " + error));
  }, [match?.params?.project]);

  useEffect(() => {
    if (restartProp !== undefined) setRestart(restartProp || false);
    if (failedOnlyProp !== undefined) setFailedOnly(failedOnlyProp || false);
    if (testSuiteProp) setLaunch(prev => ({ ...prev, testSuite: testSuiteProp }));
    if (launchProp && launchProp.id) setLaunch(launchProp);
    if (modalNameProp) setModalName(modalNameProp);
  }, [restartProp, failedOnlyProp, testSuiteProp, launchProp, modalNameProp]);

  function handleChange(event) {
    setLaunch(prev => ({ ...prev, [event.target.name]: event.target.value }));
  }

  function handleAddAttribute() {
    if (noAttributes <= 1) {
      if (projectAttributes.length >= 1) {
        setNoAttributes(n => n + 1);
      } else {
        setErrorMessage("Invalid number of LAUNCH attributes");
      }
    } else {
      setErrorMessage("Maximum number LAUNCH attributes = 2");
    }
  }

  function changeLaunchConfigAttribute(values, position) {
    for (let i = 0; i < projectAttributes.length; i++) {
      if (projectAttributes[i].name == values.value) {
        setDisplayAttributeName(prev => ({ ...prev, [position]: values.value }));
        setDisplayAttributeIndex(prev => ({ ...prev, [position]: i }));
        break;
      }
    }
  }

  function changeLaunchConfigAttributeValues(values, position) {
    const val = values.length > 0 ? values[values.length - 1].value : [];
    setDisplayAttributeValues(prev => ({ ...prev, [position]: val }));
  }

  function handleLauncherChange(event, index, propertyKey) {
    if (propertyKey == "uuid") {
      const config = project.launcherConfigs.find(c => c.uuid == event.target.value) || {};
      setLaunch(prev => ({ ...prev, launcherConfig: config }));
    } else {
      setLaunch(prev => ({
        ...prev,
        launcherConfig: { ...prev.launcherConfig, properties: { ...prev.launcherConfig.properties, [propertyKey]: event.target.value } },
      }));
    }
  }

  function launchModalDismiss() {
    if (typeof modalName === "string" && modalName.length > 0 && modalName === "launch-modal") {
      $("#launch-modal").modal("hide");
    } else {
      $("#restart-launch-modal").modal("hide");
    }
  }

  function handleSubmit(event) {
    setLoading(true);
    const filters = (launch.testSuite.filter.filters || []).filter(f => f.id !== undefined && f.id !== null);
    filters.forEach(f => delete f.title);

    const configAttributePairs = [...launch.configAttributePairs];
    if (displayAttributeName.top !== "") configAttributePairs.push({ name: displayAttributeName.top, value: displayAttributeValues.top });
    if (displayAttributeName.bottom !== "") configAttributePairs.push({ name: displayAttributeName.bottom, value: displayAttributeValues.bottom });

    const launchToPost = { ...launch, testSuite: { ...launch.testSuite, filter: { ...launch.testSuite.filter, filters } }, configAttributePairs };

    let url = match.params.project + "/launch/";
    if (restart) {
      url = match.params.project + "/launch/" + launch.id + "/restart";
      if (failedOnly) url += "?failedOnly=true";
    }

    Backend.post(url, launchToPost)
      .then(response => {
        const updated = { ...response };
        if (!updated.id) updated.triggeredByLauncher = true;
        setLaunch(updated);
        setRestart(false);
        setLoading(false);
      })
      .catch(error => {
        setLoading(false);
        setErrorMessage("Couldn't save launch: " + error);
      });
    event.preventDefault();
  }

  let modalBody;
  if (launch.id && !restart && !launch.launchGroup) {
    modalBody = (
      <div className="modal-body" id="launch-created">
        <Link onClick={launchModalDismiss} to={"/" + match.params.project + "/launch/" + launch.id} className="dropdown-item">
          Go To Launch
        </Link>
      </div>
    );
  } else if (launch.id && !restart && launch.launchGroup) {
    modalBody = (
      <div className="modal-body" id="launch-created">
        <Link onClick={launchModalDismiss} to={"/" + match.params.project + "/launches?launchGroup=" + launch.launchGroup} className="dropdown-item">
          Go To Launch Group
        </Link>
      </div>
    );
  } else if (launch.triggeredByLauncher && !restart) {
    modalBody = (
      <div className="modal-body" id="launch-created">
        Launch was triggered using {launch.launcherConfig.name}
      </div>
    );
  } else {
    modalBody = (
      <div className="modal-body" id="launch-creation-form">
        <form>
          <div className="form-group row">
            <label className="col-4 col-form-label">Name</label>
            <div className="col-8">
              <input type="text" className="form-control" name="name" value={launch.name || ""} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group row">
            <div className="col-sm-4">
              <button type="button" className="btn btn-primary" onClick={handleAddAttribute}>Add Attribute</button>
            </div>
          </div>
          {noAttributes >= 1 && (
            <>
              <div className="form-group row">
                <label className="col-4 col-form-label">Launch Configuration Attribute #1</label>
                <div className="col-8">
                  <CreatableSelect
                    onChange={value => changeLaunchConfigAttribute(value, "top")}
                    options={projectAttributeNames.map(val => ({ value: val, label: val }))}
                  />
                </div>
              </div>
              <div className="form-group row">
                <label className="col-4 col-form-label">Launch Configuration Attribute Values #1</label>
                <div className="col-8">
                  <CreatableSelect
                    isMulti
                    onChange={values => changeLaunchConfigAttributeValues(values, "top")}
                    options={(projectAttributes[displayAttributeIndex.top]?.values || []).map(val => ({ value: val, label: val }))}
                  />
                </div>
              </div>
            </>
          )}
          {noAttributes === 2 && (
            <>
              <div className="form-group row">
                <label className="col-4 col-form-label">Launch Configuration Attribute #2</label>
                <div className="col-8">
                  <CreatableSelect
                    onChange={value => changeLaunchConfigAttribute(value, "bottom")}
                    options={projectAttributeNames.map(val => ({ value: val, label: val }))}
                  />
                </div>
              </div>
              <div className="form-group row">
                <label className="col-4 col-form-label">Launch Configuration Attribute Values #2</label>
                <div className="col-8">
                  <CreatableSelect
                    isMulti
                    onChange={values => changeLaunchConfigAttributeValues(values, "bottom")}
                    options={(projectAttributes[displayAttributeIndex.bottom]?.values || []).map(val => ({ value: val, label: val }))}
                  />
                </div>
              </div>
            </>
          )}
        </form>
        <div>
          {launch.launcherConfig && launch.launcherConfig.uuid && (
            <LauncherForm
              launcherConfig={launch.launcherConfig}
              configIndex={0}
              selectableType={false}
              handleLauncherChange={handleLauncherChange}
              launcherDescriptors={launcherDescriptors}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="modal-dialog" role="document">
      <ControlledPopup popupMessage={errorMessage} />
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Create Launch</h5>
          <button type="button" className="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        {loading && (
          <div className="sweet-loading launch-form-spinner">
            <FadeLoader size={100} color={"#135f38"} loading={loading} />
          </div>
        )}
        {!loading && (
          <div>
            <div>{modalBody}</div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
              {(!launch.id || restart) && (
                <button type="button" className="btn btn-primary" onClick={handleSubmit}>Create Launch</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default withRouter(LaunchForm);

/* eslint-disable eqeqeq */
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import CreatableSelect from "react-select/creatable";
import LauncherForm from "../launches/LauncherForm";
import * as Utils from "../common/Utils";
import { FadeLoader } from "react-spinners";
import ControlledPopup from "../common/ControlledPopup";
import Backend from "../services/backend";
import $ from 'jquery';
window.$ = window.jQuery = $;

const LaunchForm = (props) => {
  const { project: projectId } = useParams();
  
  const [launch, setLaunch] = useState({
    name: "",
    testSuite: { filter: {} },
    properties: [],
    launcherConfig: { properties: {} },
    configAttributePairs: [],
  });
  const [noAttributes, setNoAttributes] = useState(0);
  const [projectAttributeNames, setProjectAttributeNames] = useState([]);
  const [projectAttributes, setProjectAttributes] = useState([{ name: "", values: [] }]);
  const [displayAttributeIndex, setDisplayAttributeIndex] = useState({
    top: 0,
    bottom: 0,
  });
  const [displayAttributeName, setDisplayAttributeName] = useState({
    top: "",
    bottom: "",
  });
  const [displayAttributeValues, setDisplayAttributeValues] = useState({
    top: [],
    bottom: [],
  });
  const [project, setProject] = useState({
    id: null,
    name: "",
    description: "",
    allowedGroups: [],
    launcherConfigs: [],
  });
  const [launcherDescriptors, setLauncherDescriptors] = useState([]);
  const [restart, setRestart] = useState(props.restart || false);
  const [failedOnly, setFailedOnly] = useState(props.failedOnly || false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [modalName, setModalName] = useState(props.modalName);
  const [configurationAttributes, setConfigurationAttributes] = useState([]);
  const [configAttributesFilter] = useState({
    skip: 0,
    limit: 20,
    orderby: "project",
    orderdir: "ASC",
    includedFields: "project, names",
  });

  // Get attributes
  const getAttributes = () => {
    Backend.get(projectId + "/attribute")
      .then(response => {
        const newProjectAttributes = [];
        const newProjectAttributeNames = [];
        
        response.forEach(attr => {
          if (attr.type == "LAUNCH") {
            const tempAttrib = { name: "", values: [] };
            tempAttrib.name = attr.name;
            newProjectAttributeNames.push(tempAttrib.name);
            const tempValues = [];
            for (let j = 0; j < attr.attrValues.length; j++) {
              tempValues.push(attr.attrValues[j].value);
            }
            tempAttrib.values = tempValues;
            newProjectAttributes.push(tempAttrib);
          }
        });
        
        setProjectAttributes(newProjectAttributes);
        setProjectAttributeNames(newProjectAttributeNames);
      })
      .catch(error => console.log(error));
  };

  // Handle add attribute
  const handleAddAttribute = () => {
    if (noAttributes <= 1) {
      if (projectAttributes.length >= 1) {
        setNoAttributes(prev => prev + 1);
      } else {
        setErrorMessage("handleAddAttribute::Invalid number of LAUNCH attributes");
      }
    } else {
      setErrorMessage("handleAddAttribute::Maximum number LAUNCH attributes = 2");
    }
  };

  // Handle change
  const handleChange = (event) => {
    setLaunch(prev => ({
      ...prev,
      [event.target.name]: event.target.value
    }));
  };

  // Handle submit
  const handleSubmit = (event) => {
    setLoading(true);
    
    const updatedLaunch = { ...launch };
    updatedLaunch.testSuite.filter.filters = (updatedLaunch.testSuite.filter.filters || []).filter(
      filter => filter.id !== undefined && filter.id !== null
    );
    updatedLaunch.testSuite.filter.filters.forEach(filter => {
      delete filter.title;
    });
    
    let url = projectId + "/launch/";
    if (restart) {
      url = projectId + "/launch/" + updatedLaunch.id + "/restart";
      if (failedOnly) {
        url += "?failedOnly=true";
      }
    }
    
    // Copy display attributes (name, values) to launch.configurationAttributes
    if (displayAttributeName.top !== "") {
      updatedLaunch.configAttributePairs.push({
        name: displayAttributeName.top,
        value: displayAttributeValues.top
      });
    }

    if (displayAttributeName.bottom !== "") {
      updatedLaunch.configAttributePairs.push({
        name: displayAttributeName.bottom,
        value: displayAttributeValues.bottom
      });
    }

    Backend.post(url, updatedLaunch)
      .then(response => {
        const newLaunch = response;
        if (!newLaunch.id) {
          newLaunch.triggeredByLauncher = true;
        }
        setLaunch(newLaunch);
        setRestart(false);
        setLoading(false);
      })
      .catch(error => {
        setLoading(false);
        setErrorMessage("handleSubmit::Couldn't save launch: " + error);
      });
    event.preventDefault();
  };

  // Handle launcher change
  const handleLauncherChange = (event, index, propertyKey) => {
    if (propertyKey == "uuid") {
      const foundConfig = project.launcherConfigs.find(config => config.uuid == event.target.value) || {};
      setLaunch(prev => ({
        ...prev,
        launcherConfig: foundConfig
      }));
    } else {
      setLaunch(prev => ({
        ...prev,
        launcherConfig: {
          ...prev.launcherConfig,
          properties: {
            ...prev.launcherConfig.properties,
            [propertyKey]: event.target.value
          }
        }
      }));
    }
  };

  // Change launch config attribute
  const changeLaunchConfigAttribute = (values, position) => {
    for (let i = 0; i < projectAttributes.length; i++) {
      if (projectAttributes[i].name == values.value) {
        setDisplayAttributeName(prev => ({
          ...prev,
          [position]: values.value
        }));
        setDisplayAttributeIndex(prev => ({
          ...prev,
          [position]: i
        }));
        break;
      }
    }
  };

  // Change launch config attribute values
  const changeLaunchConfigAttributeValues = (values, position) => {
    for (let i = 0; i < values.length; i++) {
      setDisplayAttributeValues(prev => ({
        ...prev,
        [position]: values[i].value
      }));
    }
  };

  // Launch modal dismiss
  const launchModalDismiss = () => {
    if (typeof modalName === 'string' && modalName.length > 0 && modalName === 'launch-modal') {
      $("#launch-modal").modal("hide");
    } else {
      $("#restart-launch-modal").modal("hide");
    }
  };

  // Update from props
  useEffect(() => {
    setRestart(props.restart || false);
    setFailedOnly(props.failedOnly || false);
    
    if (props.testSuite) {
      setLaunch(prev => ({
        ...prev,
        testSuite: props.testSuite
      }));
    }
    
    if (props.launch && props.launch.id) {
      setLaunch(props.launch);
    }
    
    if (props.modalName) {
      setModalName(props.modalName);
    }
  }, [props.restart, props.failedOnly, props.testSuite, props.launch, props.modalName]);

  // Component mount
  useEffect(() => {
    getAttributes();

    Backend.get("project/" + projectId)
      .then(response => {
        setProject(response);
      })
      .catch(error => {
        setErrorMessage("componentDidMount::Couldn't get project, error: " + error);
      });

    Backend.get("launcher/descriptors")
      .then(response => {
        setLauncherDescriptors(response);
      })
      .catch(error => {
        setErrorMessage("componentDidMount::Couldn't get launcher descriptors, error: " + error);
      });
  }, [projectId]);

  let modalBody;
  if (launch.id && !restart && !launch.launchGroup) {
    modalBody = (
      <div className="modal-body" id="launch-created">
        <Link
          onClick={launchModalDismiss}
          to={"/" + projectId + "/launch/" + launch.id}
          className="dropdown-item"
        >
          Go To Launch
        </Link>
      </div>
    );
  } else if (launch.id && !restart && launch.launchGroup) {
    modalBody = (
      <div className="modal-body" id="launch-created">
        <Link
          onClick={launchModalDismiss}
          to={"/" + projectId + "/launches?launchGroup=" + launch.launchGroup}
          className="dropdown-item"
        >
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
              <input
                type="text"
                className="form-control"
                name="name"
                value={launch.name || ""}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group row">
            <div className="col-sm-4">
              <button type="button" className="btn btn-primary" onClick={handleAddAttribute}>
                Add Attribute
              </button>
            </div>
          </div>

          {(noAttributes >= 1) ? (
            <>
              <div className="form-group row">
                <label className="col-4 col-form-label">Launch Configuration Attribute #1</label>
                <div className="col-8">
                  <CreatableSelect
                    onChange={(value) => changeLaunchConfigAttribute(value, "top")}
                    options={(projectAttributeNames || []).map(function (val) {
                      return { value: val, label: val };
                    })}
                  />
                </div>
              </div>

              <div className="form-group row">
                <label className="col-4 col-form-label">Launch Configuration Attribute Values #1</label>
                <div className="col-8">
                  <CreatableSelect
                    isMulti
                    onChange={(value) => changeLaunchConfigAttributeValues(value, "top")}
                    options={(projectAttributes[displayAttributeIndex.top].values || []).map(function (val) {
                      return { value: val, label: val };
                    })}
                  />
                </div>
              </div>
            </>
          ) : (
            <></>
          )}
          
          {(noAttributes === 2) ? (
            <>
              <div className="form-group row">
                <label className="col-4 col-form-label">Launch Configuration Attribute #2</label>
                <div className="col-8">
                  <CreatableSelect
                    onChange={(value) => changeLaunchConfigAttribute(value, "bottom")}
                    options={(projectAttributeNames || []).map(function (val) {
                      return { value: val, label: val };
                    })}
                  />
                </div>
              </div>

              <div className="form-group row">
                <label className="col-4 col-form-label">Launch Configuration Attribute Values #2</label>
                <div className="col-8">
                  <CreatableSelect
                    isMulti
                    onChange={(values) => changeLaunchConfigAttributeValues(values, "bottom")}
                    options={(projectAttributes[displayAttributeIndex.bottom].values || []).map(function (val) {
                      return { value: val, label: val };
                    })}
                  />
                </div>
              </div>
            </>
          ) : (
            <></>
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
            <FadeLoader sizeUnit={"px"} size={100} color={"#135f38"} loading={loading} />
          </div>
        )}

        {!loading && (
          <div>
            <div>{modalBody}</div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-dismiss="modal">
                Close
              </button>
              {(!launch.id || restart) && (
                <button type="button" className="btn btn-primary" onClick={handleSubmit}>
                  Create Launch
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LaunchForm;

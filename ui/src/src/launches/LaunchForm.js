/* eslint-disable eqeqeq */
import React from "react";
import SubComponent from "../common/SubComponent";
import { Link } from "react-router-dom";
import { withRouter } from "react-router";
import CreatableSelect from "react-select/lib/Creatable";
import LauncherForm from "../launches/LauncherForm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt } from "@fortawesome/free-solid-svg-icons";
import { faMinusCircle } from "@fortawesome/free-solid-svg-icons";
import $ from "jquery";
import * as Utils from "../common/Utils";
import { FadeLoader } from "react-spinners";
import ControlledPopup from "../common/ControlledPopup";
import Backend from "../services/backend";

class LaunchForm extends SubComponent {
  constructor(props) {
    super(props);
    this.state = {
      launch: {
        name: "",
        testSuite: { filter: {} },
        properties: [],
        attributes: {},
        launcherConfig: { properties: {} },
      },
      originalLaunch: {
        testSuite: { filter: {} },
        attributes: {},
        launcherConfig: { properties: {} },
      },
      project: {
        id: null,
        name: "",
        description: "",
        allowedGroups: [],
        launcherConfigs: [],
      },
      projectAttributes: [],
      attributesInEdit: new Set(),
      launcherDescriptors: [],
      restart: props.restart || false,
      failedOnly: props.failedOnly || false,
      loading: false,
      errorMessage: "",
      modalName : props.modalName,
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.addAttribute = this.addAttribute.bind(this);
    this.getAttributes = this.getAttributes.bind(this);
    this.getAttributeName = this.getAttributeName.bind(this);
    this.getAttributeValues = this.getAttributeValues.bind(this);
    this.editAttributeKey = this.editAttributeKey.bind(this);
    this.editAttributeValues = this.editAttributeValues.bind(this);
    this.toggleEdit = this.toggleEdit.bind(this);
    this.getAttributeKeysToAdd = this.getAttributeKeysToAdd.bind(this);
    this.cancelEditAttributeKey = this.cancelEditAttributeKey.bind(this);
    this.cancelEditAttributeValues = this.cancelEditAttributeValues.bind(this);
    this.handleLauncherChange = this.handleLauncherChange.bind(this);
  }

  handleChange(event) {
    this.state.launch[event.target.name] = event.target.value;
    this.setState(this.state);
  }

  handleSubmit(event) {
    this.state.loading = true;
    this.setState(this.state);
    this.state.launch.testSuite.filter.filters = (this.state.launch.testSuite.filter.filters || []).filter(function (
      filter,
    ) {
      return filter.id !== undefined && filter.id !== null;
    });
    this.state.launch.testSuite.filter.filters.forEach(function (filter) {
      delete filter.title;
    });
    var url = this.props.match.params.project + "/launch/";
    if (this.state.restart) {
      url = this.props.match.params.project + "/launch/" + this.state.launch.id + "/restart";
      if (this.state.failedOnly) {
        url += "?failedOnly=true";
      }
    }
    Backend.post(url, this.state.launch)
      .then(response => {
        this.state.launch = response;
        if (!this.state.launch.id) {
          this.state.launch.triggeredByLauncher = true;
        }
        this.state.restart = false;
        this.state.loading = false;
        this.state.attributesInEdit.clear();
        this.setState(this.state);
      })
      .catch(error => {
        this.state.loading = false;
        this.setState(this.state);
        this.setState({errorMessage: "Couldn't save launch: " + error});
      });
    //event.preventDefault();
  }

  componentWillReceiveProps(nextProps) {
    this.state.restart = nextProps.restart || false;
    this.state.failedOnly = nextProps.failedOnly || false;
    if (nextProps.testSuite) {
      this.state.launch.testSuite = nextProps.testSuite;
    }
    if (nextProps.launch && nextProps.launch.id) {
      this.state.launch = nextProps.launch;
    }
    if (nextProps.projectAttributes) {
      this.state.projectAttributes = nextProps.projectAttributes;
    } else {
      this.getAttributes();
    }

    if(nextProps.modalName){
      this.state.modalName = nextProps.modalName;
    }
    this.setState(this.state);
  }

  componentDidMount() {
    super.componentDidMount();
    this.state.attributesInEdit.clear();

    Backend.get("project/" + this.props.match.params.project)
      .then(response => {
        this.state.project = response;
        this.setState(this.state);
      })
      .catch(error => {
        this.setState({errorMessage: "Couldn't get project: " + error});
      });

    Backend.get("launcher/descriptors")
      .then(response => {
        this.state.launcherDescriptors = response;
        this.setState(this.state);
      })
      .catch(error => {
        this.setState({errorMessage: "Couldn't get launcher descriptors: " + error});
      });
  }

  handleLauncherChange(event, index, propertyKey) {
    if (propertyKey == "uuid") {
      this.state.launch.launcherConfig =
        this.state.project.launcherConfigs.find(config => config.uuid == event.target.value) || {};
    } else {
      this.state.launch.launcherConfig.properties[propertyKey] = event.target.value;
    }
    this.setState(this.state);
  }

  getAttributeKeysToAdd() {
    return (this.state.projectAttributes || [])
      .filter(attribute => !(Object.keys(this.state.launch.attributes || {}) || []).includes(attribute.id))
      .map(attribute => ({ value: attribute.id, label: attribute.name }));
  }


  getAttributes(reRender) {
    Backend.get(this.state.project.id + "/attribute")
      .then(response => {
        this.state.projectAttributes = response;
        this.setState(this.state);
      })
      .catch(error => {
        this.setState({errorMessage: "Couldn't fetch attributes: " + error});
      });
  }

  toggleEdit(fieldName, event, index) {
    var fieldId = fieldName;
    if (index !== undefined) {
      fieldId = fieldId + "-" + index;
    }
    if ($("#" + fieldId + "-display").offsetParent !== null) {
      if (index) {
        this.state.originalLaunch[fieldName][index] = JSON.parse(
          JSON.stringify(this.state.launch[fieldName][index] || ""),
        );
      } else {
        this.state.originalLaunch[fieldName] = JSON.parse(JSON.stringify(this.state.launch[fieldName] || ""));
      }
    }
    $("#" + fieldId + "-display").toggle();
    $("#" + fieldId + "-form").toggle();
    if (event) {
      //event.preventDefault();
    }
  }

  getAttributeName(id) {
    return Utils.getProjectAttribute(this.state.projectAttributes, id).name || "";
  }

  getAttributeValues(id) {
    return Utils.getProjectAttribute(this.state.projectAttributes, id).attrValues || [];
  }

  editAttributeKey(key, data, reRender) {
    if (
      this.state.projectAttributes.find(function (attribute) {
        return attribute.id === data.value;
      }) == undefined
    ) {
      this.state.projectAttributes.push({ id: data.value, name: data.value });
    }
    this.state.attributesInEdit.delete(key);
    this.state.attributesInEdit.add(data.value);
    this.state.launch.attributes[data.value] = this.state.launch.attributes[key];
    delete this.state.launch.attributes[key];
    if (reRender) {
      this.setState(this.state);
    }
  }


  editAttributeValues(key, values) {
    this.state.originalTestcase["attributes"][key] = this.state.launch["attributes"][key];
    this.state.launch["attributes"][key] = values.map(function (value) {
      return value.value;
    });
    this.setState(this.state);
  }

  cancelEditAttributeValues(event, key) {
    this.state.launch["attributes"][key] = this.state.originalLaunch["attributes"][key];
    this.state.attributesInEdit.delete(key);
    this.setState(this.state);
    this.toggleEdit("attributes", event, key);
  }

  cancelEditAttributeKey(event, key) {
    if (
      this.state.launch.attributes[key] === undefined ||
      key === undefined ||
      this.state.launch.attributes[key].values === undefined ||
      this.state.launch.attributes[key].values === null ||
      this.state.launch.attributes[key].values.length == 0
    )
      delete this.state.launch.attributes[key];
    this.state.attributesInEdit.delete(key);
    this.setState(this.state);
  }

  removeAttribute(key, event) {
    delete this.state.launch.attributes[key];
    this.state.attributesInEdit.delete(key);
    this.handleSubmit("attributes", event, 0, true);
  }

  addAttribute(event) {
    if (!this.state.launch.attributes) {
      this.state.launch.attributes = {};
    }
    this.state.launch.attributes[null] = [];
    this.state.attributesInEdit.add(null);
    this.setState(this.state);
  }

  editAttributeValues(key, values) {
    this.state.originalLaunch["attributes"][key] = this.state.launch["attributes"][key];
    this.state.launch["attributes"][key] = values.map(function (value) {
      return value.value;
    });
    this.setState(this.state);
  }

  cancelEditAttributeValues(event, key) {
    this.state.launch["attributes"][key] = this.state.originalLaunch["attributes"][key];
    this.state.attributesInEdit.delete(key);
    this.setState(this.state);
    this.toggleEdit("attributes", event, key);
  }

  cancelEditAttributeKey(event, key) {
    if (
      this.state.launch.attributes[key] === undefined ||
      key === undefined ||
      this.state.launch.attributes[key].values === undefined ||
      this.state.launch.attributes[key].values === null ||
      this.state.launch.attributes[key].values.length == 0
    )
      delete this.state.launch.attributes[key];
    this.state.attributesInEdit.delete(key);
    this.setState(this.state);
  }

  removeAttribute(key, event) {
    delete this.state.launch.attributes[key];
    this.state.attributesInEdit.delete(key);
    this.handleSubmit("attributes", event, 0, true);
  }


  addAttribute(event) {
    if (!this.state.launch.attributes) {
      this.state.launch.attributes = {};
    }
    this.state.launch.attributes[null] = [];
    this.state.attributesInEdit.add(null);
    this.setState(this.state);
  }

  changeAttributes(values) {
    this.state.launch.attributes = values.map(function (value) {
      return value.value;
    });
    this.setState(this.state);
  }

  launchModalDismiss() {
     //Updated Issue 92
     if(typeof this.state.modalName === 'string' && this.state.modalName.length > 0 && this.state.modalName ==='launch-modal'){
       $("#launch-modal").modal("hide");
     }else{
     $("#restart-launch-modal").modal("hide");
    }
  }

  render() {
    let modalBody;
    if (this.state.launch.id && !this.state.restart && !this.state.launch.launchGroup) {
      modalBody = (
        <div className="modal-body" id="launch-created">
          <Link
            onClick={this.launchModalDismiss}
            to={"/" + this.props.match.params.project + "/launch/" + this.state.launch.id}
            className="dropdown-item"
          >
            Go To Launch
          </Link>
        </div>
      );
    } else if (this.state.launch.id && !this.state.restart && this.state.launch.launchGroup) {
      modalBody = (
        <div className="modal-body" id="launch-created">
          <Link
            onClick={this.launchModalDismiss}
            to={"/" + this.props.match.params.project + "/launches?launchGroup=" + this.state.launch.launchGroup}
            className="dropdown-item"
          >
            Go To Launch Group
          </Link>
        </div>
      );
    } else if (this.state.launch.triggeredByLauncher && !this.state.restart) {
      modalBody = (
        <div className="modal-body" id="launch-created">
          Launch was triggered using {this.state.launch.launcherConfig.name}
        </div>
      );
    } else {
      modalBody = (
        <div className="modal-body" id="launch-creation-form">
            <div className="form-group row">
              <label className="col-4 col-form-label">Name</label>
              <div className="col-8">
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={this.state.launch.name || ""}
                  onChange={this.handleChange}
                />
              </div>
            </div>
            <div id="attributes" className="mb-4">
              <h5>Attributes</h5>
              {Object.keys(this.state.launch.attributes || {}).map(
                function (attributeId, i) {
                  var attributeValues = this.state.launch.attributes[attributeId] || [];
                  if (attributeId && attributeId != "null") {
                    return (
                      <div key={i} className="form-group attribute-block">
                        <div
                          id={"attributes-" + attributeId + "-display"}
                          className="inplace-display"
                          style={{ display: this.state.attributesInEdit.has(attributeId) ? "none" : "block" }}
                        >
                          <div index={attributeId} className="card">
                            <div className="card-header">
                              <b>
                                {this.getAttributeName(attributeId)}
                                {!this.state.readonly && (
                                  <span
                                    className="edit edit-icon clickable"
                                    onClick={e => {
                                      this.toggleEditAttribute(attributeId);
                                    }}
                                  >
                                    <FontAwesomeIcon icon={faPencilAlt} />
                                  </span>
                                )}
                                {!this.state.readonly && (
                                  <span
                                    className="clickable edit-icon red"
                                    index={attributeId}
                                    onClick={e => this.removeAttribute(attributeId, e)}
                                  >
                                    <FontAwesomeIcon icon={faMinusCircle} />
                                  </span>
                                )}
                              </b>
                            </div>
                            {<div className="card-body">{attributeValues.join(", ")}</div>}
                          </div>
                        </div>
                        {!this.state.readonly && (
                          <div
                            id={"attributes-" + attributeId + "-form"}
                            className="inplace-form"
                            style={{ display: this.state.attributesInEdit.has(attributeId) ? "block" : "none" }}
                          >
                            <form>
                              <div index={attributeId} className="card">
                                <div className="card-header">
                                  <b>{this.getAttributeName(attributeId)}</b>
                                </div>
                                <div className="card-body">
                                  <CreatableSelect
                                    value={(attributeValues || []).map(function (val) {
                                      return { value: val, label: val };
                                    })}
                                    isMulti
                                    isClearable
                                    onChange={e => this.editAttributeValues(attributeId, e)}
                                    options={this.getAttributeValues(attributeId).map(function (attrValue) {
                                      return { value: attrValue.value, label: attrValue.value };
                                    })}
                                  />
                                  <button
                                    type="button"
                                    className="btn btn-light"
                                    onClick={e => this.cancelEditAttributeValues(e, attributeId)}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={e => this.handleSubmit("attributes", e, attributeId, true)}
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            </form>
                          </div>
                        )}
                      </div>
                    );
                  } else {
                    return (
                      <div className="form-group attribute-block">
                        <div id={"attributes-" + attributeId + "-form"} className="inplace-form">
                          <div index={attributeId} className="card">
                            <div className="card-header">
                              <CreatableSelect
                                onChange={e => this.editAttributeKey(attributeId, e, true)}
                                options={this.getAttributeKeysToAdd()}
                              />
                              <button
                                type="button"
                                className="btn btn-light"
                                onClick={e => this.cancelEditAttributeKey(e, attributeId)}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                }.bind(this),
              )}

              {!this.state.readonly && (
                <div className>
                  <button type="button" className="btn btn-primary" onClick={e => this.addAttribute(e)}>
                    Add Attribute 
                  </button>
                </div>
              )}
            </div>
        </div>
      );
    }

    return (
      <div className="modal-dialog" role="document">
        <ControlledPopup popupMessage={this.state.errorMessage}/>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Create Launch</h5>
            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>

          {this.state.loading && (
            <div className="sweet-loading launch-form-spinner">
              <FadeLoader sizeUnit={"px"} size={100} color={"#135f38"} loading={this.state.loading} />
            </div>
          )}

          {!this.state.loading && (
            <div>
              <div>{modalBody}</div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-dismiss="modal">
                  Close
                </button>
                {(!this.state.launch.id || this.state.restart) && (
                  <button type="button" className="btn btn-primary" onClick={this.handleSubmit}>
                    Create Launch
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default withRouter(LaunchForm);

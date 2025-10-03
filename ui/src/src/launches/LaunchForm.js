/* eslint-disable eqeqeq */
import React from "react";
import SubComponent from "../common/SubComponent";
import { Link } from "react-router-dom";
import { withRouter } from "react-router";
import CreatableSelect from "react-select/creatable";
import LauncherForm from "../launches/LauncherForm";
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
        launcherConfig: { properties: {} },
        configAttributePairs: [],
      },
      noAttributes: 0,
      projectAttributeNames: [],
      projectAttributes: [{ name: "", values: [] }],
      displayAttributeIndex: {},
      displayAttributeName: {},
      displayAttributeValues: {},
      project: {
        id: null,
        name: "",
        description: "",
        allowedGroups: [],
        launcherConfigs: [],
      },
      launcherDescriptors: [],
      restart: props.restart || false,
      failedOnly: props.failedOnly || false,
      loading: false,
      errorMessage: "",
      modalName : props.modalName,
      configurationAttributes: [],
      configAttributesFilter: {
        skip: 0,
        limit: 20,
        orderby: "project",
        orderdir: "ASC",
        includedFields: "project, names",
      },

    };

    this.state.displayAttributeIndex["top"] = 0;
    this.state.displayAttributeIndex["bottom"] = 0;
    this.state.displayAttributeName["top"] = "";
    this.state.displayAttributeName["bottom"] = "";
    this.state.displayAttributeValues["top"] = [];
    this.state.displayAttributeValues["bottom"] = [];
    this.handleAddAttribute = this.handleAddAttribute.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.getAttributes = this.getAttributes.bind(this);
    this.changeLaunchConfigAttribute = this.changeLaunchConfigAttribute.bind(this);
    this.changeLaunchConfigAttributeValues = this.changeLaunchConfigAttributeValues.bind(this);
    this.handleLauncherChange = this.handleLauncherChange.bind(this);
  }

  getAttributes() {
    Backend.get(this.props.match.params.project + "/attribute")
      .then(response => {

        this.state.projectAttributes = []
        response.forEach(
          function(response) {
            if (response.type == "LAUNCH") {
                var tempAttrib = {name: "", values: []};
                tempAttrib.name = response.name;
                this.state.projectAttributeNames.push(tempAttrib.name);
                var tempValues = [];
                for (let j = 0; j < response.attrValues.length; j++) {
                     tempValues.push(response.attrValues[j].value);
                }
                tempAttrib.values = tempValues;
                this.state.projectAttributes.push(tempAttrib);
	    }
          }.bind(this),
        );
        this.setState(this.state);
      })
      .catch(error => console.log(error));
  }

  handleAddAttribute() {

     if (this.state.noAttributes <= 1) {
        if (this.state.projectAttributes.length >= 1) {
           this.state.noAttributes += 1;
           this.setState(this.state);
        } else {
           this.setState({errorMessage: "handleAddAttribute::Invalid number of LAUNCH attributes"});
        }
     } else {
        this.setState({errorMessage: "handleAddAttribute::Maximum number LAUNCH attributes = 2"});
     }

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
    // copy display attributes  (name, values) to launch.configurationAttributes
    if (this.state.displayAttributeName["top"] !== "") {
       this.state.launch.configAttributePairs.push(
                  {name: this.state.displayAttributeName["top"],
                   value: this.state.displayAttributeValues["top"]});
    }

    if (this.state.displayAttributeName["bottom"] !== "") {
       this.state.launch.configAttributePairs.push(
                  {name: this.state.displayAttributeName["bottom"],
                   value: this.state.displayAttributeValues["bottom"]});
    }

    Backend.post(url, this.state.launch)
      .then(response => {
        this.state.launch = response;
        if (!this.state.launch.id) {
          this.state.launch.triggeredByLauncher = true;
        }
        this.state.restart = false;
        this.state.loading = false;
        this.setState(this.state);
      })
      .catch(error => {
        this.state.loading = false;
        this.setState(this.state);
        this.setState({errorMessage: "handleSubmit::Couldn't save launch: " + error});
      });
    event.preventDefault();
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
    if(nextProps.modalName){
      this.state.modalName = nextProps.modalName;
    }
    this.setState(this.state);
  }

  componentDidMount() {
    super.componentDidMount();
    this.getAttributes();

    Backend.get("project/" + this.props.match.params.project)
      .then(response => {
        this.state.project = response;
        this.setState(this.state);
      })
      .catch(error => {
        this.setState({errorMessage: "componentDidMount::Couldn't get project, error: " + error});
      });

    Backend.get("launcher/descriptors")
      .then(response => {
        this.state.launcherDescriptors = response;
        this.setState(this.state);
      })
      .catch(error => {
        this.setState({errorMessage: "componentDidMount::Couldn't get launcher descriptors, error: " + error});
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

  changeLaunchConfigAttribute = (values, position) => {

    for (let i = 0; i < this.state.projectAttributes.length; i++) {
       if (this.state.projectAttributes[i].name == values.value) {
          this.state.displayAttributeName[position] = values.value;
          this.state.displayAttributeIndex[position] = i;
          break;
       }
    }
    this.setState(this.state);
  }

  changeLaunchConfigAttributeValues = (values, position) => {

     for (let i = 0; i < values.length; i++) {
        this.state.displayAttributeValues[position] = values[i].value;
     }
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
          <form>
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

            <div className="form-group row">
             <div className="col-sm-4">
               <button type="button" className="btn btn-primary" onClick={this.handleAddAttribute}>
               Add Attribute
               </button>
             </div>
            </div>

            {(this.state.noAttributes >= 1) ? (
            <>
            <div className="form-group row">
              <label className="col-4 col-form-label">Launch Configuration Attribute #1</label>
              <div className="col-8">
                <CreatableSelect
                  onChange={(value) => this.changeLaunchConfigAttribute(value, "top")}
                  options={(this.state.projectAttributeNames || []).map(function (val) {
                    return { value: val, label: val};
                  })}
                />
              </div>
            </div>

            <div className="form-group row">
              <label className="col-4 col-form-label">Launch Configuration Attribute Values #1</label>
              <div className="col-8">
                <CreatableSelect
                  isMulti
                  onChange={(value) => this.changeLaunchConfigAttributeValues(value, "top")}
                  options={(this.state.projectAttributes[this.state.displayAttributeIndex["top"]].values || []).map(function (val) {
                    return { value: val, label: val};
                  })}
                />
              </div>
            </div>
            </>
            ) : (
            <></>
            )}
            {(this.state.noAttributes === 2) ? (
            <>
            <div className="form-group row">
              <label className="col-4 col-form-label">Launch Configuration Attribute #2</label>
              <div className="col-8">
                <CreatableSelect
                  onChange={(value) => this.changeLaunchConfigAttribute(value, "bottom")}
                  options={(this.state.projectAttributeNames || []).map(function (val) {
                    return { value: val, label: val};
                  })}
                />
              </div>
            </div>

            <div className="form-group row">
              <label className="col-4 col-form-label">Launch Configuration Attribute Values #2</label>
              <div className="col-8">
                <CreatableSelect
                  isMulti
                  onChange={(values) => this.changeLaunchConfigAttributeValues(values, "bottom")}
                  options={(this.state.projectAttributes[this.state.displayAttributeIndex["bottom"]].values || []).map(function (val) {
                    return { value: val, label: val};
                  })}
                />
              </div>
            </div>
            </>
            ) : (
            // nop
            <></>
            )}
          </form>
          <div>
            {this.state.launch.launcherConfig && this.state.launch.launcherConfig.uuid && (
              <LauncherForm
                launcherConfig={this.state.launch.launcherConfig}
                configIndex={0}
                selectableType={false}
                handleLauncherChange={this.handleLauncherChange}
                launcherDescriptors={this.state.launcherDescriptors}
              />
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

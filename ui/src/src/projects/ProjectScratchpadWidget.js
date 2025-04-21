import React from "react";
import SubComponent from "../common/SubComponent";
import { Link } from "react-router-dom";
import * as Utils from "../common/Utils";
import ControlledPopup from "../common/ControlledPopup";
import { FadeLoader } from "react-spinners";
import Backend from "../services/backend";

class ProjectScratchpadWidget extends SubComponent {
  state = {
    loading: false,
    errorMessage: "",
    project: {
      id: null,
      name: "",
      description: "",
      allowedGroups: [],
      scratchpad: "",
    },
  };

  constructor(props) {
    super(props);
    this.state.projectId = props.projectId;
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.getProject = this.getProject.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    var nextProjectId = nextProps.projectId;
    // eslint-disable-next-line eqeqeq
    if (nextProjectId && this.state.projectId != nextProjectId) {
      this.state.projectId = nextProjectId;
      this.getProject();
    }
  }

  componentDidMount() {
    super.componentDidMount();
    if (this.state.projectId) {
       this.getProject();
    }
  }

  handleChange(event) {
    var projectUpd = this.state.project;
    projectUpd[event.target.name] = event.target.value;
    const newState = Object.assign({}, this.state, {
      project: projectUpd,
    });
    this.setState(newState);
  }

  handleSubmit(event) {
    Backend.put("project", this.state.project)
      .then(response => {
        this.state.project = response;
	this.setState(this.state);
        this.setState({errorMessage: "Project saved successfully"});
      })
      .catch(error => {
        this.setState({errorMessage: "Couldn't save project: " + error});
      });
    event.preventDefault();
  }

  getProject() {
    Backend.get("project/" + this.state.projectId)
     .then(response => {
        this.state.project = response;
        this.setState(this.state);
     })
     .catch(error => {
        this.setState({errorMessage: "Couldn't get project: " + error});
     });
  }

  render() {

    return (
      <div>
        <ControlledPopup popupMessage={this.state.errorMessage}/>
        <div>
          <div className="sweet-loading">
            <FadeLoader sizeUnit={"px"} size={100} color={"#135f38"} loading={this.state.loading} />
          </div>
        </div>
	<form>
          <div className="form-group row">
            <div className="col-sm-9">
              <textarea
                name="scratchpad"
                className="form-control"
	        style={{ width: '400px', height: '400px', whiteSpace: 'normal'}}
                value={this.state.project.scratchpad}
                onChange={this.handleChange}
              />
            </div>
          </div>
          <div className="project-form-block">
              <button type="button" className="btn btn-primary" onClick={this.handleSubmit}>
                Submit
              </button>
          </div>
	</form>
      </div>
    );
  }
}

export default ProjectScratchpadWidget;

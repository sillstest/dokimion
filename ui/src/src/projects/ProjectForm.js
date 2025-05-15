import React, { Component } from "react";
import { withRouter } from "react-router";
import * as Utils from "../common/Utils";
import Backend from "../services/backend";
import ControlledPopup from '../common/ControlledPopup';

class ProjectForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      project: {
        id: null,
        name: "",
        description: "",
        allowedGroups: [],
	scratchpad: "text",
      },
      errorMessage: "",
    };
    

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    var projectUpd = this.state.project;
    projectUpd[event.target.name] = event.target.value;
    // eslint-disable-next-line eqeqeq
    if (event.target.name == "name") {
      projectUpd.id = this.normalizeId(event.target.value);
    }
    const newState = Object.assign({}, this.state, {
      project: projectUpd,
    });
    this.setState(newState);
  }

  handleSubmit(event) {
    Backend.post("project", this.state.project)
      .then(response => {
        this.props.history.push("/projects/" + response.id);
      })
      .catch(error => {
        this.setState({errorMessage: "handleSubmit::Couldn't save project, error: " + error});
      });
    event.preventDefault();
  }

  componentDidMount() {
    if (this.props.id) {
      Backend.get("project/" + this.props.id)
        .then(response => {
          const newState = Object.assign({}, this.state, {
            project: response,
          });
          this.setState(newState);
        })
        .catch(error => {
          this.setState({errorMessage: "componentDidMount::Couldn't get project, error: " + error});
        });
    }
  }

  normalizeId(id) {
    return id
      .trim()
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, "");
  }

  render() {
    return (
      <div className="project-form">
        <ControlledPopup popupMessage={this.state.errorMessage}/>
        <div className="project-form-title">
            <h1>Create Project</h1>
        </div>
        <form>
          <div className="form-group row">
            <label className="col-sm-3 col-form-label">Name</label>
            <div className="col-sm-9">
              <input type="text" name="name" className="form-control" value={this.state.project.name} onChange={this.handleChange} />
            </div>
          </div>

          <div className="form-group row">
            <label className="col-sm-3 col-form-label">Project ID</label>
            <div className="col-sm-9">
              <input type="text" name="id" className="form-control" value={this.state.project.id || ""} onChange={this.handleChange} />
            </div>
          </div>

          <div className="form-group row">
            <label className="col-sm-3 col-form-label">Description</label>
            <div className="col-sm-9">
              <input
                type="text"
                name="description"
                className="form-control"
                value={this.state.project.description}
                onChange={this.handleChange}
              />
            </div>
          </div>
          <div className="project-form-block">
              <button type="button" className="btn btn-primary" onClick={this.handleSubmit}>
                Create
              </button>
          </div>
        </form>
      </div>
    );
  }
}

export default withRouter(ProjectForm);

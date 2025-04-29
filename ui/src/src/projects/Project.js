import React from "react";
import SubComponent from "../common/SubComponent";
import TestSuitesWidget from "../testsuites/TestSuitesWidget";
import ProjectScratchpadWidget from "../projects/ProjectScratchpadWidget";
import LaunchesWidget from "../launches/LaunchesWidget";
import LaunchesTrendWidget from "../launches/LaunchesTrendWidget";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCogs } from "@fortawesome/free-solid-svg-icons";
import * as Utils from "../common/Utils";
import Backend from "../services/backend";
import ControlledPopup from '../common/ControlledPopup';
import { FadeLoader } from "react-spinners";

class Project extends SubComponent {
  constructor(props) {
    super(props);
    this.state = {
      project: {
        id: null,
        name: "",
        description: "",
        allowedGroups: [],
        scratchpad: "",
      },
      loading: true,
      errorMessage: "",
    };
    this.getProject = this.getProject.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.onProjectChange = props.onProjectChange;
  }

  componentDidMount() {
    super.componentDidMount();
    this.state.project.id = this.props.match.params.project;
    this.getProject();
  }

  componentWillReceiveProps(nextProps) {
    var nextProjectId = nextProps.match.params.project;
    // eslint-disable-next-line eqeqeq
    if (nextProjectId && this.state.project.id != nextProjectId) {
      this.state.project.id = nextProjectId;
      this.onProjectChange(this.state.project.id);
      this.getProject();
    }
  }

  handleChange(event) {

  }

  handleSubmit(event) {

  }

  getProject() {
    Backend.get("project/" + this.state.project.id)
      .then(response => {
        this.state.project = response;
        this.setState(this.state);
      })
      .catch(error => {
        this.setState({errorMessage: "getProject::Couldn't get project, error: " + error});
      });
  }

  render() {
    return (
      <div>
        <ControlledPopup popupMessage={this.state.errorMessage}/>
        <div className="project-header">
          <h1>
            {this.state.project.name}
            <span className="float-right">
              <Link to={"/projects/" + this.state.project.id + "/settings"} className="project-title-settings-link">
                <FontAwesomeIcon icon={faCogs} />
              </Link>
            </span>
          </h1>
        </div>
        <div className="row">
          <div className="col-sm-6">
            <div className="card project-card">
              <div className="card-header">
                <span>
                  <Link to={"/" + this.state.project.id + "/launches"}>Launches</Link>
                </span>
              </div>
              <div className="card-body">
                <LaunchesWidget limit={5} projectId={this.state.project.id} />
              </div>
            </div>
          </div>
          <div className="col-sm-6">
            <div className="card project-card">
              <div className="card-header">
                <span>
                  <Link to={"/" + this.state.project.id + "/testsuites"}>Test Suites</Link>
                </span>
              </div>
              <div className="card-body">
                <TestSuitesWidget limit={11} projectId={this.state.project.id} />
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-6">
            <div className="card project-card">
              <div className="card-header">
                <span>
                  <Link to={"/" + this.state.project.id + "/launches"}>Last 20 Launches</Link>
                </span>
              </div>
              <div className="card-body">
                <LaunchesTrendWidget projectId={this.state.project.id} />
              </div>
            </div>
          </div>
          <div className="col-sm-6">
            <div className="card project-card">
              <div className="card-header">
                <span>
                  <Link to={"/" + this.state.project.id + "/projectscratchpad"}></Link>
                </span>
              </div>
              <div className="card-body">
                <ProjectScratchpadWidget limit={11} projectId={this.state.project.id} />
              </div>
            </div>
          </div>
	 </div>
      </div>
    );
  }
}

export default Project;

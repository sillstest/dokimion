import React from "react";
import SubComponent from "../common/SubComponent";
import { Link } from "react-router-dom";
import * as Utils from "../common/Utils";
import ControlledPopup from "../common/ControlledPopup";
import { FadeLoader } from "react-spinners";
import Backend from "../services/backend";
import TextareaAutosize from 'react-textarea-autosize';
import URLForm from "../projects/URLForm";

class ProjectScratchpadWidget extends SubComponent {
  state = {
    loading: false,
    errorMessage: "",
    project: {
      id: null,
      name: "",
      description: "",
      allowedGroups: [],
      scratchpadURLs: [],
    },
    url: "",
    reRenderAfterRemove: true,
    errorMessage: "",
    session: {person: {}},
  };

  constructor(props) {
    super(props);
    this.state.projectId = props.projectId;
    this.handleChange = this.handleChange.bind(this);
    this.saveProject = this.saveProject.bind(this);
    this.getProject = this.getProject.bind(this);
    this.onURLRemoved = this.onURLRemoved.bind(this);
    this.onURLAdded = this.onURLAdded.bind(this);
    this.getSession = this.getSession.bind(this);
  }

  getSession() {
    Backend.get("user/session")
      .then(response => {
        this.state.session = response;
        this.setState(this.state);
      })
      .catch(() => {console.log("Unable to fetch session");});
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
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
    this.getSession();
  }

  onURLAdded(url) {

    if (this.state.session.person.roles[0] != "ADMIN" &&
        this.state.session.person.roles[0] != "TESTDEVELOPER") {
        this.setState({errorMessage: "onURLAdded - Unable to add url"});
	return;
    }

    /* add url to temp project var */
    let project = this.state.project;
    project.scratchpadURLs.push(url);
    this.saveProject(project);
    this.state.url = "";
    this.setState(this.state);

  }

  onURLRemoved(url) {

    if (this.state.session.person.roles[0] != "ADMIN" &&
        this.state.session.person.roles[0] != "TESTDEVELOPER") {
        this.setState({errorMessage: "onURLRemoved - Unable to remove url"});
	return;
    }

    /* remove url from temp project var */
    let project = this.state.project;
    let i = project.scratchpadURLs.indexOf(url);
    if (i > -1) {
       project.scratchpadURLs.splice(i, 1);
    }

    this.saveProject(project, url, "remove");
    this.state.url = "";

    if (this.state.reRenderAfterRemove == true) {
       this.state.reRenderAfterRemove = false;
    }

    this.setState(this.state);

  }

  handleChange(event) {
    var projectUpd = this.state.project;
    projectUpd[event.target.name] = event.target.value;
    const newState = Object.assign({}, this.state, {
      project: projectUpd,
    });
    this.setState(newState);
    event.preventDefault();
  }

  saveProject(project) {
    Backend.put("project", project)
      .then(response => {
        this.state.project = response;
	this.setState(this.state);
      })
      .catch(error => {
        this.setState({errorMessage: "saveProject::Couldn't save project: " + error});
      });
  }

  getProject() {
    Backend.get("project/" + this.state.projectId)
     .then(response => {
        this.state.project = response;
        this.setState(this.state);
     })
     .catch(error => {
        this.setState({errorMessage: "getProject::Couldn't get project: " + error});
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
        <table cellSpacing="1">
	  <thead>
	    <tr>
	      <th scope="col">URL Link</th>
	      <th scope="col">Remove</th>
	    </tr>
	  </thead>
	  <tbody>
	    {this.state.project && this.state.project.scratchpadURLs !== undefined && this.state.project.scratchpadURLs.map(
              function (url) {
                return (
		  <tr key={url}>
		    <td>
		      <a href={url}>{url}</a>
		    </td>
		    <td>
		      <button onClick={() => this.onURLRemoved(url)}>
		       <i className="bi-trash" aria-hidden="true"></i>
		      </button>
		    </td>
	          </tr>
		);
	      }.bind(this),
	    )}
	  </tbody>
	</table>
        <div className="attributes-controls">
          <button type="button" className="btn btn-primary" data-toggle="modal" data-target="#editURL">
            Add
          </button>
        </div>
        <div
          className="modal fade"
          id="editURL"
          tabIndex="-1"
          role="dialog"
          aria-labelledby="editURLLabel"
          aria-hidden="true"
	    >
          <URLForm
            project={this.state.project}
	    url={this.state.url}
	    onURLAdded={this.onURLAdded}
          />
        </div>
      </div>
    );
  }
}

export default ProjectScratchpadWidget;

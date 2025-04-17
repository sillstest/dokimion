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

    this.handleChange = this.handleChange.bind(this);
  }

  componentWillReceiveProps(nextProps) {
  }

  componentDidMount() {
    super.componentDidMount();
  }

  handleChange(event) {
    console.log(event);
    var projectUpd = this.state.project;
    projectUpd[event.target.name] = event.target.value;
    const newState = Object.assign({}, this.state, {
      project: projectUpd,
    });
    this.setState(newState);
  }

  handleSubmit(event) {
    console.log(event);
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
              <input
                type="textarea"
                name="scratchpad"
                className="form-control"
	        style={{ width: '400px', height: '400px'}}
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

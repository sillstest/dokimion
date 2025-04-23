/* eslint-disable react/no-direct-mutation-state */
import React, { Component } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinusCircle } from "@fortawesome/free-solid-svg-icons";
import ControlledPopup from "../common/ControlledPopup";
import Backend from "../services/backend";
import CreatableSelect from "react-select/lib/Creatable";
import * as Utils from "../common/Utils";
import equal from "fast-deep-equal";

class URLForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      project: this.props.project,
      url: this.props.url,
      session: {person: {}},
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.onSessionChange = this.onSessionChange.bind(this);
  }

  onSessionChange(session) {
    this.props.onSessionChange(session);
  }

  getSession() {
    Backend.get("user/session")
      .then(response => {
        this.state.session = response;
        this.setState(this.state);
      })
      .catch(() => {console.log("Unable to fetch session");});
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ attribute: nextProps.attribute, 
      projectAttributes:nextProps.projectAttributes, 
      edit: nextProps.edit});
  }

  handleChange(event) {
    this.state.url = event.target.value;
    this.setState(this.state);
  }

  handleSubmit(event) {

    Backend.post(this.props.project + "/addScratchpadURL", this.state.url)
      .then(response => {
        this.props.onAttributeAdded(response);
      })
      .catch(error => {
        this.setState({errorMessage: "Couldn't save url: " + error});
      });
    event.preventDefault();
  }  


  handleClose(event) {
    this.state.errorMessage='';
    this.setState(this.state);
    event.preventDefault();
  }

  componentDidMount() {
    if (this.props.project.id) {
      Backend.get(this.props.project + "/project")
        .then(response => {
          const newState = Object.assign({}, this.state, {
            project: response,
          });
          this.setState(newState);
        })
        .catch(error => console.log(error));
    }
    this.getSession();
  }

  render() {
    return (
      <div className="modal-dialog" role="document">
        <ControlledPopup popupMessage={this.state.errorMessage}/>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="editAttributeLabel">
              URL
            </h5>
            <button type="button" className="close" data-dismiss="modal" aria-label="Close" onClick={this.handleClose}>
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className="modal-body">
              <div className="form-group row">
                <label className="col-sm-2 col-form-label">URL</label>
                <div className="col-sm-8">
                  <input
                    type="text"
                    name="name"
                    className="col-sm-12"
                    value={this.state.url}
                    onChange={this.handleChange}
                  />
                </div>
              </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-primary" onClick={this.handleSubmit}>
              Save
            </button>
            <button type="button" className="btn btn-secondary" data-dismiss="modal" onClick={this.handleClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default URLForm;

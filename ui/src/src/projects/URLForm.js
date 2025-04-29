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
    this.setState({ project: nextProps.project, 
      url:nextProps.urlToAdd, 
    });
  }

  handleChange(event) {
    this.state.url = event.target.value;
    this.setState(this.state);
  }

  handleSubmit(event) {

    if (this.state.url.startsWith("http")) {

       this.props.project.scratchpadURLs.push(this.state.url);

       Backend.put("project", this.props.project)
         .then(response => {
           this.state.project = response;
           this.props.onURLAdded();
           this.setState(this.state);
         })
         .catch(error => {
           this.setState({errorMessage: "handleSubmit::Couldn't save url, error: " + error});
           this.setState(this.state);
         });

    } else {
       this.setState({errorMessage: "handleSubmit::URL must have prefix \"http\""});
       this.setState(this.state);
    }
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

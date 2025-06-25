/* eslint-disable react/no-direct-mutation-state */
import React, { Component } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinusCircle } from "@fortawesome/free-solid-svg-icons";
import ControlledPopup from "../common/ControlledPopup";
import Backend from "../services/backend";
import * as Utils from "../common/Utils";

class AttributeForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      attribute: props.attribute,
      projectAttributes: props.projectAttributes,
      errorMessage: "",
      edit : props.edit,
      attributeTypes: ["TESTCASE", "LAUNCH"],
      session: {person: {}},
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleValueChange = this.handleValueChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.addValue = this.addValue.bind(this);
    this.removeValue = this.removeValue.bind(this);
    this.handleRemove = this.handleRemove.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.onSessionChange = this.onSessionChange.bind(this);
    this.handleAttributeTypeChange = this.handleAttributeTypeChange.bind(this);
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

  handleAttributeTypeChange(event) {
    console.log("User selected value: ", event.target.value);
    this.state.attribute.type = event.target.value;
    this.setState(this.state);
  }


  handleChange(event) {
    this.state.attribute[event.target.name] = event.target.value;
    this.state.attribute["type"] = "TESTCASE";
    this.setState(this.state);
  }

  handleValueChange(i, event) {
    this.state.attribute.attrValues[i].value = event.target.value;
    this.setState(this.state);
  }

  removeValue(i, event) {
    this.state.attribute.attrValues.splice(i, 1);
    this.setState(this.state);
  }

  handleSubmit(event) {
    //Added code for Issue 40
    var duplicate = this.state.projectAttributes.filter(attr => (attr.name.toLowerCase()) ===
                                          (this.state.attribute.name).toLowerCase()).length>0 ? true: false;
    console.log("Duplicate : " + duplicate + " : EDIT : " + this.state.edit);
    if(duplicate && !this.state.edit ){
        this.setState({errorMessage:'Duplicate Attribute '}) 
  
    }else if(typeof this.state.attribute.name ==='string' && this.state.attribute.name.length ===0 ){
      this.setState({errorMessage:'Enter valid attribute '})
      }else if(this.state.attribute.name){
      //Add
        Backend.post(this.props.project + "/attribute", this.state.attribute)
          .then(response => {
            this.props.onAttributeAdded(response);
            this.state.attribute = {
              id: null,
              name: "",
              type: "",
              attrValues: [],
            };
            this.setState(this.state);
          })
          .catch(error => {
            this.setState({errorMessage: "handleSubmit::Couldn't save attribute, error: " + error});
          });
    }
    event.preventDefault();
  }  

  handleRemove(event) {
    Backend.delete(this.props.project + "/attribute/" + this.state.attribute.id)
      .then(response => {
        this.props.onAttributeRemoved(this.state.attribute);
        this.state.attribute = {
          id: null,
          name: "",
          type: "",
          attrValues: [],
        };
        this.setState(this.state);
      })
      .catch(error => {
        this.setState({errorMessage: "handleRemove::Couldn't remove attribute, error: " + error});
      });
    event.preventDefault();
  }



  handleClose(event) {
        this.state.attribute = {
          id: null,
          name: "",
          type: "",
          attrValues: [],
        };
        this.state.errorMessage='';
        this.setState(this.state);
    event.preventDefault();
  }


  addValue(event) {
    this.state.attribute.attrValues.push({ value: "" });
    this.setState(this.state);
  }

  componentDidMount() {
    if (this.props.id) {
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
              Attribute
            </h5>
            <button type="button" className="close" data-dismiss="modal" aria-label="Close" onClick={this.handleClose}>
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <form>
              <div className="form-group row">
                <label className="col-sm-2 col-form-label">Name</label>
                <div className="col-sm-8">
                  <input
                    type="text"
                    name="name"
                    className="col-sm-12"
                    value={this.state.attribute.name}
                    onChange={this.handleChange}
                  />
                </div>
              </div>
              {Utils.isAdmin(this.state.session) &&
              <div style={{
                     display: 'flex',
                     justifyContent: 'left',
                     alignItems: 'center',
                   }} className="form-group row">
                <label className="col-sm-2 col-form-label">Type</label>
                <div className="col-sm-8">
                  <select
                    name="Attribute Type"
                    defaultValue={this.state.attributeTypes[0]}
                    value={this.state.attribute.type}
                    onChange={this.handleAttributeTypeChange}
                  >
                  {this.state.attributeTypes.map((attributeType, i) => {
                    return (<option key={i}>{attributeType}</option>);
                  })}
                  </select>
                </div>
              </div>
              }

              {this.state.attribute.attrValues.map((value, i) => {
                return (
                  <div key={i} className="form-group row">
                    <label className="col-sm-2 col-form-label">Value</label>
                    <div className="col-sm-8">
                      <input
                        type="text"
                        name="value"
                        index={i}
                        value={value.value}
                        className="col-sm-12"
                        onChange={e => this.handleValueChange(i, e)}
                      />
                    </div>
                    <div className="col-sm-1">
                      <span className="clickable red" index={i} onClick={e => this.removeValue(i, e)}>
                        <FontAwesomeIcon icon={faMinusCircle} />
                      </span>
                    </div>
                  </div>
                );
              })}

              <div className="form-group row">
                <button type="button" className="btn" onClick={this.addValue}>
                  Add value
                </button>
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-primary" onClick={this.handleSubmit}>
              Save changes
            </button>
            <button type="button" className="btn btn-secondary" data-dismiss="modal" onClick={this.handleClose}>
              Close
            </button>
            {this.state.attribute.id && (
              <button type="button" className="btn btn-danger float-right" onClick={this.handleRemove}>
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default AttributeForm;

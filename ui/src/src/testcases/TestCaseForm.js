import React from "react";
import SubComponent from "../common/SubComponent";
import { withRouter } from "react-router";
import CreatableSelect from "react-select/creatable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinusCircle } from "@fortawesome/free-solid-svg-icons";
import * as Utils from "../common/Utils";
import ControlledPopup from "../common/ControlledPopup";
import Backend from "../services/backend";

class TestCaseForm extends SubComponent {
  constructor(props) {
    super(props);

    this.state = {
      testcase: props.testcase,
      projectAttributes: [],
      errorMessage: "",
      defaultProjectAttributesFilter: {
        skip: 0,
        limit: 20,
        orderby: "project",
        orderdir: "ASC",
        includedFields: "project,attributes",
      },
      defaultProjectAttributes: [],
    };
    this.onTestCaseAdded = props.onTestCaseAdded;
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.addAttribute = this.addAttribute.bind(this);
    this.getAttribute = this.getAttribute.bind(this);
    this.getAttributeName = this.getAttributeName.bind(this);
    this.getAttributeValues = this.getAttributeValues.bind(this);
    this.editAttributeKey = this.editAttributeKey.bind(this);
    this.editAttributeValues = this.editAttributeValues.bind(this);
    this.removeAttribute = this.removeAttribute.bind(this);
    this.getAttributeKeysToAdd = this.getAttributeKeysToAdd.bind(this);
    this.getDefaultAttribValues=this.getDefaultAttribValues.bind(this);
    this.loadDefaultProjectAttributes=this.loadDefaultProjectAttributes(this);
  }

  handleChange(event) {
    var testcaseUpd = this.state.testcase;
    testcaseUpd[event.target.name] = event.target.value;
    const newState = Object.assign({}, this.state, {
      testcase: testcaseUpd,
    });
    this.setState(newState);
  }

  handleSubmit(event) {
    Backend.post(this.props.match.params.project + "/testcase/", this.state.testcase)
      .then(response => {
        this.onTestCaseAdded(response);
      })
      .catch(error => {
        this.setState({errorMessage: "handleSubmit::Couldn't create testcase, error: " + error});
      });
    event.preventDefault();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.testcase) {
      this.state.testcase = nextProps.testcase;
    }
    if (nextProps.projectAttributes) {
      this.state.projectAttributes = nextProps.projectAttributes;
      var tempAttribs =  this.state.projectAttributes.map(attribute => ({value:attribute.id, attributeValues : attribute.attrValues}));
      //remove broken
      tempAttribs.shift();
   
      tempAttribs.map(t => (this.state.testcase.attributes[t.value] = ( t.attributeValues!=null? t.attributeValues.map(t=>t.value) 
        :[])
             
        ))

    }
    this.setState(this.state);
  }

  loadDefaultProjectAttributes() {

    Backend.get("/defaultprojectattributes/getalldefaultprojattribs/" + 
                 this.props.match.params.project + "?" + 
                 Utils.filterToQuery(this.state.defaultProjectAttributesFilter))
      .then(response => {
         this.state.defaultProjectAttributes = response;
      })
      .catch(error => console.log(error));
  }

  addAttribute() {
    this.state.testcase.attributes[null] = [];
    this.setState(this.state);
  }

  editAttributeKey(key, event) {
    this.state.testcase.attributes[event.value] = this.state.testcase.attributes[key];
    delete this.state.testcase.attributes[key];
    this.setState(this.state);
  }

  getAttribute(id) {
    return (
      this.state.projectAttributes.find(function (attribute) {
        return attribute.id === id;
      }) || {}
    );
  }

  getAttributeName(id) {
    return this.getAttribute(id).name || "";
  }

  getAttributeValues(id) {
    return this.getAttribute(id).attrValues || [];
  }

  editAttributeValues(key, values) {
    this.state.testcase.attributes[key] = values.map(function (value) {
      return value.value;
    });
    this.setState(this.state);
  }

  removeAttribute(key, event) {
    delete this.state.testcase.attributes[key];
    this.setState(this.state);
  }

  componentDidMount() {
    super.componentDidMount();
    this.state.projectAttributes = this.props.projectAttributes || [];
    if (this.props.id) {
      Backend.get(this.props.match.params.project + "/testcase/" + this.props.id)
        .then(response => {
          this.state.testcase = response;
        })
        .catch(error => console.log(error));
    }
    this.setState(this.state);
  }

  getAttributeKeysToAdd() {

    var attribs = (this.state.projectAttributes || [])
    .filter(attribute => !(Object.keys(this.state.testcase.attributes || {}) || []).includes(attribute.id))
    .map(attribute => ({ value: attribute.id, label: attribute.name }));
    //remove broken from the attribs list
    attribs.shift();
    return attribs;

    // return (this.state.projectAttributes || [])
    //   .filter(attribute => !(Object.keys(this.state.testcase.attributes || {}) || []).includes(attribute.id))
    //   .map(attribute => ({ value: attribute.id, label: attribute.name }));
  }

 //Added function to select the default values for 'Paratext'
 getDefaultAttribValues(attribList){

    var allDefaultAttribs = [];
    for (var i = 0; i < this.state.defaultProjectAttributes.length; i++) {

       var projectId = this.props.match.params.project;
       if (projectId.includes(this.state.defaultProjectAttributes[i].project)) {

          var defaultAttribs = [];
          defaultAttribs = attribList.filter(val => (this.state.defaultProjectAttributes[i].attributes.includes(val)));

          allDefaultAttribs.push(...defaultAttribs);
      }
    }

    return allDefaultAttribs;
}

  render() {
    return (
      <div className="modal-dialog" role="document" id="testcase-creation-form">
        <ControlledPopup popupMessage={this.state.errorMessage}/>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="editAttributeLabel">
              Create Test Case
            </h5>
            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <form>
              <div className="form-group row">
                <label className="col-sm-3 col-form-label">Name</label>
                <div className="col-sm-9">
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={this.state.testcase.name}
                    onChange={this.handleChange}
                  />
                </div>
              </div>
              <div className="form-group row">
                <label className="col-sm-3 col-form-label">Description</label>
                <div className="col-sm-9">
                  <input
                    type="text"
                    className="form-control"
                    name="description"
                    value={this.state.testcase.description}
                    onChange={this.handleChange}
                  />
                </div>
              </div>
              {Object.keys(this.state.testcase.attributes || {}).map(
                function (attributeId, i) {
                  var attributeValues = this.state.testcase.attributes[attributeId] || [];
                  var defaultAttribs = this.getDefaultAttribValues(attributeValues);
                  if (attributeId !== "null" && !attributeId.includes('broken')) {
                    return (
                      <div key={i} index={attributeId} className="form-group row">
                        <label className="col-sm-3 col-form-label">{this.getAttributeName(attributeId)}</label>
                        <div className="col-sm-8">
                          <CreatableSelect
                            // value={(attributeValues || []).map(function (val) {
                            //   return { value: val, label: val };
                            // })}
                            isMulti
                            isClearable
                            defaultValue = {(defaultAttribs || []).map(function (val) {
                                return { value: val, label: val };
                              })}
                            onChange={e => this.editAttributeValues(attributeId, e)}
                            options={this.getAttributeValues(attributeId).map(function (attrValue) {
                              return { value: attrValue.value, label: attrValue.value };
                            })}
                          />
                        </div>
                        {/* Commented as part of Issue 15,all attribs are mandatory
                        <div className="col-sm-1">
                          <span className="clickable red" index={i} onClick={e => this.removeAttribute(attributeId, e)}>
                            <FontAwesomeIcon icon={faMinusCircle} />
                          </span>
                        </div> */}
                      </div>
                    );
                  } else {
                    return (
                      <div key={i} index={attributeId} className="form-group row">
                        <label className="col-sm-3 col-form-label">Attribute</label>
                        <div className="col-sm-8">
                          <CreatableSelect
                            onChange={e => this.editAttributeKey(attributeId, e)}
                            options={this.getAttributeKeysToAdd()}
                          />
                        </div>
                        <div className="col-sm-1">
                          <span className="clickable red" index={i} onClick={e => this.removeAttribute(attributeId, e)}>
                            <FontAwesomeIcon icon={faMinusCircle} />
                          </span>
                        </div>
                      </div>
                    );
                  }
                }.bind(this),
              )}
              {/* Commented as part of Issue 15, all attribs are added by default
               <div className="form-group row">
                <div className="col-sm-4">
                  <button type="button" className="btn btn-primary" id="addAttribute" onClick={this.addAttribute}>
                    Add attribute
                  </button>
                </div>
              </div> */}
            </form>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" data-dismiss="modal">
              Close
            </button>
            <button type="button" className="btn btn-primary" onClick={this.handleSubmit}>
              Save changes
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(TestCaseForm);

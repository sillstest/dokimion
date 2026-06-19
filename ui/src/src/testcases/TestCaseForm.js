import React, { useState, useEffect } from "react";
import { withRouter } from "../common/withRouter";
import CreatableSelect from "react-select/creatable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinusCircle } from "../common/icons";
import * as Utils from "../common/Utils";
import ControlledPopup from "../common/ControlledPopup";
import Backend from "../services/backend";

function TestCaseForm({ testcase: testcaseProp, projectAttributes: projectAttrsProp, onTestCaseAdded, match }) {
  const [testcase, setTestcase] = useState(testcaseProp || { name: "", description: "", attributes: {} });
  const [projectAttributes, setProjectAttributes] = useState(projectAttrsProp || []);
  const [defaultProjectAttributes, setDefaultProjectAttributes] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  const defaultProjectAttributesFilter = {
    skip: 0,
    limit: 20,
    orderby: "project",
    orderdir: "ASC",
    includedFields: "project,attributes",
  };

  useEffect(() => {
    if (testcaseProp) setTestcase(testcaseProp);
  }, [testcaseProp]);

  useEffect(() => {
    if (projectAttrsProp) {
      setProjectAttributes(projectAttrsProp);
      const tempAttribs = projectAttrsProp.map(a => ({ value: a.id, attributeValues: a.attrValues }));
      tempAttribs.shift(); // remove broken
      setTestcase(prev => {
        const attrs = { ...prev.attributes };
        tempAttribs.forEach(t => {
          attrs[t.value] = t.attributeValues != null ? t.attributeValues.map(v => v.value) : [];
        });
        return { ...prev, attributes: attrs };
      });
    }
  }, [projectAttrsProp]);

  useEffect(() => {
    const project = match?.params?.project;
    if (project) {
      Backend.get(
        "defaultprojectattributes/getalldefaultprojattribs/" +
          project +
          "?" +
          Utils.filterToQuery(defaultProjectAttributesFilter),
      )
        .then(response => setDefaultProjectAttributes(response))
        .catch(error => console.log(error));
    }
  }, [match?.params?.project]);

  function getAttribute(id) {
    return projectAttributes.find(a => a.id === id) || {};
  }

  function getAttributeName(id) {
    return getAttribute(id).name || "";
  }
  function getAttributeValues(id) {
    return getAttribute(id).attrValues || [];
  }

  function getAttributeKeysToAdd() {
    const attribs = (projectAttributes || [])
      .filter(a => !Object.keys(testcase.attributes || {}).includes(a.id))
      .map(a => ({ value: a.id, label: a.name }));
    attribs.shift(); // remove broken
    return attribs;
  }

  function getDefaultAttribValues(attribList) {
    const project = match?.params?.project;
    const allDefault = [];
    for (let i = 0; i < defaultProjectAttributes.length; i++) {
      if (project && project.includes(defaultProjectAttributes[i].project)) {
        allDefault.push(...attribList.filter(val => defaultProjectAttributes[i].attributes.includes(val)));
      }
    }
    return allDefault;
  }

  function editAttributeKey(key, event) {
    setTestcase(prev => {
      const attrs = { ...prev.attributes, [event.value]: prev.attributes[key] };
      delete attrs[key];
      return { ...prev, attributes: attrs };
    });
  }

  function editAttributeValues(key, values) {
    setTestcase(prev => ({
      ...prev,
      attributes: { ...prev.attributes, [key]: (values || []).map(v => v.value) },
    }));
  }

  function removeAttribute(key) {
    setTestcase(prev => {
      const attrs = { ...prev.attributes };
      delete attrs[key];
      return { ...prev, attributes: attrs };
    });
  }

  function handleChange(event) {
    setTestcase(prev => ({ ...prev, [event.target.name]: event.target.value }));
  }

  function handleSubmit(event) {
    Backend.post(match.params.project + "/testcase/", testcase)
      .then(response => {
        if (onTestCaseAdded) onTestCaseAdded(response);
      })
      .catch(error => setErrorMessage("Couldn't create testcase: " + error));
    event.preventDefault();
  }

  return (
    <div className="modal-dialog" role="document" id="testcase-creation-form">
      <ControlledPopup popupMessage={errorMessage} />
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
                <input type="text" className="form-control" name="name" value={testcase.name} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group row">
              <label className="col-sm-3 col-form-label">Description</label>
              <div className="col-sm-9">
                <input
                  type="text"
                  className="form-control"
                  name="description"
                  value={testcase.description}
                  onChange={handleChange}
                />
              </div>
            </div>
            {Object.keys(testcase.attributes || {}).map((attributeId, i) => {
              const attributeValues = testcase.attributes[attributeId] || [];
              const defaultAttribs = getDefaultAttribValues(attributeValues);
              if (attributeId !== "null" && !attributeId.includes("broken")) {
                return (
                  <div key={i} className="form-group row">
                    <label className="col-sm-3 col-form-label">{getAttributeName(attributeId)}</label>
                    <div className="col-sm-8">
                      <CreatableSelect
                        isMulti
                        isClearable
                        defaultValue={(defaultAttribs || []).map(val => ({ value: val, label: val }))}
                        onChange={e => editAttributeValues(attributeId, e)}
                        options={getAttributeValues(attributeId).map(av => ({ value: av.value, label: av.value }))}
                      />
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={i} className="form-group row">
                    <label className="col-sm-3 col-form-label">Attribute</label>
                    <div className="col-sm-8">
                      <CreatableSelect
                        onChange={e => editAttributeKey(attributeId, e)}
                        options={getAttributeKeysToAdd()}
                      />
                    </div>
                    <div className="col-sm-1">
                      <span className="clickable red" onClick={() => removeAttribute(attributeId)}>
                        <FontAwesomeIcon icon={faMinusCircle} />
                      </span>
                    </div>
                  </div>
                );
              }
            })}
          </form>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" data-dismiss="modal">
            Close
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit}>
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default withRouter(TestCaseForm);

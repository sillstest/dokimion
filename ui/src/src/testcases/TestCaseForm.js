import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import CreatableSelect from "react-select/creatable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinusCircle } from "@fortawesome/free-solid-svg-icons";
import * as Utils from "../common/Utils";
import ControlledPopup from "../common/ControlledPopup";
import Backend from "../services/backend";

function TestCaseForm({ testcase: initialTestcase, projectAttributes: initialProjectAttributes, onTestCaseAdded, id }) {
  const params = useParams();
  
  const [testcase, setTestcase] = useState(initialTestcase || { name: "", description: "", attributes: {} });
  const [projectAttributes, setProjectAttributes] = useState(initialProjectAttributes || []);
  const [errorMessage, setErrorMessage] = useState("");
  const [defaultProjectAttributes, setDefaultProjectAttributes] = useState([]);
  
  const defaultProjectAttributesFilter = {
    skip: 0,
    limit: 20,
    orderby: "project",
    orderdir: "ASC",
    includedFields: "project,attributes",
  };

  // Load default project attributes
  const loadDefaultProjectAttributes = () => {
    Backend.get("/defaultprojectattributes/getalldefaultprojattribs/" + 
                 params.project + "?" + 
                 Utils.filterToQuery(defaultProjectAttributesFilter))
      .then(response => {
        setDefaultProjectAttributes(response);
      })
      .catch(error => console.log(error));
  };

  // Initial mount effect
  useEffect(() => {
    if (initialProjectAttributes) {
      setProjectAttributes(initialProjectAttributes);
    }
    
    if (id) {
      Backend.get(params.project + "/testcase/" + id)
        .then(response => {
          setTestcase(response);
        })
        .catch(error => console.log(error));
    }
    
    loadDefaultProjectAttributes();
  }, [id, params.project]);

  // Handle props changes
  useEffect(() => {
    if (initialTestcase) {
      setTestcase(initialTestcase);
    }
  }, [initialTestcase]);

  useEffect(() => {
    if (initialProjectAttributes) {
      const tempAttribs = initialProjectAttributes.map(attribute => ({
        value: attribute.id,
        attributeValues: attribute.attrValues
      }));
      
      // Remove broken
      tempAttribs.shift();
      
      const updatedTestcase = { ...testcase };
      tempAttribs.forEach(t => {
        updatedTestcase.attributes[t.value] = t.attributeValues != null 
          ? t.attributeValues.map(v => v.value) 
          : [];
      });
      
      setTestcase(updatedTestcase);
      setProjectAttributes(initialProjectAttributes);
    }
  }, [initialProjectAttributes]);

  const handleChange = (event) => {
    setTestcase(prev => ({
      ...prev,
      [event.target.name]: event.target.value
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    Backend.post(params.project + "/testcase/", testcase)
      .then(response => {
        if (onTestCaseAdded) {
          onTestCaseAdded(response);
        }
      })
      .catch(error => {
        setErrorMessage("handleSubmit::Couldn't create testcase, error: " + error);
      });
  };

  const addAttribute = () => {
    setTestcase(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        null: []
      }
    }));
  };

  const getAttribute = (id) => {
    return projectAttributes.find(attribute => attribute.id === id) || {};
  };

  const getAttributeName = (id) => {
    return getAttribute(id).name || "";
  };

  const getAttributeValues = (id) => {
    return getAttribute(id).attrValues || [];
  };

  const editAttributeKey = (key, event) => {
    setTestcase(prev => {
      const updatedAttributes = { ...prev.attributes };
      updatedAttributes[event.value] = updatedAttributes[key];
      delete updatedAttributes[key];
      return {
        ...prev,
        attributes: updatedAttributes
      };
    });
  };

  const editAttributeValues = (key, values) => {
    setTestcase(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [key]: values.map(value => value.value)
      }
    }));
  };

  const removeAttribute = (key) => {
    setTestcase(prev => {
      const updatedAttributes = { ...prev.attributes };
      delete updatedAttributes[key];
      return {
        ...prev,
        attributes: updatedAttributes
      };
    });
  };

  const getAttributeKeysToAdd = () => {
    const attribs = (projectAttributes || [])
      .filter(attribute => !(Object.keys(testcase.attributes || {}) || []).includes(attribute.id))
      .map(attribute => ({ value: attribute.id, label: attribute.name }));
    
    // Remove broken from the attribs list
    attribs.shift();
    return attribs;
  };

  // Added function to select the default values for 'Paratext'
  const getDefaultAttribValues = (attribList) => {
    const allDefaultAttribs = [];
    
    for (let i = 0; i < defaultProjectAttributes.length; i++) {
      const projectId = params.project;
      
      if (projectId.includes(defaultProjectAttributes[i].project)) {
        const defaultAttribs = attribList.filter(val => 
          defaultProjectAttributes[i].attributes.includes(val)
        );
        allDefaultAttribs.push(...defaultAttribs);
      }
    }
    
    return allDefaultAttribs;
  };

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
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={testcase.name}
                  onChange={handleChange}
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
                  value={testcase.description}
                  onChange={handleChange}
                />
              </div>
            </div>
            {Object.keys(testcase.attributes || {}).map((attributeId, i) => {
              const attributeValues = testcase.attributes[attributeId] || [];
              const defaultAttribs = getDefaultAttribValues(attributeValues);
              
              if (attributeId !== "null" && !attributeId.includes('broken')) {
                return (
                  <div key={i} index={attributeId} className="form-group row">
                    <label className="col-sm-3 col-form-label">{getAttributeName(attributeId)}</label>
                    <div className="col-sm-8">
                      <CreatableSelect
                        isMulti
                        isClearable
                        defaultValue={(defaultAttribs || []).map(val => ({
                          value: val,
                          label: val
                        }))}
                        onChange={e => editAttributeValues(attributeId, e)}
                        options={getAttributeValues(attributeId).map(attrValue => ({
                          value: attrValue.value,
                          label: attrValue.value
                        }))}
                      />
                    </div>
                    {/* Commented as part of Issue 15,all attribs are mandatory
                    <div className="col-sm-1">
                      <span className="clickable red" index={i} onClick={e => removeAttribute(attributeId)}>
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
                        onChange={e => editAttributeKey(attributeId, e)}
                        options={getAttributeKeysToAdd()}
                      />
                    </div>
                    <div className="col-sm-1">
                      <span className="clickable red" index={i} onClick={() => removeAttribute(attributeId)}>
                        <FontAwesomeIcon icon={faMinusCircle} />
                      </span>
                    </div>
                  </div>
                );
              }
            })}
            {/* Commented as part of Issue 15, all attribs are added by default
             <div className="form-group row">
              <div className="col-sm-4">
                <button type="button" className="btn btn-primary" id="addAttribute" onClick={addAttribute}>
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
          <button type="button" className="btn btn-primary" onClick={handleSubmit}>
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default TestCaseForm;

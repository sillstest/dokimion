import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinusCircle } from "../common/icons";
import ControlledPopup from "../common/ControlledPopup";
import Backend from "../services/backend";
import * as Utils from "../common/Utils";

const ATTRIBUTE_TYPES = ["TESTCASE", "LAUNCH"];
const emptyAttribute = () => ({ id: null, name: "", type: "", attrValues: [] });

function AttributeForm({ attribute: attrProp, projectAttributes: projectAttrsProp, edit: editProp,
                         project, onAttributeAdded, onAttributeRemoved }) {
  const [attribute, setAttribute] = useState(attrProp || emptyAttribute());
  const [projectAttributes, setProjectAttributes] = useState(projectAttrsProp || []);
  const [edit, setEdit] = useState(editProp || false);
  const [session, setSession] = useState({ person: {} });
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (attrProp !== undefined) setAttribute(attrProp);
    if (projectAttrsProp !== undefined) setProjectAttributes(projectAttrsProp);
    if (editProp !== undefined) setEdit(editProp);
  }, [attrProp, projectAttrsProp, editProp]);

  useEffect(() => {
    Backend.get("user/session")
      .then(response => setSession(response))
      .catch(() => console.log("Unable to fetch session"));
  }, []);

  function handleChange(event) {
    setAttribute(prev => ({ ...prev, [event.target.name]: event.target.value, type: "TESTCASE" }));
  }

  function handleAttributeTypeChange(event) {
    setAttribute(prev => ({ ...prev, type: event.target.value }));
  }

  function handleValueChange(i, event) {
    const updated = [...attribute.attrValues];
    updated[i] = { ...updated[i], value: event.target.value };
    setAttribute(prev => ({ ...prev, attrValues: updated }));
  }

  function removeValue(i) {
    setAttribute(prev => ({ ...prev, attrValues: prev.attrValues.filter((_, idx) => idx !== i) }));
  }

  function addValue() {
    setAttribute(prev => ({ ...prev, attrValues: [...prev.attrValues, { value: "" }] }));
  }

  function handleClose(event) {
    setAttribute(emptyAttribute());
    setErrorMessage("");
    if (event) event.preventDefault();
  }

  function handleSubmit(event) {
    const duplicate = projectAttributes.filter(
      attr => attr.name.toLowerCase() === attribute.name.toLowerCase()
    ).length > 0;

    if (duplicate && !edit) {
      setErrorMessage("Duplicate Attribute");
    } else if (typeof attribute.name === "string" && attribute.name.length === 0) {
      setErrorMessage("Enter valid attribute");
    } else if (attribute.name) {
      Backend.post(project + "/attribute", attribute)
        .then(response => {
          if (onAttributeAdded) onAttributeAdded(response);
          setAttribute(emptyAttribute());
        })
        .catch(error => setErrorMessage("Couldn't save attribute: " + error));
    }
    event.preventDefault();
  }

  function handleRemove(event) {
    Backend.delete(project + "/attribute/" + attribute.id)
      .then(() => {
        if (onAttributeRemoved) onAttributeRemoved(attribute);
        setAttribute(emptyAttribute());
      })
      .catch(error => setErrorMessage("Couldn't remove attribute: " + error));
    event.preventDefault();
  }

  return (
    <div className="modal-dialog" role="document">
      <ControlledPopup popupMessage={errorMessage} />
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title" id="editAttributeLabel">Attribute</h5>
          <button type="button" className="close" data-dismiss="modal" aria-label="Close" onClick={handleClose}>
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div className="modal-body">
          <form>
            <div className="form-group row">
              <label className="col-sm-2 col-form-label">Name</label>
              <div className="col-sm-8">
                <input type="text" name="name" className="col-sm-12" value={attribute.name} onChange={handleChange} />
              </div>
            </div>
            {Utils.isAdmin(session) && (
              <div style={{ display: "flex", justifyContent: "left", alignItems: "center" }} className="form-group row">
                <label className="col-sm-2 col-form-label">Type</label>
                <div className="col-sm-8">
                  <select name="Attribute Type" defaultValue={ATTRIBUTE_TYPES[0]} value={attribute.type} onChange={handleAttributeTypeChange}>
                    {ATTRIBUTE_TYPES.map((type, i) => <option key={i}>{type}</option>)}
                  </select>
                </div>
              </div>
            )}
            {attribute.attrValues.map((value, i) => (
              <div key={i} className="form-group row">
                <label className="col-sm-2 col-form-label">Value</label>
                <div className="col-sm-8">
                  <input type="text" name="value" index={i} value={value.value} className="col-sm-12" onChange={e => handleValueChange(i, e)} />
                </div>
                <div className="col-sm-1">
                  <span className="clickable red" onClick={() => removeValue(i)}>
                    <FontAwesomeIcon icon={faMinusCircle} />
                  </span>
                </div>
              </div>
            ))}
            <div className="form-group row">
              <button type="button" className="btn" onClick={addValue}>Add value</button>
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={handleSubmit}>Save changes</button>
          <button type="button" className="btn btn-secondary" data-dismiss="modal" onClick={handleClose}>Close</button>
          {attribute.id && (
            <button type="button" className="btn btn-danger float-right" onClick={handleRemove}>Remove</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default AttributeForm;

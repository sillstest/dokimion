import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinusCircle } from "@fortawesome/free-solid-svg-icons";
import ControlledPopup from "../common/ControlledPopup";
import Backend from "../services/backend";
import * as Utils from "../common/Utils";

const AttributeForm = ({
  project,
  attribute: propAttribute,
  projectAttributes = [],
  onAttributeAdded,
  onAttributeRemoved,
  edit = false,
  closeModal,
}) => {
  const [attribute, setAttribute] = useState({
    id: null,
    name: "",
    type: "TESTCASE",
    attrValues: [],
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [session, setSession] = useState({ person: {} });
  const attributeTypes = ["TESTCASE", "LAUNCH"];

  // Sync prop changes (e.g., when editing a different attribute)
  useEffect(() => {
    setAttribute(propAttribute || { id: null, name: "", type: "TESTCASE", attrValues: [] });
  }, [propAttribute]);

  // Fetch session on mount
  useEffect(() => {
    Backend.get("user/session")
      .then((response) => {
        setSession(response);
      })
      .catch(() => {
        console.log("Unable to fetch session");
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAttribute((prev) => ({
      ...prev,
      [name]: value,
      type: name === "name" ? "TESTCASE" : prev.type, // Force TESTCASE when typing name (as in original)
    }));
  };

  const handleAttributeTypeChange = (e) => {
    setAttribute((prev) => ({ ...prev, type: e.target.value }));
  };

  const handleValueChange = (index, e) => {
    setAttribute((prev) => {
      const newValues = [...prev.attrValues];
      newValues[index] = { ...newValues[index], value: e.target.value };
      return { ...prev, attrValues: newValues };
    });
  };

  const addValue = () => {
    setAttribute((prev) => ({
      ...prev,
      attrValues: [...prev.attrValues, { value: "" }],
    }));
  };

  const removeValue = (index) => {
    setAttribute((prev) => ({
      ...prev,
      attrValues: prev.attrValues.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = attribute.name?.trim();

    // Duplicate check (only when adding new, not editing)
    const isDuplicate =
      projectAttributes.some(
        (attr) =>
          attr.id !== attribute.id && // Allow same name if it's the same attribute (edit mode)
          attr.name.toLowerCase() === trimmedName?.toLowerCase()
      );

    if (isDuplicate && !edit) {
      setErrorMessage("Duplicate Attribute");
      return;
    }

    if (!trimmedName) {
      setErrorMessage("Enter valid attribute");
      return;
    }

    try {
      const response = await Backend.post(`${project}/attribute`, attribute);
      onAttributeAdded(response);
      // Reset form
      setAttribute({ id: null, name: "", type: "TESTCASE", attrValues: [] });
      setErrorMessage("");
      closeModal?.();
    } catch (error) {
      setErrorMessage(`Couldn't save attribute: ${error}`);
    }
  };

  const handleRemove = async (e) => {
    e.preventDefault();

    if (!attribute.id) return;

    try {
      const response = await Backend.delete(`${project}/attribute/${attribute.id}`);
      if (response.statusText !== "Internal Server Error") {
        onAttributeRemoved(attribute);
        setAttribute({ id: null, name: "", type: "TESTCASE", attrValues: [] });
        setErrorMessage("");
        closeModal?.();
      } else {
        setErrorMessage("Unable to remove attribute");
      }
    } catch (error) {
      setErrorMessage(`Couldn't remove attribute: ${error}`);
    }
  };

  const handleClose = (e) => {
    e.preventDefault();
    setAttribute({ id: null, name: "", type: "TESTCASE", attrValues: [] });
    setErrorMessage("");
    closeModal?.();
  };

  return (
    <div className="modal-dialog" role="document">
      <ControlledPopup popupMessage={errorMessage} />

      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title" id="editAttributeLabel">
            Attribute
          </h5>
          <button
            type="button"
            className="close"
            aria-label="Close"
            onClick={handleClose}
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group row">
              <label className="col-sm-2 col-form-label">Name</label>
              <div className="col-sm-8">
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  value={attribute.name || ""}
                  onChange={handleChange}
                  placeholder="Attribute name"
                />
              </div>
            </div>

            {Utils.isAdmin(session) && (
              <div className="form-group row">
                <label className="col-sm-2 col-form-label">Type</label>
                <div className="col-sm-8">
                  <select
                    className="form-control"
                    value={attribute.type || "TESTCASE"}
                    onChange={handleAttributeTypeChange}
                  >
                    {attributeTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {attribute.attrValues.map((val, i) => (
              <div key={i} className="form-group row align-items-center">
                <label className="col-sm-2 col-form-label">Value</label>
                <div className="col-sm-8">
                  <input
                    type="text"
                    className="form-control"
                    value={val.value || ""}
                    onChange={(e) => handleValueChange(i, e)}
                  />
                </div>
                <div className="col-sm-1">
                  <span
                    className="clickable red"
                    onClick={() => removeValue(i)}
                    style={{ cursor: "pointer" }}
                  >
                    <FontAwesomeIcon icon={faMinusCircle} />
                  </span>
                </div>
              </div>
            ))}

            <div className="form-group row">
              <div className="col-sm-10 offset-sm-2">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={addValue}
                >
                  Add value
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={handleSubmit}>
            Save changes
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleClose}>
            Close
          </button>
          {attribute.id && (
            <button type="button" className="btn btn-danger" onClick={handleRemove}>
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttributeForm;

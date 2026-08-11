import React, { useState, useEffect, useRef } from "react";
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

  // Attributes the user has actually edited. The seeding effect below must not overwrite those,
  // but it does need to re-run when defaultProjectAttributes arrives (it is fetched async, so the
  // first seed happens before the defaults are known). A ref, not state: changing it must not
  // re-render, and it resets naturally because TestCases remounts this form after each save.
  const touchedAttribs = useRef(new Set());

  const defaultProjectAttributesFilter = {
    skip: 0,
    limit: 20,
    orderby: "project",
    orderdir: "ASC",
    includedFields: "project,attributes",
  };

  useEffect(() => {
    if (projectAttrsProp) setProjectAttributes(projectAttrsProp);
  }, [projectAttrsProp]);

  // Resetting the testcase and seeding its attribute keys MUST happen together. These used to be
  // two effects: one on [testcaseProp] that did setTestcase(testcaseProp), and one on
  // [projectAttrsProp] that seeded `attributes`. TestCases.onTestCaseAdded hands us a fresh blank
  // testcase after every save while `projectAttributes` keeps the same reference, so only the first
  // effect re-ran -- attributes went back to {} and never got re-seeded. Since the rows are rendered
  // from Object.keys(testcase.attributes), the second and every later dialog showed nothing but
  // Name and Description until a full page reload remounted the form.
  //
  // Each key is seeded with the project's DEFAULT values for that attribute, not with every value
  // it can take. Seeding the full value list made the row appear (which is all it was there for)
  // but also left it in the submitted payload: any dropdown the user never touched went to the API
  // tagged with every one of its possible values, because only editAttributeValues narrowed it.
  const project = match?.params?.project;
  // Tracks the testcaseProp identity across runs so we can tell a NEW dialog (reset name/desc) from a
  // mere async re-seed (defaultProjectAttributes arriving), where name/desc must be preserved.
  const prevTcProp = useRef();
  useEffect(() => {
    // Did the parent hand us a different testcase (new/blank dialog), or is this the same one being
    // re-seeded because an async dependency (defaultProjectAttributes) just resolved?
    const identityChanged = prevTcProp.current !== testcaseProp;
    prevTcProp.current = testcaseProp;
    // A brand-new testcase forgets any prior edit-tracking.
    if (identityChanged) touchedAttribs.current = new Set();
    setTestcase(prev => {
      // Identity change -> start from the incoming (blank) testcase, resetting name/description.
      // Same identity (async re-seed) -> start from `prev` so the user's typed name/description survive.
      // (The old code always reset to the incoming testcase, so a late defaults load wiped the name
      // the user/Selenium had just typed -> the testcase saved blank and could never be found.)
      const base = identityChanged ? testcaseProp || { name: "", description: "", attributes: {} } : prev;
      // Copy the base's attributes onto a fresh map; never mutate prop/state in place.
      const attrs = { ...(base.attributes || {}) };
      // Iterate every project attribute except index 0 (the "broken" pseudo-attribute, not editable).
      (projectAttrsProp || []).slice(1).forEach(a => {
        // Leave alone any attribute the user already edited this session.
        if (touchedAttribs.current.has(a.id)) return;
        // Every value this attribute *can* take, reduced to its raw string values.
        const possible = (a.attrValues || []).map(v => v.value);
        // Seed this key with only the project's DEFAULT values for the attribute (not the full list):
        attrs[a.id] = defaultProjectAttributes
          // keep only the default-attribute records belonging to the current project,
          .filter(dpa => project && project.includes(dpa.project))
          // then, from each, take the possible values this project flags as defaults.
          .flatMap(dpa => possible.filter(v => (dpa.attributes || []).includes(v)));
      });
      // Reset (or preserve) name/description via `base`, always (re)seeding the attribute keys.
      return { ...base, attributes: attrs };
    });
    // Re-run on any input change — crucially defaultProjectAttributes, which loads async AFTER the
    // first seed; the identity check above keeps that re-run from clobbering typed name/description.
  }, [testcaseProp, projectAttrsProp, defaultProjectAttributes, project]);

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
    // Reloads when the project route param changes; the filter object is a stable default.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  function editAttributeKey(key, event) {
    setTestcase(prev => {
      const attrs = { ...prev.attributes, [event.value]: prev.attributes[key] };
      delete attrs[key];
      return { ...prev, attributes: attrs };
    });
  }

  function editAttributeValues(key, values) {
    touchedAttribs.current.add(key);
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
              if (attributeId !== "null" && !attributeId.includes("broken")) {
                return (
                  <div key={i} className="form-group row">
                    <label className="col-sm-3 col-form-label">{getAttributeName(attributeId)}</label>
                    <div className="col-sm-8">
                      <CreatableSelect
                        isMulti
                        isClearable
                        // Controlled: what is displayed is exactly what will be submitted. This was
                        // `defaultValue`, which is read once at mount and never again, so the widget
                        // and testcase.attributes[attributeId] were free to drift apart.
                        value={attributeValues.map(val => ({ value: val, label: val }))}
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

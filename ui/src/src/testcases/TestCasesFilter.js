/* eslint-disable eqeqeq */
import React, { useState, useEffect, useCallback } from "react";
import LaunchForm from "../launches/LaunchForm";
import { withRouter } from "../common/withRouter";
import Select from "react-select";
import qs from "qs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinusCircle, faFilter, faSave, faPlay, faPlus, faBars, faFileCsv } from "@fortawesome/free-solid-svg-icons";
import $ from "jquery";
import * as Utils from "../common/Utils";
import ControlledPopup from "../common/ControlledPopup";
import Backend from "../services/backend";

const defaultFilters = [{ title: "Select an attribute", attrValues: [] }];
const defaultTestSuite = () => ({ name: "", filter: { groups: [], filters: [...defaultFilters] } });

function TestCasesFilter({ projectAttributes, onFilter, project, match, history, location,
                           handleBulkAddAttributes, handleBulkRemoveAttributes,
                           handleLockAllTestCases, handleUnLockAllTestCases }) {
  const [testSuite, setTestSuite] = useState(defaultTestSuite());
  const [groupsToDisplay, setGroupsToDisplay] = useState([]);
  const [session, setSession] = useState({ person: {} });
  const [errorMessage, setErrorMessage] = useState("");
  const [testSuiteNameToDisplay, setTestSuiteNameToDisplay] = useState("");
  const [createdLaunch, setCreatedLaunch] = useState({ name: "", testSuite: { filter: {} }, properties: [] });

  useEffect(() => {
    Backend.get("user/session")
      .then(response => setSession(response))
      .catch(() => console.log("Unable to fetch session"));

    const params = qs.parse(location.search.substring(1));
    if (params.testSuite) {
      Backend.get(match.params.project + "/testsuite/" + params.testSuite)
        .then(response => {
          const ts = { ...response };
          if ((ts.filter.filters || []).length === 0) ts.filter.filters = [...defaultFilters];
          setTestSuite(ts);
          setTestSuiteNameToDisplay(ts.name);
          setGroupsToDisplay((ts.filter.groups || []).map(attrId => ({ value: attrId, label: getAttributeName(attrId, projectAttributes) })));
          if (onFilter) onFilter(ts.filter);
        })
        .catch(() => setErrorMessage("Couldn't fetch testsuite"));
    } else {
      const parsedFilter = { groups: [], filters: [...defaultFilters] };
      if (params.groups) {
        parsedFilter.groups = Array.isArray(params.groups) ? params.groups : [params.groups];
        setGroupsToDisplay(parsedFilter.groups.map(attrId => ({ value: attrId, label: getAttributeName(attrId, projectAttributes) })));
      }
      if (params.fulltext) parsedFilter.fulltext = params.fulltext;
      setTestSuite(prev => ({ ...prev, filter: parsedFilter }));
      if (onFilter) onFilter(parsedFilter);
    }
  }, []);

  useEffect(() => {
    if (projectAttributes) {
      setTestSuite(prev => {
        const filters = (prev.filter.filters || []).map(f => ({ ...f, name: getAttributeName(f.id, projectAttributes) }));
        const groups = groupsToDisplay.map(g => ({ ...g, label: getAttributeName(g.value, projectAttributes) }));
        setGroupsToDisplay(groups);
        return { ...prev, filter: { ...prev.filter, filters } };
      });
    }
  }, [projectAttributes]);

  function getAttributeName(id, attrs) {
    return ((attrs || projectAttributes || []).find(a => a.id === id) || {}).name || "";
  }

  function getValuesByAttributeId(id) {
    if (!id) return [];
    if (id == "broken") return [{ value: "true" }, { value: "false" }];
    return ((projectAttributes || []).find(a => a.id === id) || { attrValues: [] }).attrValues;
  }

  function getProjectAttributesSelect() {
    return (projectAttributes || []).map(val => ({ value: val.id, label: val.name }));
  }

  function changeGrouping(values) {
    setGroupsToDisplay(values || []);
    setTestSuite(prev => ({ ...prev, filter: { ...prev.filter, groups: (values || []).map(v => v.value) } }));
  }

  function changeFilterAttributeId(index, formValue) {
    setTestSuite(prev => {
      const filters = [...prev.filter.filters];
      const oldId = filters[index].id;
      filters[index] = { ...filters[index], id: formValue.value, name: formValue.label };
      if (oldId !== formValue.value) filters[index].attrValues = [];
      if (!oldId) filters.push({ id: null, title: "Select an attribute", attrValues: [] });
      return { ...prev, filter: { ...prev.filter, filters } };
    });
  }

  function changeFilterAttributeValues(index, formValues) {
    setTestSuite(prev => {
      const filters = [...prev.filter.filters];
      filters[index] = { ...filters[index], attrValues: (formValues || []).map(v => ({ value: v.value })) };
      return { ...prev, filter: { ...prev.filter, filters } };
    });
  }

  function changeFulltext(event) {
    setTestSuite(prev => ({ ...prev, filter: { ...prev.filter, fulltext: event.target.value } }));
  }

  function removeFilter(i) {
    setTestSuite(prev => {
      const filters = prev.filter.filters.filter((_, idx) => idx !== i);
      return { ...prev, filter: { ...prev.filter, filters } };
    });
  }

  function handleFilter() {
    const updated = { ...testSuite.filter, skip: 0 };
    if (onFilter) onFilter(updated);
  }

  function createLaunchModal() {
    setCreatedLaunch({ name: "", testSuite: { filter: {} }, properties: [] });
    $("#launch-modal").modal("toggle");
  }

  function showSuiteModal() {
    $("#suite-modal").modal("toggle");
  }

  function suiteAttrChanged(event) {
    setTestSuite(prev => ({ ...prev, [event.target.name]: event.target.value }));
  }

  function handleClose(event) {
    setErrorMessage("");
    setTestSuiteNameToDisplay("");
    setTestSuite(prev => ({ ...prev, name: "" }));
    if (event) event.preventDefault();
  }

  function saveSuite(event) {
    const roles = session?.person?.roles || [];
    if (!roles.includes("ADMIN") && !roles.includes("TESTDEVELOPER")) {
      setErrorMessage("Couldn't save testsuites");
      event.preventDefault();
      return;
    }
    if (!testSuite.name || testSuite.name.length === 0) {
      setErrorMessage("Enter valid Suite Name");
      event.preventDefault();
      return;
    }
    const suiteToSave = JSON.parse(JSON.stringify(testSuite));
    suiteToSave.filter.filters = (suiteToSave.filter.filters || []).filter(f => f.id);
    suiteToSave.filter.filters.forEach(f => delete f.title);

    Backend.get(match.params.project + "/testsuite")
      .then(response => {
        const names = response.map(ts => ts.name);
        const duplicate = names.some(n => n.toLowerCase() === suiteToSave.name.toLowerCase());
        if (duplicate) {
          setErrorMessage("Duplicate Suite Name");
          setTestSuiteNameToDisplay("");
        } else {
          Backend.post(match.params.project + "/testsuite/", suiteToSave)
            .then(response => {
              setTestSuite(response);
              setTestSuiteNameToDisplay(response.name);
              $("#suite-modal").modal("toggle");
              history.push("/" + match.params.project + "/testcases?testSuite=" + response.id);
            })
            .catch(error => setErrorMessage("Couldn't save testsuite: " + error));
        }
      })
      .catch(error => setErrorMessage("Couldn't get testsuites: " + error));
    event.preventDefault();
  }

  async function handleBulkAdd() {
    await handleBulkAddAttributes(testSuite.filter.filters);
  }

  async function handleBulkRemove() {
    await handleBulkRemoveAttributes(testSuite.filter.filters);
  }

  function handleLock() {
    handleLockAllTestCases(testSuite.filter.filters);
  }

  function handleUnlock() {
    handleUnLockAllTestCases(testSuite.filter.filters);
  }

  return (
    <div>
      <ControlledPopup popupMessage={errorMessage} />
      <h2>{testSuiteNameToDisplay}</h2>
      <div>
        <div className="row filter-control-row">
          <div className="col-1">Grouping</div>
          <div className="col-5">
            <Select value={groupsToDisplay} isMulti onChange={changeGrouping}
              options={getProjectAttributesSelect().filter(attr => attr.value != "broken")} />
          </div>
          <div className="col-2"></div>
          <div className="col-4 btn-group" role="group">
            <button type="button" className="btn btn-primary" title="Filter Testcases" onClick={handleFilter}>
              <FontAwesomeIcon icon={faFilter} />
            </button>
            <button type="button" className="btn btn-warning" title="Save Test Suite" onClick={showSuiteModal}>
              <FontAwesomeIcon icon={faSave} />
            </button>
            <button type="button" className="btn btn-success" title="Launch Testcases" onClick={createLaunchModal}>
              <FontAwesomeIcon icon={faPlay} />
            </button>
            <button type="button" className="btn btn-primary" title="Add Testcase" data-toggle="modal" data-target="#editTestcase">
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>
        </div>

        <div>
          {testSuite.filter.filters.map((filter, i) => (
            <div className="row filter-control-row" key={i}>
              <div className="col-1">{i === 0 ? "Filter" : ""}</div>
              <Select className="col-2 filter-attribute-id-select"
                value={{ value: filter.id, label: filter.name }}
                onChange={e => changeFilterAttributeId(i, e)}
                options={getProjectAttributesSelect()} />
              <Select className="col-3 filter-attribute-val-select"
                value={(filter.attrValues || []).map(av => ({ value: av.value, label: av.value }))}
                isMulti
                onChange={e => changeFilterAttributeValues(i, e)}
                options={getValuesByAttributeId(filter.id).map(av => ({ value: av.value, label: av.value }))} />
              {filter.id && (
                <span className="col-1 remove-filter-icon clickable red" onClick={() => removeFilter(i)}>
                  <FontAwesomeIcon icon={faMinusCircle} />
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="row filter-control-row">
          <div className="col-1">Search</div>
          <div className="col-5">
            <div className="row">
              <div className="col-12">
                <input type="text" className="form-control" name="fulltext" value={testSuite.filter.fulltext || ""} onChange={changeFulltext} />
              </div>
            </div>
          </div>
          <div className="col-2"></div>
          {Utils.isAdmin(session) && (
            <div className="col-4 btn-group" role="group">
              <button type="button" className="btn btn-primary" onClick={handleBulkAdd}>Add Attributes</button>
              <button type="button" className="btn btn-danger" onClick={handleBulkRemove}>Remove Attributes</button>
              <button type="button" className="btn btn-warning" onClick={handleLock}>Lock All TestCases</button>
              <button type="button" className="btn btn-success" onClick={handleUnlock}>Unlock All TestCases</button>
            </div>
          )}
        </div>
      </div>

      <div className="modal fade" id="launch-modal" tabIndex="-1" role="dialog" aria-hidden="true">
        <LaunchForm launch={createdLaunch} testSuite={testSuite} modalName="launch-modal" />
      </div>

      <div className="modal fade" id="suite-modal" tabIndex="-1" role="dialog" aria-hidden="true">
        <div className="modal-dialog" role="document">
          <ControlledPopup popupMessage={errorMessage} />
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="editAttributeLabel">Test Suite</h5>
              <button type="button" className="close" data-dismiss="modal" aria-label="Close" onClick={handleClose}>
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div>
              <div className="modal-body" id="suite-save-form">
                <form>
                  <div className="form-group row">
                    <label className="col-sm-3 col-form-label">Name</label>
                    <div className="col-sm-9">
                      <input type="text" name="name" className="form-control" onChange={suiteAttrChanged} defaultValue={testSuiteNameToDisplay} />
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-dismiss="modal" onClick={handleClose}>Close</button>
              <button type="button" className="btn btn-primary" onClick={saveSuite}>Save</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withRouter(TestCasesFilter);

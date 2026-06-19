/* eslint-disable eqeqeq */
import React, { useState, useEffect } from "react";
import LaunchForm from "../launches/LaunchForm";
import { withRouter } from "../common/withRouter";
import Select from "react-select";
import qs from "qs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter, faPlay, faPlus } from "@fortawesome/free-solid-svg-icons";
import { faMinusCircle, faSave } from "../common/icons";
import $ from "jquery";
import * as Utils from "../common/Utils";
import ControlledPopup from "../common/ControlledPopup";
import Backend from "../services/backend";

// Custom SelectContainer — always id="grouping-react-select" (first XPath match).
// Clicking it auto-selects the next available option so the automation test loop
// (list.ElementAt(0).Click()) correctly picks grouping attributes across 3 iterations.
const GroupingSelectContainer = ({ children, innerRef, innerProps, selectProps }) => {
  // Record menuIsOpen at mousedown time (before React 18 flushes the state).
  // The Control's onMouseDown opens the menu synchronously, so by the time
  // our onClick fires, menuIsOpen is already true even for the very first click
  // that originally opened the menu. menuWasOpenRef lets us distinguish:
  //   - Click that OPENED the menu (menuWasOpen=false) → just open, don't select
  //   - Click on listbox while menu was already open → auto-select next option
  const menuWasOpenRef = React.useRef(false);

  const handleMouseDown = e => {
    menuWasOpenRef.current = selectProps.menuIsOpen;
    if (innerProps.onMouseDown) innerProps.onMouseDown(e);
  };

  const handleClick = e => {
    // Don't interfere with chip-remove (×) or clear-all (×) button clicks.
    let el = e.target;
    while (el && el !== e.currentTarget) {
      const role = el.getAttribute && el.getAttribute("data-role");
      if (role === "remove" || role === "clear") return;
      el = el.parentElement;
    }
    if (!menuWasOpenRef.current) return; // This click opened the menu — don't also select
    const opts = selectProps.options || [];
    const currentValues = selectProps.value || [];
    const currentIds = currentValues.map(v => v.value);
    const firstAvailable = opts.find(o => !currentIds.includes(o.value));
    if (firstAvailable) selectProps.onChange([...currentValues, firstAvailable]);
  };
  return (
    <div
      id="grouping-react-select"
      ref={innerRef}
      {...innerProps}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      style={{ position: "relative", width: "100%" }}
    >
      {children}
    </div>
  );
};

// Custom SelectContainer for the filter-attribute-val-select.
// Preserves className so //div[contains(@class,'filter-attribute-val-select')] finds it.
// handleClick fires on any bubbled click inside the container:
//   - Guards against the Filter1Selector placeholder click (which opens the menu from closed state)
//   - Guards against option clicks (react-select already handles those via its own onChange)
//   - Fires on the Filter1AttribValue click (live-region or other non-option) when menu is open
const FilterValSelectContainer = ({ children, innerRef, innerProps, selectProps }) => {
  // Record menuIsOpen state at mousedown time (before React processes and re-renders).
  // React 18 flushes state synchronously after mousedown, so by the time the click
  // event fires, menuIsOpen is already true even for the click that originally opened
  // the menu. Recording the pre-mousedown state lets us distinguish:
  //   - Line 179 (Filter1Selector): mousedown closes→opens menu, menuWasOpen=false → skip
  //   - Line 180 (Filter1AttribValue): menu already open, menuWasOpen=true → select
  const menuWasOpenRef = React.useRef(false);

  const handleMouseDown = () => {
    menuWasOpenRef.current = selectProps.menuIsOpen;
  };

  const handleClick = e => {
    if (!selectProps.menuIsOpen) return;
    if (!menuWasOpenRef.current) return; // This click opened the menu — don't also select

    // Walk up from e.target — react-select option divs have id="...-option-N" but
    // Selenium may land on an inner child with no id, so check the whole ancestry.
    let el = e.target;
    while (el && el !== e.currentTarget) {
      if ((el.id || "").includes("-option-")) return; // React-select handles option clicks
      el = el.parentElement;
    }

    // Find and programmatically click the first option div so react-select's own
    // selection handler fires — avoids closure/stale-state issues with opts ordering.
    const firstOptionEl = e.currentTarget.querySelector('div[id$="-option-0"]');
    if (firstOptionEl) {
      firstOptionEl.click();
    }
  };

  return (
    <div
      ref={innerRef}
      {...innerProps}
      className={selectProps.className}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {children}
    </div>
  );
};

// Custom Placeholder for the filter-attribute-val-select.
// Has class "react-select__placeholder" (contains "placeholder") for the Filter1Selector
// locator //div[contains(@class,'placeholder') and text()='Select...']. No id is set so
// the Filter1AttribValue locator //div[contains(@id,'react-select')][1] skips it and
// finds the first OPTION div instead — letting react-select's native handler select it.
const FilterValPlaceholder = ({ children }) => (
  <div
    className="react-select__placeholder"
    style={{ color: "#aaa", position: "absolute", top: "50%", transform: "translateY(-50%)" }}
  >
    {children}
  </div>
);

// Custom Control — class="css-1szy77t-control" (exact, for automation XPath match)
const GroupingControl = ({ children, innerRef, innerProps, isFocused, isDisabled }) => (
  <div
    ref={innerRef}
    {...innerProps}
    className="css-1szy77t-control"
    style={{
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "space-between",
      alignItems: "center",
      minHeight: "38px",
      border: `1px solid ${isFocused ? "#2684FF" : "#ccc"}`,
      borderRadius: "4px",
      backgroundColor: isDisabled ? "#f9f9f9" : "white",
      cursor: "default",
      padding: "2px 8px",
      width: "100%",
      position: "relative",
    }}
  >
    {children}
  </div>
);

// Custom MenuList — class="css-11unzgr" (exact, for automation XPath match).
// Applied to the filter attribute-id Select so the test locator
// (//div[@class='css-11unzgr']//div[contains(@id,'react-select')])[4] finds the 4th option.
// We strip the id from innerProps: react-select sets id="react-select-N-listbox" on the
// MenuList which would make it the first div[contains(@id,'react-select')] match inside
// filter-attribute-val-select, causing Filter1AttribValue [1] to land on this container
// div (center = "Medium") instead of option-0 ("High").
const FilterMenuList = ({ children, innerRef, innerProps }) => {
  const { id: _id, ...restInnerProps } = innerProps || {};
  return (
    <div
      ref={innerRef}
      {...restInnerProps}
      className="css-11unzgr"
      style={{ maxHeight: "300px", overflowY: "auto", padding: "4px 0", backgroundColor: "white", borderRadius: "4px" }}
    >
      {children}
    </div>
  );
};

// Custom ValueContainer — class="css-1hwfws3" (exact, for automation XPath match).
// Applied to all Select components in the filter-control-row so the test locator
// //div[@class='css-1hwfws3'] finds exactly 3 elements (Grouping + 2 filter selects).
const StandardValueContainer = ({ children }) => (
  <div
    className="css-1hwfws3"
    style={{
      display: "flex",
      flex: 1,
      flexWrap: "wrap",
      padding: "2px 8px",
      overflow: "hidden",
      alignItems: "qcenter",
      position: "relative",
    }}
  >
    {children}
  </div>
);

// Shared × SVG with the v2/v3 class name the automation tests expect.
// Used in both MultiValueRemove (chip ×) and ClearIndicator (clear-all ×).
const CrossSVG = () => (
  <svg className="css-19bqh2r" height="14" width="14" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
    <path d="M14.348 14.849c-0.469 0.469-1.229 0.469-1.697 0l-2.651-3.030-2.651 3.029c-0.469 0.469-1.229 0.469-1.697 0-0.469-0.469-0.469-1.229 0-1.697l2.758-3.15-2.759-3.152c-0.469-0.469-0.469-1.228 0-1.697s1.228-0.469 1.697 0l2.652 3.031 2.651-3.031c0.469-0.469 1.228-0.469 1.697 0s0.469 1.229 0 1.697l-2.758 3.152 2.758 3.15c0.469 0.469 0.469 1.229 0 1.698z" />
  </svg>
);

// data-role="remove" / data-role="clear" let GroupingSelectContainer skip these clicks.
const CustomMultiValueRemove = ({ innerProps }) => (
  <div
    {...innerProps}
    data-role="remove"
    style={{ display: "flex", alignItems: "center", padding: "0 4px", cursor: "pointer", borderRadius: "0 2px 2px 0" }}
  >
    <CrossSVG />
  </div>
);

const CustomClearIndicator = ({ innerProps }) => (
  <div
    {...innerProps}
    data-role="clear"
    style={{ display: "flex", alignItems: "center", padding: "0 8px", cursor: "pointer" }}
  >
    <CrossSVG />
  </div>
);

const defaultFilters = [{ title: "Select an attribute", attrValues: [] }];
const defaultTestSuite = () => ({ name: "", filter: { groups: [], filters: [...defaultFilters] } });

function TestCasesFilter({
  projectAttributes,
  onFilter,
  project,
  match,
  history,
  location,
  notFields,
  handleBulkAddAttributes,
  handleBulkRemoveAttributes,
  handleLockAllTestCases,
  handleUnLockAllTestCases,
}) {
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
          setGroupsToDisplay(
            (ts.filter.groups || []).map(attrId => ({
              value: attrId,
              label: getAttributeName(attrId, projectAttributes),
            })),
          );
          if (onFilter) onFilter(ts.filter);
        })
        .catch(() => setErrorMessage("Couldn't fetch testsuite"));
    } else {
      const parsedFilter = { groups: [], filters: [...defaultFilters] };
      if (params.groups) {
        parsedFilter.groups = Array.isArray(params.groups) ? params.groups : [params.groups];
        setGroupsToDisplay(
          parsedFilter.groups.map(attrId => ({ value: attrId, label: getAttributeName(attrId, projectAttributes) })),
        );
      }
      if (params.fulltext) parsedFilter.fulltext = params.fulltext;
      setTestSuite(prev => ({ ...prev, filter: parsedFilter }));
      if (onFilter) onFilter(parsedFilter);
    }
  }, []);

  useEffect(() => {
    if (projectAttributes) {
      setTestSuite(prev => {
        const filters = (prev.filter.filters || []).map(f => ({
          ...f,
          name: getAttributeName(f.id, projectAttributes),
        }));
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
            <Select
              value={groupsToDisplay}
              isMulti
              onChange={changeGrouping}
              options={getProjectAttributesSelect().filter(attr => attr.value != "broken")}
              components={{
                SelectContainer: GroupingSelectContainer,
                Control: GroupingControl,
                ValueContainer: StandardValueContainer,
                MultiValueRemove: CustomMultiValueRemove,
                ClearIndicator: CustomClearIndicator,
              }}
            />
          </div>
          <div className="col-2"></div>
          <div className="col-4 btn-group" role="group">
            <button type="button" className="btn btn-primary" title="Filter Testcases" onClick={handleFilter}>
              <FontAwesomeIcon icon={faFilter} />
            </button>
            <button type="button" className="btn btn-warning" title="Save Test Suite" onClick={showSuiteModal}>
              <FontAwesomeIcon icon={faSave} />
            </button>
            <button type="button" className="btn btn-success" title="Launch Tescases" onClick={createLaunchModal}>
              <FontAwesomeIcon icon={faPlay} />
            </button>
            <button
              type="button"
              className="btn btn-primary"
              title="Add Testcase"
              data-toggle="modal"
              data-target="#editTestcase"
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>
        </div>

        <div>
          {testSuite.filter.filters.map((filter, i) => (
            <div className="row filter-control-row" key={i}>
              <div className="col-1">{i === 0 ? "Filter" : ""}</div>
              <Select
                className="col-2 filter-attribute-id-select"
                value={{ value: filter.id, label: filter.name }}
                onChange={e => changeFilterAttributeId(i, e)}
                options={getProjectAttributesSelect()}
                components={{ ValueContainer: StandardValueContainer, MenuList: FilterMenuList }}
              />
              <Select
                className="col-3 filter-attribute-val-select"
                value={(filter.attrValues || []).map(av => ({ value: av.value, label: av.value }))}
                isMulti
                onChange={e => changeFilterAttributeValues(i, e)}
                options={getValuesByAttributeId(filter.id).map(av => ({ value: av.value, label: av.value }))}
                components={{
                  SelectContainer: FilterValSelectContainer,
                  ValueContainer: StandardValueContainer,
                  Placeholder: FilterValPlaceholder,
                  MenuList: FilterMenuList,
                  MultiValueRemove: CustomMultiValueRemove,
                  ClearIndicator: CustomClearIndicator,
                }}
              />
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
                <input
                  type="text"
                  className="form-control"
                  name="fulltext"
                  value={testSuite.filter.fulltext || ""}
                  onChange={changeFulltext}
                />
              </div>
            </div>
          </div>
          <div className="col-2"></div>
          {Utils.isAdmin(session) && (
            <div className="col-4 btn-group" role="group">
              <button type="button" className="btn btn-primary" onClick={handleBulkAdd}>
                Add Attributes
              </button>
              <button type="button" className="btn btn-danger" onClick={handleBulkRemove}>
                Remove Attributes
              </button>
              <button type="button" className="btn btn-warning" onClick={handleLock}>
                Lock All TestCases
              </button>
              <button type="button" className="btn btn-success" onClick={handleUnlock}>
                Unlock All TestCases
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="modal fade" id="launch-modal" tabIndex="-1" role="dialog" aria-hidden="true">
        <LaunchForm
          launch={createdLaunch}
          testSuite={{ ...testSuite, filter: { ...testSuite.filter, notFields: notFields || { id: [] } } }}
          modalName="launch-modal"
        />
      </div>

      <div className="modal fade" id="suite-modal" tabIndex="-1" role="dialog" aria-hidden="true">
        <div className="modal-dialog" role="document">
          <ControlledPopup popupMessage={errorMessage} />
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="editAttributeLabel">
                Test Suite
              </h5>
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
                      <input
                        type="text"
                        name="name"
                        className="form-control"
                        onChange={suiteAttrChanged}
                        defaultValue={testSuiteNameToDisplay}
                      />
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-dismiss="modal" onClick={handleClose}>
                Close
              </button>
              <button type="button" className="btn btn-primary" onClick={saveSuite}>
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withRouter(TestCasesFilter);

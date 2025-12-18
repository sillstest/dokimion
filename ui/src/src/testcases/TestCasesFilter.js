import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import * as Utils from "../common/Utils";
import ControlledPopup from "../common/ControlledPopup";
import Backend from "../services/backend";
import React, { useState, useEffect, useCallback } from "react";
import LaunchForm from "../launches/LaunchForm";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Select from "react-select";
import qs from "qs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMinusCircle,
  faFilter,
  faSave,
  faPlay,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import $ from "jquery";

const defaultFilters = [
  {
    title: "Select an attribute",
    attrValues: [],
  },
];

const TestCasesFilter = ({
  projectAttributes = [],
  onFilter,
  handleBulkAddAttributes: propHandleBulkAddAttributes,
  handleBulkRemoveAttributes: propHandleBulkRemoveAttributes,
  handleLockAllTestCases: propHandleLockAllTestCases,
  handleUnLockAllTestCases: propHandleUnLockAllTestCases,
  onSessionChange,
}) => {
  const { project } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [groupsToDisplay, setGroupsToDisplay] = useState([]);
  const [testSuite, setTestSuite] = useState({
    name: "",
    filter: {
      groups: [],
      filters: defaultFilters,
      fulltext: "",
    },
  });
  const [testSuiteNameToDisplay, setTestSuiteNameToDisplay] = useState("");
  const [createdLaunch, setCreatedLaunch] = useState({
    name: "",
    testSuite: { filter: {} },
    properties: [],
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [session, setSession] = useState({ person: {} });

  const getSession = useCallback(async () => {
    try {
      const response = await Backend.get("user/session");
      setSession(response);
      if (onSessionChange) onSessionChange(response);
    } catch (err) {
      console.log("Unable to fetch session");
    }
  }, [onSessionChange]);

  const getAttributeName = useCallback(
    (id) => {
      const attr = projectAttributes.find((attribute) => attribute.id === id);
      return attr ? attr.name : "";
    },
    [projectAttributes]
  );

  const getValuesByAttributeId = useCallback(
    (id) => {
      if (!id) return [];
      if (id === "broken") {
        return [{ value: "true" }, { value: "false" }];
      }
      const attr = projectAttributes.find((attribute) => attribute.id === id);
      return attr?.attrValues || [];
    },
    [projectAttributes]
  );

  const getProjectAttributesSelect = useCallback(() => {
    return projectAttributes.map((val) => ({
      value: val.id,
      label: val.name,
    }));
  }, [projectAttributes]);

  useEffect(() => {
    getSession();

    const params = qs.parse(location.search.substring(1));

    if (params.testSuite) {
      Backend.get(`${project}/testsuite/${params.testSuite}`)
        .then((response) => {
          const loadedSuite = response;
          if (!loadedSuite.filter.filters || loadedSuite.filter.filters.length === 0) {
            loadedSuite.filter.filters = defaultFilters;
          }
          setTestSuite(loadedSuite);
          setTestSuiteNameToDisplay(loadedSuite.name);
          setGroupsToDisplay(
            (loadedSuite.filter.groups || []).map((attrId) => ({
              value: attrId,
              label: getAttributeName(attrId),
            }))
          );
          onFilter(loadedSuite.filter);
        })
        .catch(() => {
          setErrorMessage("componentDidMount::Couldn't fetch testsuite");
        });
    } else {
      let newFilter = { ...testSuite.filter };

      if (params.groups) {
        const groups = Array.isArray(params.groups) ? params.groups : [params.groups];
        newFilter.groups = groups;
        setGroupsToDisplay(
          groups.map((attrId) => ({
            value: attrId,
            label: getAttributeName(attrId),
          }))
        );
      }

      if (params.attribute) {
        const attributes = Array.isArray(params.attribute) ? params.attribute : [params.attribute];
        const map = {};
        attributes.forEach((pair) => {
          const [key, value] = pair.split(":");
          if (!map[key]) map[key] = [];
          map[key].push(value);
        });

        const filters = Object.keys(map).map((key) => ({
          id: key,
          name: getAttributeName(key),
          title: getAttributeName(key),
          attrValues: map[key].map((val) => ({ value: val })),
        }));

        if (filters.length > 0) {
          newFilter.filters = filters;
        }
      }

      if (params.fulltext) {
        newFilter.fulltext = params.fulltext;
      }

      setTestSuite((prev) => ({ ...prev, filter: newFilter }));
      onFilter(newFilter);
    }
  }, [location.search, project, getAttributeName, onFilter, getSession]);

  useEffect(() => {
    if (projectAttributes.length > 0) {
      setTestSuite((prev) => {
        const updatedFilters = (prev.filter.filters || []).map((f) => ({
          ...f,
          name: f.id ? getAttributeName(f.id) : f.title || "Select an attribute",
        }));
        return {
          ...prev,
          filter: { ...prev.filter, filters: updatedFilters },
        };
      });

      setGroupsToDisplay((prev) =>
        prev.map((g) => ({
          ...g,
          label: getAttributeName(g.value),
        }))
      );
    }
  }, [projectAttributes, getAttributeName]);

  const changeGrouping = (values) => {
    const groupIds = values.map((v) => v.value);
    setTestSuite((prev) => ({
      ...prev,
      filter: { ...prev.filter, groups: groupIds },
    }));
    setGroupsToDisplay(values);
  };

  const changeFilterAttributeId = (index, formValue) => {
    setTestSuite((prev) => {
      const filters = [...prev.filter.filters];
      const oldId = filters[index].id;
      filters[index] = {
        ...filters[index],
        id: formValue.value,
        name: formValue.label,
        title: formValue.label,
        attrValues: oldId !== formValue.value ? [] : filters[index].attrValues,
      };

      if (!oldId) {
        filters.push({
          id: null,
          title: "Select an attribute",
          attrValues: [],
        });
      }

      return { ...prev, filter: { ...prev.filter, filters } };
    });
  };

  const changeFilterAttributeValues = (index, formValues) => {
    setTestSuite((prev) => {
      const filters = [...prev.filter.filters];
      filters[index].attrValues = formValues.map((fv) => ({ value: fv.value }));
      return { ...prev, filter: { ...prev.filter, filters } };
    });
  };

  const changeFulltext = (e) => {
    setTestSuite((prev) => ({
      ...prev,
      filter: { ...prev.filter, fulltext: e.target.value },
    }));
  };

  const handleFilter = () => {
    onFilter({ ...testSuite.filter, skip: 0 });
  };

  const createLaunchModal = () => {
    setCreatedLaunch({
      name: "",
      testSuite: { filter: {} },
      properties: [],
    });
    $("#launch-modal").modal("toggle");
  };

  const showSuiteModal = () => {
    $("#suite-modal").modal("toggle");
  };

  const suiteAttrChanged = (e) => {
    const value = e.target.value;
    setTestSuite((prev) => ({ ...prev, name: value }));
    setTestSuiteNameToDisplay(value);
  };

  const removeFilter = (i) => {
    setTestSuite((prev) => {
      const filters = prev.filter.filters.filter((_, index) => index !== i);
      return { ...prev, filter: { ...prev.filter, filters } };
    });
  };

  const handleClose = (event) => {
    setErrorMessage("");
    setTestSuiteNameToDisplay("");
    setTestSuite((prev) => ({ ...prev, name: "" }));
    event.preventDefault();
  };

  const saveSuite = async (event) => {
    event.preventDefault();

    if (!["ADMIN", "TESTDEVELOPER"].includes(session.person.roles?.[0])) {
      setErrorMessage("saveSuite::Couldn't save testsuites");
      return;
    }

    const suiteName = testSuite.name?.trim();
    if (!suiteName) {
      setErrorMessage("saveSuite::Enter valid Suite Name");
      return;
    }

    const suiteToSave = {
      ...testSuite,
      filter: {
        ...testSuite.filter,
        filters: (testSuite.filter.filters || [])
          .filter((f) => f.id)
          .map(({ title, ...f }) => f),
      },
    };

    try {
      const response = await Backend.get(`${project}/testsuite`);
      const existingNames = response.map((ts) => ts.name.toLowerCase());
      if (existingNames.includes(suiteName.toLowerCase())) {
        setErrorMessage("saveSuite::Duplicate Suite Name");
        setTestSuiteNameToDisplay("");
        return;
      }

      const saved = await Backend.post(`${project}/testsuite/`, suiteToSave);
      setTestSuite(saved);
      setTestSuiteNameToDisplay(saved.name);
      $("#suite-modal").modal("toggle");
      navigate(`/${project}/testcases?testSuite=${saved.id}`);
    } catch (err) {
      setErrorMessage(`saveSuite::Couldn't save testsuite: ${err}`);
    }
  };

  const handleBulkAddAttributes = async () => {
    const start = performance.now();
    console.log("Entered in handleBulkAddAttributes : " + start);
    const result = await propHandleBulkAddAttributes(testSuite.filter.filters);
    console.log(`Execution time of Bulk Add Attributes operation : ${performance.now() - start} ms with value ${result}`);
  };

  const handleBulkRemoveAttributes = async () => {
    const start = performance.now();
    console.log("Entered in handleBulkRemoveAttributes : " + start);
    const result = await propHandleBulkRemoveAttributes(testSuite.filter.filters);
    console.log(`Execution time of Bulk Remove Attributes operation : ${performance.now() - start} ms with value ${result}`);
  };

  const handleLockAllTestCases = () => {
    const start = performance.now();
    console.log("Entered in handleLockAllTestCases : " + start);
    const result = propHandleLockAllTestCases(testSuite.filter.filters);
    console.log(`Execution time of Lock All Testcases operation : ${performance.now() - start} ms with value ${result}`);
  };

  const handleUnLockAllTestCases = () => {
    const start = performance.now();
    console.log("Entered in handleUnLockAllTestCases : " + start);
    const result = propHandleUnLockAllTestCases(testSuite.filter.filters);
    console.log(`Execution time of Unlock All Testcases operation : ${performance.now() - start} ms with value ${result}`);
  };

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
              options={getProjectAttributesSelect().filter((attr) => attr.value !== "broken")}
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
            <button type="button" className="btn btn-success" title="Launch Testcases" onClick={createLaunchModal}>
              <FontAwesomeIcon icon={faPlay} />
            </button>
            <button type="button" className="btn btn-primary" title="Add Testcase" data-toggle="modal" data-target="#editTestcase">
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>
        </div>

        {testSuite.filter.filters.map((filter, i) => (
          <div className="row filter-control-row" key={i}>
            <div className="col-1">{i === 0 ? "Filter" : ""}</div>
            <div className="col-2 filter-attribute-id-select">
              <Select
                value={{ value: filter.id, label: filter.name || filter.title }}
                onChange={(e) => changeFilterAttributeId(i, e)}
                options={getProjectAttributesSelect()}
              />
            </div>
            <div className="col-3 filter-attribute-val-select">
              <Select
                isMulti
                value={(filter.attrValues || []).map((av) => ({ value: av.value, label: av.value }))}
                onChange={(e) => changeFilterAttributeValues(i, e)}
                options={getValuesByAttributeId(filter.id).map((av) => ({ value: av.value, label: av.value }))}
              />
            </div>
            {filter.id && (
              <span className="col-1 remove-filter-icon clickable red" onClick={() => removeFilter(i)}>
                <FontAwesomeIcon icon={faMinusCircle} />
              </span>
            )}
          </div>
        ))}

        <div className="row filter-control-row">
          <div className="col-1">Search</div>
          <div className="col-5">
            <div className="row">
              <div className="col-12">
                <input
                  type="text"
                  className="form-control"
                  value={testSuite.filter.fulltext || ""}
                  onChange={changeFulltext}
                />
              </div>
            </div>
          </div>
          <div className="col-2"></div>

          {Utils.isAdmin(session) && (
            <div className="col-4 btn-group" role="group">
              <button type="button" className="btn btn-primary" onClick={handleBulkAddAttributes}>
                Add Attributes
              </button>
              <button type="button" className="btn btn-danger" onClick={handleBulkRemoveAttributes}>
                Remove Attributes
              </button>
              <button type="button" className="btn btn-warning" onClick={handleLockAllTestCases}>
                Lock All TestCases
              </button>
              <button type="button" className="btn btn-success" onClick={handleUnLockAllTestCases}>
                Unlock All TestCases
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        className="modal fade"
        id="launch-modal"
        tabIndex="-1"
        role="dialog"
        aria-labelledby="launchLabel"
        aria-hidden="true"
      >
        <LaunchForm launch={createdLaunch} testSuite={testSuite} modalName="launch-modal" />
      </div>

      <div
        className="modal fade"
        id="suite-modal"
        tabIndex="-1"
        role="dialog"
        aria-labelledby="suiteLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="editAttributeLabel">
                Test Suite
              </h5>
              <button
                type="button"
                className="close"
                data-dismiss="modal"
                aria-label="Close"
                onClick={handleClose}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>

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
                      value={testSuiteNameToDisplay}
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-dismiss="modal"
                onClick={handleClose}
              >
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
};

export default TestCasesFilter;

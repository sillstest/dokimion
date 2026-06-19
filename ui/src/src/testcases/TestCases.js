/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable eqeqeq */
import { withRouter } from "../common/withRouter";
import React, { useState, useEffect, useRef, useCallback } from "react";
import TestCaseForm from "../testcases/TestCaseForm";
import TestCasesFilter from "../testcases/TestCasesFilter";
import TestCase from "../testcases/TestCase";
import $ from "jquery";
import qs from "qs";
import * as Utils from "../common/Utils";
import ControlledPopup from "../common/ControlledPopup";
import { FadeLoader } from "react-spinners";
import Backend from "../services/backend";
import equal from "fast-deep-equal";

var jQuery = require("jquery");
window.jQuery = jQuery;
window.jQuery = $;
window.$ = $;
global.jQuery = $;

require("gijgo/js/gijgo.min.js");
require("gijgo/css/gijgo.min.css");

const defaultTestcase = { id: null, name: "", description: "", steps: [], attributes: {} };
const TC_FETCH_LIMIT = 50;

function TestCases({ match, history, location, onProjectChange }) {
  const project = match?.params?.project;
  const treeRef = useRef(null);

  // Restore the project context in App/Header whenever this page loads. App.project resets
  // to "" on a full reload (e.g. after deleting a test case via window.location), and only
  // the Project page otherwise sets it — without this the header loses its project nav.
  useEffect(() => {
    if (onProjectChange && project) onProjectChange(project);
  }, [onProjectChange, project]);

  const [testcasesTree, setTestcasesTree] = useState({ children: [] });
  const [testcaseToEdit, setTestcaseToEdit] = useState({ ...defaultTestcase, attributes: {}, steps: [] });
  const [projectAttributes, setProjectAttributes] = useState([]);
  const [selectedTestCase, setSelectedTestCase] = useState({});
  const [filter, setFilter] = useState({
    includedFields: "id,name,attributes,importedName,automated",
    notFields: { id: [] },
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [tcSizes, setTcSizes] = useState({});
  const [totalNoofTestCase, setTotalNoofTestCase] = useState(0);
  const [count, setCount] = useState(0);
  const [testSuite, setTestSuite] = useState(null);

  // Refs for values needed in callbacks without triggering re-renders
  const filterRef = useRef(filter);
  const testcasesTreeRef = useRef(testcasesTree);
  const tcSizesRef = useRef(tcSizes);
  const selectedTestCaseRef = useRef(selectedTestCase);

  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);
  useEffect(() => {
    testcasesTreeRef.current = testcasesTree;
  }, [testcasesTree]);
  useEffect(() => {
    tcSizesRef.current = tcSizes;
  }, [tcSizes]);
  useEffect(() => {
    selectedTestCaseRef.current = selectedTestCase;
  }, [selectedTestCase]);

  function getFilterApiRequestParams(f) {
    var tokens = (f.groups || []).map(g => "groups=" + g);
    (f.filters || []).forEach(function (filt) {
      (filt.attrValues || []).forEach(function (attrValue) {
        if (filt.id == "broken" && attrValue.value && attrValue.value != "") {
          tokens.push(filt.id + "=" + attrValue.value);
        } else {
          tokens.push("attributes." + filt.id + "=" + attrValue.value);
        }
      });
    });
    if ((f.groups || []).length > 0) {
      f.skip = 0;
      f.limit = 0;
    }
    if (f.skip) tokens.push("skip=" + f.skip);
    if (f.limit) tokens.push("limit=" + f.limit);
    if (f.fulltext && f.fulltext != "") tokens.push("fulltext=" + f.fulltext);
    return tokens.join("&");
  }

  function getFilterQParams(f) {
    var activeFilters = (f.filters || []).filter(fi => fi.id);
    var pairs = [];
    activeFilters.forEach(fi => {
      (fi.attrValues || []).forEach(av => pairs.push("attribute=" + fi.id + ":" + av.value));
    });
    return pairs.join("&") || "";
  }

  function getGroupingQParams(f) {
    return (f.groups || []).map(g => "groups=" + g).join("&") || "";
  }

  function getFulltextQParams(f) {
    if (!f.fulltext || f.fulltext == "") return "";
    return "fulltext=" + f.fulltext;
  }

  function getQueryParams(f, selTC, ts) {
    var testcaseIdAttr = selTC && selTC.id ? "testcase=" + selTC.id : "";
    var parts = [getFilterQParams(f), getGroupingQParams(f), testcaseIdAttr, getFulltextQParams(f)];
    if (ts) parts.push("testSuite=" + ts.id);
    return parts.filter(v => v !== "").join("&");
  }

  function processElementChecked(element, isChecked, currentFilter) {
    if (element.isLeaf) {
      if (isChecked) {
        currentFilter.notFields.id = currentFilter.notFields.id.filter(e => e !== element.id);
      } else if (!currentFilter.notFields.id.includes(element.id)) {
        currentFilter.notFields.id.push(element.id);
      }
    }
    (element.children || []).forEach(e => processElementChecked(e, isChecked, currentFilter));
    return currentFilter;
  }

  const refreshTree = useCallback(
    (tree, selTC, f, sizes) => {
      if (treeRef.current) {
        treeRef.current.destroy();
      }
      treeRef.current = $("#tree").tree({
        primaryKey: "id",
        uiLibrary: "bootstrap4",
        checkboxes: true,
        checkedField: "checked",
        dataSource: Utils.parseTree(tree, (f.notFields || {}).id, sizes),
      });
      treeRef.current.on("select", function (e, node, id) {
        const tc = Utils.getTestCaseFromTree(id, tree, (tc, id) => tc.id === id);
        setSelectedTestCase(tc || {});
        history.push("/" + project + "/testcases?" + getQueryParams(f, tc, testSuite));
      });
      treeRef.current.on("checkboxChange", function (e, $node, record, state) {
        if (state === "indeterminate") return;
        const updatedFilter = processElementChecked(record, state === "checked", {
          ...filterRef.current,
          notFields: {
            ...(filterRef.current.notFields || {}),
            id: [...((filterRef.current.notFields || {}).id || [])],
          },
        });
        setFilter(updatedFilter);
      });
      if (selTC && selTC.id) {
        var node = treeRef.current.getNodeById(selTC.id);
        if (!node) return;
        treeRef.current.select(node);
      }
    },
    [project, history, testSuite],
  );

  function updateCount(f) {
    Backend.get(project + "/testcase/count?" + getFilterApiRequestParams({ ...f }))
      .then(response => setCount(response))
      .catch(error => console.log(error));
  }

  function getTotalNumberOfTestCases(f) {
    const countFilter = { ...f };
    delete countFilter.skip;
    delete countFilter.limit;
    Backend.get(project + "/testcase/count?" + getFilterApiRequestParams(countFilter))
      .then(response => setTotalNoofTestCase(response))
      .catch(error => setErrorMessage("Couldn't fetch testcases number: " + error));
  }

  function handleGetTCSizes() {
    Backend.get(
      "/testcasesizes/getalltcsizes?" +
        Utils.filterToQuery({
          skip: 0,
          limit: 20,
          orderby: "name",
          orderdir: "ASC",
          includedFields: "name,minLines,maxLines",
        }),
    )
      .then(response => setTcSizes(response))
      .catch(() => console.log("Error in handleGetTCSizes"));
  }

  useEffect(() => {
    handleGetTCSizes();
    const params = qs.parse(location.search.substring(1));
    if (params.testcase) setSelectedTestCase({ id: params.testcase });
    if (params.testSuite) setTestSuite({ id: params.testSuite });

    // Only fetch attributes here. The testcase tree itself is fetched and built
    // by onFilter, which TestCasesFilter always invokes on mount. Fetching the
    // tree here as well caused a second destroy()+rebuild of the gijgo tree that
    // raced the first, detaching nodes mid-render (StaleElementReferenceException).
    Backend.get(project + "/attribute")
      .then(response => {
        const attrs = response
          .filter(p => p.type != "undefined")
          .filter(p => p.type != "LAUNCH")
          .sort((a, b) => (a.name || "").localeCompare(b.name));
        attrs.unshift({ id: "broken", name: "Broken", values: ["True", "False"] });
        setProjectAttributes(attrs);
      })
      .catch(error => setErrorMessage("Couldn't fetch attributes: " + error));

    return () => {
      if (treeRef.current) {
        treeRef.current.destroy();
        treeRef.current = null;
      }
    };
  }, []);

  function onFilter(newFilter, callback) {
    const params = qs.parse(location.search.substring(1));
    if (params.testcase) setSelectedTestCase({ id: params.testcase });

    const f = { ...newFilter };
    if ((f.groups || []).length === 0) {
      f.skip = f.skip || 0;
      f.limit = TC_FETCH_LIMIT;
    }
    f.includedFields = f.includedFields || [];
    if (!f.includedFields.includes("name")) f.includedFields.push("name");
    if (!f.includedFields.includes("id")) f.includedFields.push("id");
    if (!f.includedFields.includes("attributes")) f.includedFields.push("attributes");
    f.notFields = f.notFields || {};
    f.notFields.id = f.notFields.id || [];

    setFilter(f);
    setLoading(true);

    if (!params.testSuite) {
      history.push("/" + project + "/testcases?" + getQueryParams(f, selectedTestCaseRef.current, testSuite));
    }

    Backend.get(project + "/testcase/tree?" + getFilterApiRequestParams(f))
      .then(response => {
        setTestcasesTree(response);
        setLoading(false);
        getTotalNumberOfTestCases(f);
        updateCount(f);
        refreshTree(response, selectedTestCaseRef.current, f, tcSizesRef.current);
        if (callback) callback();
      })
      .catch(error => {
        setErrorMessage("Couldn't fetch testcases: " + error);
        setLoading(false);
      });
  }

  function onTestCaseAdded(testcase) {
    setTestcaseToEdit({ ...defaultTestcase, attributes: {}, steps: [] });
    onFilter(filterRef.current, () => {
      const tc = Utils.getTestCaseFromTree(testcase.id, testcasesTreeRef.current, (tc, id) => tc.id === id);
      setSelectedTestCase(tc || {});
      if (treeRef.current) {
        const node = treeRef.current.getNodeById(testcase.id);
        if (node) treeRef.current.select(node);
      }
    });
    $("#editTestcase").modal("hide");
  }

  function loadMoreTestCases(event) {
    const f = { ...filterRef.current, skip: (filterRef.current.skip || 0) + TC_FETCH_LIMIT, limit: TC_FETCH_LIMIT };
    Backend.get(project + "/testcase?" + getFilterApiRequestParams(f))
      .then(response => {
        setTestcasesTree(prev => ({ ...prev, testCases: (prev.testCases || []).concat(response) }));
      })
      .catch(error => setErrorMessage("Couldn't fetch testcases: " + error));
    event.preventDefault();
  }

  function showLoadMore() {
    if (((filterRef.current || {}).groups || []).length > 0 || !count) return false;
    return ((filterRef.current || {}).skip || 0) + TC_FETCH_LIMIT <= count;
  }

  function handleSubmit(testcase) {
    Backend.put(project + "/testcase/", testcase).catch(error => setErrorMessage("Couldn't save testcase: " + error));
  }

  function handleBulkAddAttributes(filterAttribs) {
    const Tcs = (testcasesTreeRef.current.testCases || []).map(tc => tc.id);
    const NotSelected = filterRef.current.notFields.id;
    const selectedTCS = Tcs.filter(id => !NotSelected.some(notId => notId === id));
    const newValidAttribs = filterAttribs.filter(id => !(id.id === null || id.id === "broken"));
    if (newValidAttribs.length === 0 || (newValidAttribs.length === 1 && newValidAttribs[0].attrValues.length === 0)) {
      setErrorMessage("Select an Attribute to Add");
      return;
    }
    setErrorMessage(" ");
    const selectedAttribIds = newValidAttribs.map(val => val.id);
    selectedTCS.forEach(item => {
      Backend.get(project + "/testcase/" + item)
        .then(response => {
          const testcase = response;
          const originalTC = JSON.parse(JSON.stringify(testcase));
          if (Object.keys(testcase.attributes).length === 0) {
            newValidAttribs.forEach(elem => {
              testcase.attributes[elem.id] = elem.attrValues.map(val => val.value);
            });
          } else {
            const toAdd = selectedAttribIds.filter(id => !Object.keys(testcase.attributes).includes(id));
            toAdd.forEach(elem => {
              const fo = newValidAttribs.find(val => val.id.includes(elem));
              if (fo) testcase.attributes[fo.id] = fo.attrValues.map(val => val.value);
            });
            Object.keys(testcase.attributes || {}).forEach(attributeId => {
              if (attributeId && attributeId != "null") {
                const attributeValues = testcase.attributes[attributeId] || [];
                newValidAttribs.forEach(elem => {
                  if (elem.id === attributeId) {
                    const selectedVals = elem.attrValues.map(v => v.value);
                    const toAddVals = selectedVals.filter(v => !attributeValues.includes(v));
                    testcase.attributes[attributeId] = attributeValues.concat(toAddVals);
                  }
                });
              }
            });
          }
          if (!equal(originalTC, testcase)) {
            handleSubmit(testcase);
          }
        })
        .catch(() => setErrorMessage("Couldn't fetch testcase"));
    });
    setErrorMessage("Added Attributes in selected Testcases");
    history.push("/" + project + "/testcases");
    return "OK";
  }

  function handleBulkRemoveAttributes(filterAttribs) {
    const Tcs = (testcasesTreeRef.current.testCases || []).map(tc => tc.id);
    const NotSelected = filterRef.current.notFields.id;
    const selectedTCS = Tcs.filter(id => !NotSelected.some(notId => notId === id));
    const newValidAttribs = filterAttribs.filter(id => !(id.id === null || id.id === "broken"));
    if (newValidAttribs.length === 0 || (newValidAttribs.length === 1 && newValidAttribs[0].attrValues.length === 0)) {
      setErrorMessage("Select an Attribute to Remove");
      return;
    }
    setErrorMessage(" ");
    selectedTCS.forEach(item => {
      Backend.get(project + "/testcase/" + item)
        .then(response => {
          const testcase = response;
          const originalTC = JSON.parse(JSON.stringify(testcase));
          if (Object.keys(testcase.attributes).length > 0) {
            Object.keys(testcase.attributes || {}).forEach(attributeId => {
              if (attributeId && attributeId != "null") {
                const attributeValues = testcase.attributes[attributeId] || [];
                newValidAttribs.forEach(elem => {
                  if (elem.id === attributeId) {
                    const selectedVals = elem.attrValues.map(v => v.value);
                    const remaining = attributeValues.filter(v => !selectedVals.includes(v));
                    if (remaining.length === 0) delete testcase.attributes[attributeId];
                    else testcase.attributes[attributeId] = remaining;
                  }
                });
              }
            });
          }
          if (!equal(originalTC, testcase)) {
            handleSubmit(testcase);
          }
        })
        .catch(() => setErrorMessage("Couldn't fetch testcase"));
    });
    setErrorMessage("Removed Attributes in selected Testcases");
    history.push("/" + project + "/testcases");
    return "OK";
  }

  function handleLockAllTestCases() {
    Backend.post(project + "/testcase/lockall")
      .then(() => setErrorMessage("Locked All Testcases"))
      .catch(() => setErrorMessage("Couldn't lock all testcases"));
    history.push("/" + project + "/testcases");
  }

  function handleUnLockAllTestCases() {
    Backend.post(project + "/testcase/unlockall")
      .then(() => setErrorMessage("Unlocked All Testcases"))
      .catch(() => setErrorMessage("Couldn't unlock all testcases"));
    history.push("/" + project + "/testcases");
  }

  return (
    <div>
      <ControlledPopup popupMessage={errorMessage} />
      <div>
        <TestCasesFilter
          projectAttributes={projectAttributes}
          onFilter={onFilter}
          notFields={filter.notFields}
          project={project}
          handleBulkAddAttributes={handleBulkAddAttributes}
          handleBulkRemoveAttributes={handleBulkRemoveAttributes}
          handleLockAllTestCases={handleLockAllTestCases}
          handleUnLockAllTestCases={handleUnLockAllTestCases}
        />
      </div>
      <div>
        <div
          className="modal fade"
          id="editTestcase"
          tabIndex="-1"
          role="dialog"
          aria-labelledby="editTestcaseLabel"
          aria-hidden="true"
        >
          <TestCaseForm
            project={project}
            testcase={testcaseToEdit}
            projectAttributes={projectAttributes}
            onTestCaseAdded={onTestCaseAdded}
          />
        </div>
      </div>
      <div className="row filter-control-row">
        <div className="col-6">
          Number of Test Cases : <span style={{ fontWeight: "bold" }}>{totalNoofTestCase}</span>
        </div>
      </div>
      <div className="sweet-loading">
        <FadeLoader size={100} color={"#135f38"} loading={loading} />
      </div>
      <div className="grid_container">
        <div className="tree-side">
          <div id="tree"></div>
          {showLoadMore() && (
            <div>
              <a href="" onClick={loadMoreTestCases}>
                Load more
              </a>
            </div>
          )}
        </div>
        <div id="testCase" className="testcase-side">
          {selectedTestCase && selectedTestCase.id && (
            <TestCase projectId={project} projectAttributes={projectAttributes} testcaseId={selectedTestCase.id} />
          )}
        </div>
      </div>
    </div>
  );
}

export default withRouter(TestCases);

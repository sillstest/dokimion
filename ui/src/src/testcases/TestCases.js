import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import SubComponent from "../common/SubComponent";
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
import "./TestCases.css";

require("gijgo/js/gijgo.min.js");
require("gijgo/css/gijgo.min.css");

const DEFAULT_TESTCASE = {
  id: null,
  name: "",
  description: "",
  steps: [],
  attributes: {},
};

const TESTCASES_FETCH_LIMIT = 50;

export default function TestCases() {
  const { project } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const treeRef = useRef(null);

  const [testcasesTree, setTestcasesTree] = useState({ children: [] });
  const [testcaseToEdit, setTestcaseToEdit] = useState(DEFAULT_TESTCASE);
  const [projectAttributes, setProjectAttributes] = useState([]);
  const [selectedTestCase, setSelectedTestCase] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [totalNoofTestCase, setTotalNoofTestCase] = useState(0);
  const [count, setCount] = useState(0);

  const [filter, setFilter] = useState({
    includedFields: "id,name,attributes,importedName,automated",
    notFields: { id: [] },
    filters: [],
    groups: [],
  });

  const [tcSizesFilter] = useState({
    skip: 0,
    limit: 20,
    orderby: "name",
    orderdir: "ASC",
    includedFields: "name,minLines,maxLines",
  });

  const [tcSizes, setTcSizes] = useState({});

  /* -------------------- helpers -------------------- */

  const getFilterApiRequestParams = useCallback((filter) => {
    const tokens = [];

    (filter.groups || []).forEach((g) => tokens.push(`groups=${g}`));

    (filter.filters || []).forEach((f) => {
      f.attrValues.forEach((v) => {
        if (f.id === "broken") {
          tokens.push(`${f.id}=${v.value}`);
        } else {
          tokens.push(`attributes.${f.id}=${v.value}`);
        }
      });
    });

    if (filter.skip) tokens.push(`skip=${filter.skip}`);
    if (filter.limit) tokens.push(`limit=${filter.limit}`);
    if (filter.fulltext) tokens.push(`fulltext=${filter.fulltext}`);

    return tokens.join("&");
  }, []);

  /* -------------------- data loading -------------------- */

  useEffect(() => {
    Backend.get("/testcasesizes/getalltcsizes?" + Utils.filterToQuery(tcSizesFilter))
      .then(setTcSizes)
      .catch(() => console.error("Error loading TC sizes"));
  }, [tcSizesFilter]);

  useEffect(() => {
    const params = qs.parse(location.search.substring(1));

    if (params.testcase) {
      setSelectedTestCase({ id: params.testcase });
    }

    Backend.get(`${project}/attribute`)
      .then((response) => {
        const attrs = response
          .filter(p => p.type !== "undefined" && p.type !== "LAUNCH")
          .sort((a, b) => (a.name || "").localeCompare(b.name));

        attrs.unshift({
          id: "broken",
          name: "Broken",
          values: ["True", "False"],
        });

        setProjectAttributes(attrs);
        onFilter(filter);
      })
      .catch(err =>
        setErrorMessage("Couldn't fetch attributes: " + err)
      );
  }, []);

  /* -------------------- filtering -------------------- */

  const onFilter = useCallback((newFilter, onResponse) => {
    const f = { ...newFilter };

    if (!f.groups || f.groups.length === 0) {
      f.skip = f.skip || 0;
      f.limit = TESTCASES_FETCH_LIMIT;
    }

    setLoading(true);
    setFilter(f);

    Backend.get(`${project}/testcase/tree?${getFilterApiRequestParams(f)}`)
      .then((response) => {
        setTestcasesTree(response);
        setLoading(false);
        refreshTree(response, f);
        getTotalNumberOfTestCases(f);
        if (onResponse) onResponse();
      })
      .catch(err => {
        setErrorMessage("Couldn't fetch testcases: " + err);
        setLoading(false);
      });

    navigate(`/${project}/testcases`);
  }, []);

  const getTotalNumberOfTestCases = (f) => {
    Backend.get(`${project}/testcase/count?${getFilterApiRequestParams(f)}`)
      .then(setTotalNoofTestCase)
      .catch(err =>
        setErrorMessage("Couldn't fetch testcase count: " + err)
      );
  };

  /* -------------------- tree -------------------- */

  const refreshTree = (treeData = testcasesTree, f = filter) => {
    if (treeRef.current) {
      treeRef.current.destroy();
    }

    treeRef.current = $("#tree").tree({
      primaryKey: "id",
      uiLibrary: "bootstrap4",
      checkboxes: true,
      checkedField: "checked",
      dataSource: Utils.parseTree(
        treeData,
        f.notFields?.id || [],
        tcSizes
      ),
    });

    treeRef.current.on("select", (_, __, id) => {
      setSelectedTestCase({ id });
      navigate(`/${project}/testcases`);
    });
  };

  /* -------------------- render -------------------- */

  return (
    <div>
      <ControlledPopup popupMessage={errorMessage} />

      <TestCasesFilter
        projectAttributes={projectAttributes}
        onFilter={onFilter}
        project={project}
      />

      <div className="row filter-control-row">
        <div className="col-6">
          Number of Test Cases:
          <strong> {totalNoofTestCase}</strong>
        </div>
      </div>

      <FadeLoader loading={loading} />

      <div className="grid_container">
        <div className="tree-side">
          <div id="tree" />
        </div>

        <div className="testcase-side">
          {selectedTestCase?.id && (
            <TestCase
              projectId={project}
              projectAttributes={projectAttributes}
              testcaseId={selectedTestCase.id}
            />
          )}
        </div>
      </div>
    </div>
  );
}


import React, { useEffect, useRef, useState } from "react";
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
  var tree = null;

  const [testcasesTree, setTestcasesTree] = useState({ children: [] });
  const [testcaseToEdit, setTestcaseToEdit] = useState(DEFAULT_TESTCASE);
  const [testcases, setTestcases] = useState(DEFAULT_TESTCASE);
  const [testSuite, setTestSuite] = useState();
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

  const getFilterApiRequestParams = (filter) => {
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
  };

  /* -------------------- data loading -------------------- */

  useEffect(() => {
    Backend.get("/testcasesizes/getalltcsizes?" + Utils.filterToQuery(tcSizesFilter))
      .then(setTcSizes)
      .catch(() => console.error("Error loading TC sizes"));
  }, [tcSizesFilter]);

  useEffect(() => {
    refreshTree();
  }, [testcasesTree]);

  useEffect(() => {
    const params = qs.parse(location.search.substring(1));

    if (params.testcase) {
      setSelectedTestCase({ id: params.testcase });
    }

    Backend.get(`${project}/attribute`)
      .then((response) => {
        var attrs = response.
           filter(function(p) { return p.type != 'undefined'}).
           filter(function(p) { return p.type != 'LAUNCH'});

        attrs = attrs.sort((a, b) => (a.name || "").localeCompare(b.name));

        attrs.unshift({
          id: "broken",
          name: "Broken",
          values: ["True", "False"],
        });

        setProjectAttributes(attrs);
      })
      .catch(err =>
        setErrorMessage("Couldn't fetch attributes: " + err)
      );
  }, []);

  /* -------------------- filtering -------------------- */

  const onFilter = (filterArg, onResponse) => {
    var params = qs.parse(location.search.substring(1));
    if (params.testcase) {
      setSelectedTestCase({ id: params.testcase });
    }

    var f = filterArg;
    if (!f.groups || f.groups.length === 0) {
      f.skip = f.skip || 0;
      f.limit = TESTCASES_FETCH_LIMIT;
    }

    f.includedFields = f.includedFields || [];
    f.includedFields.push("name");
    f.includedFields.push("id");
    f.includedFields.push("attributes");

    f.notFields = f.notFields || {};
    f.notFields.id = f.notFields.id || [];

    setLoading(true);
    setFilter(f);

    Backend.get(`${project}/testcase/tree?${getFilterApiRequestParams(f)}`)
      .then((response) => {
	setTotalNoofTestCase(response.count);
        setTestcasesTree(response);
        setLoading(false);
        getTotalNumberOfTestCases();
        if (onResponse) {
	   onResponse();
	}
	updateCount();
      })
      .catch(err => {
        setErrorMessage("Couldn't fetch testcases: " + err);
        setLoading(false);
      });

    navigate(`/${project}/testcases`);
  };

  const getTotalNumberOfTestCases = () => {

    var newFilter = filter;
    delete newFilter.skip;
    delete newFilter.limit;
    setFilter(newFilter);
    
    Backend.get(`${project}/testcase/count?${getFilterApiRequestParams(filter)}`)
      .then(response => {
	setTotalNoofTestCase(response);
      })
      .catch(err =>
        setErrorMessage("Couldn't fetch testcase count: " + err)
      );
  };

  const editTestcase = (testcaseId) => {
    var tcs = testcases.find(function (testcase) {
        return testcaseId === testcase.id;
      }) || {};
    setTestcaseToEdit(tcs);

    $("#editTestcase").modal("toggle");
  }

  const onTestCaseAdded = (testcase) => {
    var tc = Object.assign({}, DEFAULT_TESTCASE, { attributes: {}, steps: [] });
    onFilter(
      filter,
      function () {
        onTestcaseSelected(testcase.id);
      }.bind(this),
    );
    setTestcaseToEdit(tc);

    $("#editTestcase").modal("hide");
  }

  const onTestcaseSelected = (id) => {
    var stc = Utils.getTestCaseFromTree(id, testcasesTree, function (testCase, id) {
      return testCase.id === id;
    });
    navigate(
      "/" + project + "/testcases?" + getQueryParams(filter),
    );
    setSelectedTestCase(stc);
  }

  const getQueryParams = (filter) => {
    var testcaseIdAttr = "";
    if (selectedTestCase && selectedTestCase.id) {
      testcaseIdAttr = "testcase=" + selectedTestCase.id;
    }
    var urlParts = [getFilterQParams(filter), getGroupingQParams(filter), testcaseIdAttr, getFulltextQParams(filter)];
    if (testSuite) {
      urlParts.push("testSuite=" + testSuite.id);
    }
    return urlParts
      .filter(function (val) {
        return val !== "";
      })
      .join("&");
  }

  const getFulltextQParams = (filter) => {
    if (!filter.fulltext || filter.fulltext == "") return "";
    return "fulltext=" + filter.fulltext;
  }

  const getFilterQParams = (filter) => {
    var activeFilters =
      filter.filters.filter(function (filter) {
        return filter.id;
      }) || [];
    var attributesPairs = [];
    activeFilters.forEach(function (filter) {
      var tokens = filter.attrValues.map(function (attrValue) {
        return "attribute=" + filter.id + ":" + attrValue.value;
      });
      attributesPairs = attributesPairs.concat(tokens);
    });

    return attributesPairs.join("&") || "";
  }

  const getGroupingQParams = (filter) => {
    return (
      filter.groups
        .map(function (group) {
          return "groups=" + group;
        })
        .join("&") || ""
    );
  }
  /* -------------------- tree -------------------- */

  const refreshTree = () => {

    if (testcasesTree.count === undefined)
       return;

    if (tree) {
      tree.destroy();
    }

    tree = $("#tree").tree({
      primaryKey: "id",
      uiLibrary: "bootstrap4",
      checkboxes: true,
      checkedField: "checked",
      dataSource: Utils.parseTree(
        testcasesTree,
        filter.notFields?.id || [],
        tcSizes
      ),
    });

    tree.on(
      "select",
      function (e, node, id) {
        onTestcaseSelected(id);
      }.bind(this),
    );
    tree.on(
      "checkboxChange",
      function (e, $node, record, state) {
        if (state === "indeterminate") return;
        processElementChecked(record, state === "checked");
      }.bind(this),
    );
    if (!(selectedTestCase === undefined) &&
         (!(selectedTestCase.id === undefined)) &&
         (selectedTestCase.id)) {
      var node = tree.getNodeById(selectedTestCase.id);
      if (!node) return;
      tree.select(node);
      var f = filter.groups.forEach(
        function (groupId) {
          var attributes =
            Utils.getTestCaseFromTree(
              selectedTestCase.id,
              testcasesTree,
              function (testCase, id) {
                return testCase.id === id;
              },
            ).attributes || {};
          var values = attributes[groupId] || ["None"];
          values.forEach(
            function (value) {
              var node = tree.getNodeById(groupId + ":" + value);
              tree.expand(node);
            }.bind(this),
          );
        }.bind(this),
      );
    }
  }

  const loadMoreTestCases = (event) => {
    filter.skip = (filter.skip || 0) + TESTCASES_FETCH_LIMIT;
    //Added for Issue 28
    filter.limit = TESTCASES_FETCH_LIMIT;
    Backend.get(project + "/testcase?" + getFilterApiRequestParams(filter))
    .then(response => {
        if (response) {
          testcasesTree.testCases = testcasesTree.testCases.concat(response);
        } else {
          filter.skip = (filter.skip || 0) - TESTCASES_FETCH_LIMIT;
        }
      })
      .catch(error => {
        setErrorMessage("loadMoreTestCases::Couldn't fetch testcases: " + error);
      });
    event.preventDefault();
  }

  const showLoadMore = () => {
    if  ((((filter || {}).groups || []).length > 0) || !count) {
      return false;
    }
    return ((filter || {}).skip || 0) + TESTCASES_FETCH_LIMIT <= count;
  }

  const updateCount = () => {
    Backend.get(
      project + "/testcase/count?" + getFilterApiRequestParams(filter),
    )
    .then(response => {
      setCount(response);
    })
    .catch(error => {
      setErrorMessage("updateCount::Couldn't fetch testcases number: " + error);
    });
  }

  const processElementChecked = (element, isChecked) => {
    if (element.isLeaf) {
      if (isChecked) {
        filter.notFields.id = filter.notFields.id.filter(e => e !== element.id);
      } else if (!filter.notFields.id.includes(element.id)) {
        filter.notFields.id.push(element.id);
      }
    }
    (element.children || []).forEach(e => this.processElementChecked(e, isChecked));
  }

  const handleBulkAddAttributes = (filterAttribs) => {
    let projectId = project;
    let Tcs = testcasesTree.testCases.map(tc => tc.id);
    let NotSelected = filter.notFields.id;

    let selectedTCS = Tcs.filter(id => !NotSelected.some(notId => notId===id));
    //Remove broken and empty object
    let newValidAttribs =   filterAttribs.filter(id => !((id.id === null) || (id.id==='broken')));
    //Array of all selected ids
    var selectedAttribIds = newValidAttribs.map( val => val.id);
    console.log("Filter Attribs : " + JSON.stringify(newValidAttribs));
    if(newValidAttribs.length === 0  && Object.keys(newValidAttribs).length === 0)
      {
        setErrorMessage("handleBulkAddAttributes::Select an Attribute to Add");
        return;
      }else if(newValidAttribs.length === 1 && newValidAttribs[0].attrValues.length === 0 ){
        console.log ("On initial realod : " + JSON.stringify(newValidAttribs));
        setErrorMessage("handleBulkAddAttributes::Select an Attribute to Add");
        return;
      }
      else{
        setErrorMessage(" ");
      }

    selectedTCS.forEach((item, index, temp)=>{
      Backend.get(projectId + "/testcase/" + item)
      .then(response => {
        const testcase = response;
        const originalTC = JSON.parse(JSON.stringify(testcase));

          //No Attribs
        if(Object.keys(testcase.attributes).length === 0){
            //add the attribs to testcase
            var attributeValues =[];
            newValidAttribs.forEach((elem, index) =>{
            var selectedAttribValues = elem.attrValues.map( val => val.value);
            testcase.attributes[elem.id] = attributeValues.concat(selectedAttribValues);
    //        console.log("Updated Attribuyes " + JSON.stringify(testcase.attributes));
          })
        }else{
            //Check if the selectedID is present not in TC Attributes
            var attributetobeaddedAdditionally = selectedAttribIds.filter((id)=> !Object.keys(testcase.attributes).includes(id));
            //console.log("TO BE Added : " + attributetobeaddedAdditionally + " length " + Object.keys(attributetobeaddedAdditionally).length);
            if(attributetobeaddedAdditionally.length>0){
              var attributeValues =[];
              attributetobeaddedAdditionally.forEach((elem, index) =>{
                if(elem!==null&& elem!==undefined){
                  var filterObject = newValidAttribs.find((val)=> val.id.includes(elem));
                  var selectedAttribValues = filterObject.attrValues.map( val => val.value);
                  testcase.attributes[filterObject.id] = attributeValues.concat(selectedAttribValues);
  //                console.log("New Attribs added" + JSON.stringify(testcase.attributes));
                }
            })}

              //Only if TC has exisitng attributes
              Object.keys(testcase.attributes || {}).map(
                function (attributeId, i) {
                  if (attributeId && attributeId != "null") {
                  var attributeValues = testcase.attributes[attributeId] || [];
                //  console.log("Attrib ID " + attributeId + " AttribValues " + attributeValues);
                  var valueAttribTobeAdded =[];
                  newValidAttribs.forEach((elem, index) =>{
                    var selectedAttribValues = elem.attrValues.map( val => val.value);
                if(elem.id === attributeId){

                    valueAttribTobeAdded = selectedAttribValues.filter(val => !attributeValues.includes(val));
                    testcase.attributes[attributeId] = attributeValues.concat(valueAttribTobeAdded) ;
                }

              })
              }
            }.bind(this));
           }//closing else
          //  console.log("Original TC :" + JSON.stringify(originalTC));
          //  console.log(" TC :" + JSON.stringify(testcase));
           if(!equal(originalTC, testcase)){
            console.log("Testcase Modified need to update : " + testcase.id);
            handleSubmit(testcase);
           }else{
            console.log("Testcase Not modified : " + testcase.id);
           }

          }).catch(error => {
              this.setState({errorMessage: "handleBulkAddAttributes::Couldn't fetch testcase"});

      })})

    setErrorMessage("handleBulkAddAttributes::Added Attributes in selected Tescases");
    navigate( "/" + project +"/testcases"
   );

   return "OK";
  }

  const handleBulkRemoveAttributes = (filterAttribs) => {
    //console.log("Entered here in handleBulkRemoveAttributes" + JSON.stringify(filterAttribs));

    let projectId = project;
    let Tcs = testcasesTree.testCases.map(tc => tc.id);
    let NotSelected = filter.notFields.id;
    let selectedTCS = Tcs.filter(id => !NotSelected.some(notId => notId===id));
    let newValidAttribs =    filterAttribs.filter(id => !((id.id === null) || (id.id==='broken')));

    if(newValidAttribs.length === 0  && Object.keys(newValidAttribs).length === 0)
    {
      setErrorMessage("handleBulkRemoveAttributes::Select an Attribute to Remove");
      return;
    }else if(newValidAttribs.length === 1 && newValidAttribs[0].attrValues.length === 0 ){
      console.log ("On initial realod : " + JSON.stringify(newValidAttribs));
      setErrorMessage("handleBulkRemoveAttributes::Select an Attribute to Remove");
      return;
    }
    else{
      setErrorMessage(" ");
    }

    selectedTCS.forEach((item, index, temp)=>{

      Backend.get(projectId + "/testcase/" + item)
      .then(response => {
      //  console.log("TC from DB" + JSON.stringify(response));
        const testcase = response;
        const originalTC = JSON.parse(JSON.stringify(testcase));
          //No Attribs
          if(Object.keys(testcase.attributes).length === 0){
            //If the attributes are empty nothing left to delete
            console.log("Selected attribute not present in TC " + testcase.id);
        }else{
              //Only if TC has exisitng attributes
              Object.keys(testcase.attributes || {}).map(
                function (attributeId, i) {
                  if (attributeId && attributeId != "null") {
                  var attributeValues = testcase.attributes[attributeId] || [];
                  var valueAttribTobeAdded =[];
                  newValidAttribs.forEach((elem, index) =>{
                    if(elem.id === attributeId){
                      var selectedAttribValues = elem.attrValues.map( val => val.value);

                      valueAttribTobeAdded = attributeValues.filter(val => !selectedAttribValues.includes(val));
                      if(valueAttribTobeAdded.length===0){
      //                console.log("Deleted empty attributes with Key" + attributeId);
                        delete testcase.attributes[attributeId];
                      }else{
                        testcase.attributes[attributeId] = valueAttribTobeAdded ;
                      }
                }})
              }
            }.bind(this));
           }//closing else
           if(!equal(originalTC, testcase)){
            console.log("Testcase Modified need to update : " + testcase.id);
            handleSubmit(testcase);
           }else{
            console.log("Testcase Not modified : " + testcase.id);
           }
          }).catch(error => {
              setErrorMessage("handleBulkRemoveAttributes::Couldn't fetch testcase");
      })})


    setErrorMessage("handleBulkRemoveAttributes::Removed Attributes in selected Tescases");
    navigate("/" + project +"/testcases");
    return "OK";
  }

  //Added for Issue 84
  const handleLockAllTestCases = () => {
    console.log("Entered here in the handleLockAllTestcases in Testcases.js");
    Backend.post( this.props.match.params.project +"/testcase/lockall")
    .then(response => {
      console.log("Locked all testcases : " + JSON.stringify(response));
      // if(response.status === 200 ){
      setErrorMessage("handleLockAllTestCases::Locked All Testcases");
      // }
    })
    .catch(error => {
      setErrorMessage("handleLockAllTestCases::Couldn't lock all testcases");
    });
    navigate("/" + project +"/testcases");
  }

  const handleUnLockAllTestCases = () => {
    console.log("Entered here in the handleUnLockAllTestcases in Testcases.js");
    Backend.post( project +"/testcase/unlockall")
    .then(response => {
      console.log("UnLocked all testcases : " + JSON.stringify(response));
      // if(response.status === 200 ){
      setErrorMessage("handleUnLockAllTestCases::Unlocked All Testcases");
      // }
    })
    .catch(error => {
      setErrorMessage("handleUnLockAllTestCases::Couldn't unlock all testcases");
    });
    navigate("/" + project +"/testcases");

  }
  
  const handleGetTCSizes = () => {

    Backend.get("/testcasesizes/getalltcsizes?" + Utils.filterToQuery(tcSizesFilter))
    .then(response => {
      tcSizes = response;
    })
    .catch(() => {
      console.log("Error in handleGetTCsizes");
    });

  }

  const handleSubmit = (testcase) => {

    Backend.put(project + "/testcase/", testcase)
    .then(response => {
      testcase = response;
      console.log("After DB update : " + JSON.stringify(testcase));
    })
    .catch(error => {
      setErrorMessage("handleSubmit::Couldn't save testcase: " + error);
    });

  }

  /* -------------------- render -------------------- */

  return (
    <div>
      <ControlledPopup popupMessage={errorMessage} />

      <TestCasesFilter
        projectAttributes={projectAttributes}
        onFilter={onFilter}
        project={project}
        handleBulkAddAttributes={handleBulkAddAttributes}
        handleBulkRemoveAttributes={handleBulkRemoveAttributes}
        handleLockAllTestCases={handleLockAllTestCases}
        handleUnLockAllTestCases={handleUnLockAllTestCases}
      />

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
          Number of Test Cases : <span style={{fontWeight : 'bold'}}>{totalNoofTestCase}</span>
        </div>
      </div>
      <div className="sweet-loading">
          <FadeLoader sizeUnit={"px"} size={100} color={"#135f38"} loading={loading} />
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


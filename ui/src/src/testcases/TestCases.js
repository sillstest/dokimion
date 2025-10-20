import React from "react";
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

var jQuery = require("jquery");
window.jQuery = jQuery;
window.jQuery = $;
window.$ = $;
global.jQuery = $;

require("gijgo/js/gijgo.min.js");
require("gijgo/css/gijgo.min.css");

class TestCases extends SubComponent {
  defaultTestcase = {
    id: null,
    name: "",
    description: "",
    steps: [],
    attributes: {},
  };

  testCasesFetchLimit = 50;

  state = {
    testcasesTree: { children: [] },
    testcaseToEdit: Object.assign({}, this.defaultTestcase, { attributes: {}, steps: [] }),
    projectAttributes: [],
    selectedTestCase: {},
    filter: {
      includedFields: "id,name,attributes,importedName,automated",
      notFields: { id: [] },
    },
    loading: true,
    showCasesSelectCheckboxes: false,
    errorMessage: "",
    tcSizesFilter: {
      skip: 0,
      limit: 20,
      orderby: "name",
      orderdir: "ASC",
      includedFields: "name,minLines,maxLines",
    },
    tcSizes: {},
    totalNoofTestCase: 0,
  };

  constructor(props) {
    super(props);
    this.onFilter = this.onFilter.bind(this);
    this.refreshTree = this.refreshTree.bind(this);
    this.getQueryParams = this.getQueryParams.bind(this);
    this.getFilterQParams = this.getFilterQParams.bind(this);
    this.getGroupingQParams = this.getGroupingQParams.bind(this);
    this.onTestcaseSelected = this.onTestcaseSelected.bind(this);
    this.onTestCaseAdded = this.onTestCaseAdded.bind(this);
    this.loadMoreTestCases = this.loadMoreTestCases.bind(this);
    this.showLoadMore = this.showLoadMore.bind(this);
    this.updateCount = this.updateCount.bind(this);
    this.processElementChecked = this.processElementChecked.bind(this);
    this.handleBulkAddAttributes=this.handleBulkAddAttributes.bind(this);
    this.handleBulkRemoveAttributes=this.handleBulkRemoveAttributes.bind(this);
    this.handleGetTCSizes = this.handleGetTCSizes.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.getTotalNumberOfTestCases = this.getTotalNumberOfTestCases.bind(this);
    this.handleLockAllTestCases = this.handleLockAllTestCases.bind(this);
    this.handleUnLockAllTestCases=this.handleUnLockAllTestCases.bind(this);
  }

  //Get the count of all testcases from DB without any limit Issue 28
  getTotalNumberOfTestCases(){
    delete this.state.filter.skip
    delete this.state.filter.limit
    Backend.get(
      this.props.match.params.project + "/testcase/count?" + this.getFilterApiRequestParams(this.state.filter),
      ).then(response => {
        //Added for Issue 28
        this.state.totalNoofTestCase = response;
        this.setState(this.state);
      })
      .catch(error => {
        this.setState({errorMessage: "getTotalNumberOfTestCases::Couldn't fetch testcases number, error: " + error});
      });
    this.handleLockAllTestCases = this.handleLockAllTestCases.bind(this);
  }

  handleGetTCSizes() {

    Backend.get("/testcasesizes/getalltcsizes?" + Utils.filterToQuery(this.state.tcSizesFilter))
      .then(response => {
        this.state.tcSizes = response;
        this.setState(this.state);
      })
      .catch(() => {
        console.log("Error in handleGetTCsizes");
      });

  }

  UNSAFE_componentWillMount() {
    this.handleGetTCSizes();
  }

  componentDidMount() {
    super.componentDidMount();
    var params = qs.parse(this.props.location.search.substring(1));
    if (params.testcase) {
      this.state.selectedTestCase = { id: params.testcase };
      this.setState(this.state);
    }
    if (params.testSuite) {
      this.state.testSuite = {
        id: params.testSuite,
      };
      this.setState(this.state);
    }

    Backend.get(this.props.match.params.project + "/attribute")
      .then(response => {
        this.state.projectAttributes = response.
           filter(function(p) { return p.type != 'undefined'}).
           filter(function(p) { return p.type != 'LAUNCH'});
        this.state.projectAttributes = this.state.projectAttributes.sort((a, b) => (a.name || "").localeCompare(b.name));
        this.state.projectAttributes.unshift({
          id: "broken",
          name: "Broken",
          values: ["True", "False"],
        });
        this.setState(this.state);
        this.refreshTree();
      })
      .catch(error => {
        this.setState({errorMessage: "componentDidMount::Couldn't fetch attributes, error: " + error});
      });
  }

  editTestcase(testcaseId) {
    this.state.testcaseToEdit =
      this.state.testcases.find(function (testcase) {
        return testcaseId === testcase.id;
      }) || {};
    this.setState(this.state);
    $("#editTestcase").modal("toggle");
  }

  onTestCaseAdded(testcase) {
    this.state.testcaseToEdit = Object.assign({}, this.defaultTestcase, { attributes: {}, steps: [] });
    this.onFilter(
      this.state.filter,
      function () {
        this.onTestcaseSelected(testcase.id);
        this.refreshTree();
      }.bind(this),
    );
    $("#editTestcase").modal("hide");
  }

  onFilter(filter, onResponse) {
    var params = qs.parse(this.props.location.search.substring(1));
    if (params.testcase) {
      this.state.selectedTestCase = { id: params.testcase };
    }

    if (!filter.groups || filter.groups.length == 0 ) {
      filter.skip = filter.skip || 0;
      filter.limit = this.testCasesFetchLimit;
    }
    filter.includedFields = filter.includedFields || [];
    filter.includedFields.push("name");
    filter.includedFields.push("id");
    filter.includedFields.push("attributes");

    filter.notFields = filter.notFields || {};
    filter.notFields.id = filter.notFields.id || [];

    this.state.filter = filter;
    this.state.loading = true;
    this.setState(this.state);
    
    Backend.get(this.props.match.params.project + "/testcase/tree?" + this.getFilterApiRequestParams(filter))
      .then(response => {
        this.state.totolNoofTestCase = response.count;
        this.state.testcasesTree = response;
        this.state.loading = false;
        this.setState(this.state);
        //Added to reflect Total TC Issue 28
        this.getTotalNumberOfTestCases();
        this.refreshTree();
        if (onResponse) {
          onResponse();
        }
        this.updateCount();
      })
      .catch(error => {
        this.setState({errorMessage: "onFilter::Couldn't fetch testcases tree: " + error});
        this.state.loading = false;
        this.setState(this.state);
      });
    if (!params.testSuite) {
      this.props.history.push("/" + this.props.match.params.project + "/testcases?" + this.getQueryParams(filter));
    }
  }

  updateCount() {
    Backend.get(
      this.props.match.params.project + "/testcase/count?" + this.getFilterApiRequestParams(this.state.filter),
    )
      .then(response => {
        this.state.count = response;
        this.setState(this.state);
      })
      .catch(error => {
        this.setState({errorMessage: "updateCount::Couldn't fetch testcases number: " + error});
      });
  }

  loadMoreTestCases(event) {
    this.state.filter.skip = (this.state.filter.skip || 0) + this.testCasesFetchLimit;
    //Added for Issue 28
    this.state.filter.limit = this.testCasesFetchLimit;
    Backend.get(this.props.match.params.project + "/testcase?" + this.getFilterApiRequestParams(this.state.filter))
      .then(response => {
        if (response) {
          this.state.testcasesTree.testCases = this.state.testcasesTree.testCases.concat(response);
          this.setState(this.state);
          this.refreshTree();
        } else {
          this.state.filter.skip = (this.state.filter.skip || 0) - this.testCasesFetchLimit;
          this.setState(this.state);
        }
      })
      .catch(error => {
        this.setState({errorMessage: "loadMoreTestCases::Couldn't fetch testcases: " + error});
      });
    event.preventDefault();
  }

  getFilterApiRequestParams(filter) {
    var tokens = (filter.groups || []).map(function (group) {
      return "groups=" + group;
    });
    filter.filters.forEach(function (filter) {
      filter.attrValues.forEach(function (attrValue) {
        if (filter.id == "broken" && attrValue.value && attrValue.value != "") {
          tokens.push(filter.id + "=" + attrValue.value);
        } else {
          tokens.push("attributes." + filter.id + "=" + attrValue.value);
        }
      });
    });

    if ((filter.groups || []).length > 0) {
      filter.skip = 0;
      filter.limit = 0;
    }
    if (filter.skip) {
      tokens.push("skip=" + filter.skip);
    }
    if (filter.limit) {
      tokens.push("limit=" + filter.limit);
    }
    if (filter.fulltext && filter.fulltext != ""){
        tokens.push("fulltext=" + filter.fulltext);
    }
    return tokens.join("&");
  }

  onTestcaseSelected(id) {
    this.state.selectedTestCase = Utils.getTestCaseFromTree(id, this.state.testcasesTree, function (testCase, id) {
      return testCase.id === id;
    });
    this.props.history.push(
      "/" + this.props.match.params.project + "/testcases?" + this.getQueryParams(this.state.filter),
    );
    this.setState(this.state);
  }

  refreshTree() {
    if (this.tree) {
      this.tree.destroy();
    }

    this.tree = $("#tree").tree({
      primaryKey: "id",
      uiLibrary: "bootstrap4",
      checkboxes: true,
      checkedField: "checked",
      dataSource: Utils.parseTree(this.state.testcasesTree, this.state.filter.notFields.id, this.state.tcSizes),
    });
    this.tree.on(
      "select",
      function (e, node, id) {
        this.onTestcaseSelected(id);
      }.bind(this),
    );
    this.tree.on(
      "checkboxChange",
      function (e, $node, record, state) {
        if (state === "indeterminate") return;
        this.processElementChecked(record, state === "checked");
        this.setState(this.state);
      }.bind(this),
    );
    if (!(this.state.selectedTestCase === undefined) &&
         (!(this.state.selectedTestCase.id === undefined)) &&
         (this.state.selectedTestCase.id)) {
      var node = this.tree.getNodeById(this.state.selectedTestCase.id);
      if (!node) return;
      this.tree.select(node);
      this.state.filter.groups.forEach(
        function (groupId) {
          var attributes =
            Utils.getTestCaseFromTree(
              this.state.selectedTestCase.id,
              this.state.testcasesTree,
              function (testCase, id) {
                return testCase.id === id;
              },
            ).attributes || {};
          var values = attributes[groupId] || ["None"];
          values.forEach(
            function (value) {
              var node = this.tree.getNodeById(groupId + ":" + value);
              this.tree.expand(node);
            }.bind(this),
          );
        }.bind(this),
      );
    }
  }

  processElementChecked(element, isChecked) {
    if (element.isLeaf) {
      if (isChecked) {
        this.state.filter.notFields.id = this.state.filter.notFields.id.filter(e => e !== element.id);
      } else if (!this.state.filter.notFields.id.includes(element.id)) {
        this.state.filter.notFields.id.push(element.id);
      }
    }
    (element.children || []).forEach(e => this.processElementChecked(e, isChecked));
  }

  getQueryParams(filter) {
    var testcaseIdAttr = "";
    if (this.state.selectedTestCase && this.state.selectedTestCase.id) {
      testcaseIdAttr = "testcase=" + this.state.selectedTestCase.id;
    }
    var urlParts = [this.getFilterQParams(filter), this.getGroupingQParams(filter), testcaseIdAttr, this.getFulltextQParams(filter)];
    if (this.state.testSuite) {
      urlParts.push("testSuite=" + this.state.testSuite.id);
    }
    return urlParts
      .filter(function (val) {
        return val !== "";
      })
      .join("&");
  }

  getFulltextQParams(filter){
    if (!filter.fulltext || filter.fulltext == "") return "";
    return "fulltext=" + filter.fulltext;
  }

  getFilterQParams(filter) {
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

  getGroupingQParams(filter) {
    return (
      filter.groups
        .map(function (group) {
          return "groups=" + group;
        })
        .join("&") || ""
    );
  }

  showLoadMore() {
    if (((this.state.filter || {}).groups || []).length > 0 || !this.state.count) {
      return false;
    }
    return ((this.state.filter || {}).skip || 0) + this.testCasesFetchLimit <= this.state.count;
  }

  handleSubmit(testcase) {

    Backend.put(this.props.match.params.project + "/testcase/", testcase)
      .then(response => {
        testcase = response;
        console.log("After DB update : " + JSON.stringify(testcase));
      })
      .catch(error => {
        this.setState({errorMessage: "handleSubmit::Couldn't save testcase: " + error});
      });
    
  }
  
  handleBulkAddAttributes(filterAttribs){
    let projectId = this.props.match.params.project;
    let Tcs = this.state.testcasesTree.testCases.map(tc => tc.id);
    let NotSelected = this.state.filter.notFields.id;
  
    let selectedTCS = Tcs.filter(id => !NotSelected.some(notId => notId===id));
    //Remove broken and empty object
    let newValidAttribs =   filterAttribs.filter(id => !((id.id === null) || (id.id==='broken')));
    //Array of all selected ids
    var selectedAttribIds = newValidAttribs.map( val => val.id);
    console.log("Filter Attribs : " + JSON.stringify(newValidAttribs));
    if(newValidAttribs.length === 0  && Object.keys(newValidAttribs).length === 0)
      {
        this.setState({errorMessage: "handleBulkAddAttributes::Select an Attribute to Add" });
        return;
      }else if(newValidAttribs.length === 1 && newValidAttribs[0].attrValues.length === 0 ){
        console.log ("On initial realod : " + JSON.stringify(newValidAttribs));
        this.setState({errorMessage: "handleBulkAddAttributes::Select an Attribute to Add" });
        return;
      }
      else{
        this.setState({errorMessage: " " });
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
            this.handleSubmit(testcase);
            this.refreshTree();
           }else{
            console.log("Testcase Not modified : " + testcase.id);
           }
         
          }).catch(error => {
              this.setState({errorMessage: "handleBulkAddAttributes::Couldn't fetch testcase"});
              
      })})
     
    this.setState({errorMessage: "handleBulkAddAttributes::Added Attributes in selected Tescases"});
    this.props.history.push(
      "/" + this.props.match.params.project +"/testcases"
   );
  
   return "OK";
  }
  
  
  handleBulkRemoveAttributes(filterAttribs){
    //console.log("Entered here in handleBulkRemoveAttributes" + JSON.stringify(filterAttribs));
  
    let projectId = this.props.match.params.project;
    let Tcs = this.state.testcasesTree.testCases.map(tc => tc.id);
    let NotSelected = this.state.filter.notFields.id;
    let selectedTCS = Tcs.filter(id => !NotSelected.some(notId => notId===id));
    let newValidAttribs =    filterAttribs.filter(id => !((id.id === null) || (id.id==='broken')));
  
    if(newValidAttribs.length === 0  && Object.keys(newValidAttribs).length === 0)
    {
      this.setState({errorMessage: "handleBulkRemoveAttributes::Select an Attribute to Remove" });
      return;
    }else if(newValidAttribs.length === 1 && newValidAttribs[0].attrValues.length === 0 ){
      console.log ("On initial realod : " + JSON.stringify(newValidAttribs));
      this.setState({errorMessage: "handleBulkRemoveAttributes::Select an Attribute to Remove" });
      return;
    }
    else{
      this.setState({errorMessage: " " });
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
            this.handleSubmit(testcase);
            this.refreshTree();
           }else{
            console.log("Testcase Not modified : " + testcase.id);
           }
          }).catch(error => {
              this.setState({errorMessage: "handleBulkRemoveAttributes::Couldn't fetch testcase"});
      })})
  
    
    this.setState({errorMessage: "handleBulkRemoveAttributes::Removed Attributes in selected Tescases"});
    this.props.history.push(
      "/" + this.props.match.params.project +"/testcases"
    );
    return "OK";
  }

//Added for Issue 84
handleLockAllTestCases(){
  console.log("Entered here in the handleLockAllTestcases in Testcases.js");
  Backend.post( this.props.match.params.project +"/testcase/lockall")
  .then(response => {
    console.log("Locked all testcases : " + JSON.stringify(response));
    // if(response.status === 200 ){
      this.setState({errorMessage:"handleLockAllTestCases::Locked All Testcases"});
    // }
  })
  .catch(error => {
    this.setState({errorMessage: "handleLockAllTestCases::Couldn't lock all testcases"});
  });
  this.props.history.push(
    "/" + this.props.match.params.project +"/testcases"
  );
}

handleUnLockAllTestCases(){
  console.log("Entered here in the handleUnLockAllTestcases in Testcases.js");
  Backend.post( this.props.match.params.project +"/testcase/unlockall")
  .then(response => {
    console.log("UnLocked all testcases : " + JSON.stringify(response));
    // if(response.status === 200 ){
      this.setState({errorMessage:"handleUnLockAllTestCases::Unlocked All Testcases"});
    // }
  })
  .catch(error => {
    this.setState({errorMessage: "handleUnLockAllTestCases::Couldn't unlock all testcases"});
  });
  this.props.history.push(
    "/" + this.props.match.params.project +"/testcases"
  );
  
}


  render() {
    return (
      <div>
        <ControlledPopup popupMessage={this.state.errorMessage}/>
        <div>
          <TestCasesFilter
            projectAttributes={this.state.projectAttributes}
            onFilter={this.onFilter}
            project={this.props.match.params.project}
            handleBulkAddAttributes={this.handleBulkAddAttributes}
            handleBulkRemoveAttributes={this.handleBulkRemoveAttributes}
            handleLockAllTestCases={this.handleLockAllTestCases}
            handleUnLockAllTestCases={this.handleUnLockAllTestCases}
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
              project={this.props.match.params.project}
              testcase={this.state.testcaseToEdit}
              projectAttributes={this.state.projectAttributes}
              onTestCaseAdded={this.onTestCaseAdded}
            />
          </div>
        </div>
        <div className="row filter-control-row">
            <div className="col-6">
              Number of Test Cases : <span style={{fontWeight : 'bold'}}>{this.state.totalNoofTestCase}</span>
            </div>
        </div>
        <div className="sweet-loading">
          <FadeLoader sizeUnit={"px"} size={100} color={"#135f38"} loading={this.state.loading} />
        </div>
        <div className="grid_container">
          <div className="tree-side">
            <div id="tree"></div>
            {this.showLoadMore() && (
              <div>
                <a href="" onClick={this.loadMoreTestCases}>
                  Load more
                </a>
              </div>
            )}
          </div>
          <div id="testCase" className="testcase-side">
            {this.state.selectedTestCase && this.state.selectedTestCase.id && (
              <TestCase
                projectId={this.props.match.params.project}
                projectAttributes={this.state.projectAttributes}
                testcaseId={this.state.selectedTestCase.id}
              />
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default TestCases;

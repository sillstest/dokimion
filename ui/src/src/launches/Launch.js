/* eslint-disable eqeqeq */
import React from "react";
import { withRouter } from "react-router";
import SubComponent from "../common/SubComponent";
import TestCase from "../testcases/TestCase";
import LaunchTestcaseControls from "../launches/LaunchTestcaseControls";
import LaunchAttributeStatsChart from "../launches/LaunchAttributeStatsChart";
import LaunchForm from "../launches/LaunchForm";
import { Link } from "react-router-dom";
import * as Utils from "../common/Utils";
import { FadeLoader } from "react-spinners";
import ControlledPopup from "../common/ControlledPopup";
import Backend from "../services/backend";

import $ from "jquery";

var jQuery = require("jquery");
window.jQuery = jQuery;
window.jQuery = $;
window.$ = $;
global.jQuery = $;

require("gijgo/js/gijgo.min.js");
require("gijgo/css/gijgo.min.css");

class Launch extends SubComponent {
  state = {
    errorMessage: "",
    launch: {
      launchStats: {
        statusCounters: {},
      },
      testSuite: {},
      restartFailedOnly: false,
    },
    configAttributePairs: [],
    selectedTestCase: {
      uuid: null,
    },
    attributesStatus: {},
    loading: true,
    errorMessage: "",
    tcSizesFilter: {
      skip: 0,
      limit: 20,
      orderby: "name",
      orderdir: "ASC",
      includedFields: "name,minLines,maxLines",
     },
     tcSizes: {},
     count:0,
     filterLaunch:[],
     notRun: 0,
     passButtonCounter: 0,
     failButtonCounter: 0,
     brokenButtonCounter: 0,
     NotrunButtonCounter: 0,
     refreshTree:false,
  };

  LAUNCH_STATUS = Object.freeze({
    PASSED: 'PASSED',
    FAILED: 'FAILED',
    BROKEN: 'BROKEN',
    RUNNABLE: 'RUNNABLE',
    RUNNING: 'RUNNING',
  });

  constructor(props) {
    super(props);
    this.getLaunch = this.getLaunch.bind(this);
    this.buildTree = this.buildTree.bind(this);
    this.onTestcaseStateChanged = this.onTestcaseStateChanged.bind(this);
    if (this.props.match.params.testcaseUuid) {
      this.state.selectedTestCase = { uuid: this.props.match.params.testcaseUuid };
    }
    this.state.projectId = this.props.match.params.project;
    this.showLaunchStats = this.showLaunchStats.bind(this);
    this.buildAttributesStatusMap = this.buildAttributesStatusMap.bind(this);
    this.addUnknownAttributesToAttributesStatusMap = this.addUnknownAttributesToAttributesStatusMap.bind(this);
    this.handleGetTCSizes = this.handleGetTCSizes.bind(this);
    this.updateCount = this.updateCount.bind(this);
    this.renderLaunchFilter = this.renderLaunchFilter.bind(this);
  }

  componentDidMount() {
    super.componentDidMount();
    this.handleGetTCSizes();
    Backend.get(this.state.projectId + "/attribute")
      .then(response => {
        this.state.projectAttributes = response;
        this.setState(this.state);
        this.getLaunch(true,[]);
      })
      .catch(error => console.log(error));
    this.interval = setInterval(this.getLaunch, 30000);
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

  getLaunch(buildTree) {
    // console.log("In getLaunch: " + buildTree + " refresh: "  + this.state.refreshTree);
    Backend.get(this.state.projectId + "/launch/" + this.props.match.params.launchId)
      .then(response => {
        this.state.launch = response;
        this.state.configAttributePairs = response.configAttributePairs;
        if (!this.state.launch.testSuite || !this.state.launch.testSuite.filter) {
          this.state.launch.testSuite = { filter: { groups: [] } };
        }
        if (this.state.selectedTestCase && this.state.selectedTestCase.uuid) {
          this.state.selectedTestCase = Utils.getTestCaseFromTree(
            this.state.selectedTestCase.uuid,
            this.state.launch.testCaseTree,
            function (testCase, id) {
              return testCase.uuid === id;
            },
          );
        }
        this.state.loading = false;
        this.state.attributesStatus = {};
        this.buildAttributesStatusMap(this.state.launch.testCaseTree);
        this.addUnknownAttributesToAttributesStatusMap(this.state.launch.testCaseTree);
        //Added logic to filter TCS on launch
        this.state.launch.testCaseTree = this.filterLaunchTestCasesOnStatus(this.state.launch.testCaseTree, this.state.filterLaunch);
        this.state.refreshTree=false;
        this.setState(this.state);
        if (buildTree) {
          this.buildTree(this.state.configAttributePairs);
          this.updateCount();
        }
        this.checkUpdatedTestCases();
    
      })
      .catch(error => {
        console.log(error);
        this.setState({errorMessage: "Couldn't get launch: " + error});
        this.state.loading = false;
        this.setState(this.state);
      });
  }

  buildTree(configAttributePairs) {
    if (this.tree) {
      this.tree.destroy();
    }

    this.tree = $("#tree").tree({
      primaryKey: "uuid",
      uiLibrary: "bootstrap4",
      imageHtmlField: "statusHtml",
      dataSource: Utils.parseTree(this.state.launch.testCaseTree, [], this.state.tcSizes,
                                  this.state.configAttributePairs),
    });

    this.tree.on(
      "select",
      function (e, node, id) {
        this.state.selectedTestCase = Utils.getTestCaseFromTree(
          id,
          this.state.launch.testCaseTree,
          function (testCase, id) {
            return testCase.uuid === id;
          },
        );
        this.props.history.push("/" + this.state.projectId + "/launch/" + this.state.launch.id + "/" + id);
        this.setState(this.state);
      }.bind(this),
    );
  
    if (!(this.state.selectedTestCase === undefined) &&
      (!(this.state.selectedTestCase.id === undefined)) &&
      (this.state.selectedTestCase.id)) {
      var node = this.tree.getNodeById(this.state.selectedTestCase.id);
      if (!node) return;
      this.tree.select(node);
      this.state.launch.testSuite.filter.groups.forEach(
        function (groupId) {
          var attributes =
            Utils.getTestCaseFromTree(
              this.state.selectedTestCase.id,
              this.state.launch.testCaseTree,
              function (testCase, id) {
                return testCase.uuid === id;
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

  buildAttributesStatusMap(head) {
    head.testCases.forEach(testCase => {
      Object.keys(testCase.attributes).forEach(attrKey => {
        if (!this.state.attributesStatus[attrKey]) {
          this.state.attributesStatus[attrKey] = {
            name: Utils.getProjectAttribute(this.state.projectAttributes, attrKey).name || "",
            values: {},
          };
        }

        testCase.attributes[attrKey].forEach(attrValue => {
          if (!this.state.attributesStatus[attrKey].values[attrValue]) {
            this.state.attributesStatus[attrKey].values[attrValue] = {
              PASSED: 0,
              FAILED: 0,
              BROKEN: 0,
              RUNNABLE: 0,
              RUNNING: 0,
            };
          }
          this.state.attributesStatus[attrKey].values[attrValue][testCase.launchStatus] =
            this.state.attributesStatus[attrKey].values[attrValue][testCase.launchStatus] + 1;
        });
      });
    });
    head.children.forEach(this.buildAttributesStatusMap);
  }

  addUnknownAttributesToAttributesStatusMap(head) {
    head.testCases.forEach(testCase => {
      Object.keys(this.state.attributesStatus).forEach(attrKey => {
        if (!testCase.attributes[attrKey]) {
          if (!this.state.attributesStatus[attrKey].values["Unknown"]) {
            this.state.attributesStatus[attrKey].values["Unknown"] = {
              PASSED: 0,
              FAILED: 0,
              BROKEN: 0,
              RUNNABLE: 0,
              RUNNING: 0,
            };
          }
          this.state.attributesStatus[attrKey].values["Unknown"][testCase.launchStatus] =
            this.state.attributesStatus[attrKey].values["Unknown"][testCase.launchStatus] + 1;
        }
      });
    });
    head.children.forEach(this.buildAttributesStatusMap);
  }

  onTestcaseStateChanged(testcase) {

    this.state.errorMessage = testcase.displayErrorMessage;
    this.setState(this.state);

    var updatedTestCase = Utils.getTestCaseFromTree(
      testcase.uuid,
      this.state.launch.testCaseTree,
      function (existingTestCase, id) {
        return existingTestCase.uuid === testcase.uuid;
      },
    );
    Object.assign(updatedTestCase, testcase);
    var obj = {testCaseTree: this.state.launch.testCaseTree};
    this.tree.dataSource = Utils.parseTree(obj, [], this.state.tcSizes, this.state.configAttributePairs) || [];
    var testCaseHtmlNode = $("li[data-id='" + testcase.uuid + "']").find("img");
    testCaseHtmlNode.attr("src", Utils.getStatusImg(testcase));

    if (this.state.selectedTestCase !== undefined && this.state.selectedTestCase.uuid !== undefined && this.state.selectedTestCase.uuid == testcase.uuid) {
      this.state.selectedTestCase = testcase;
      //Need to rerender buttons and count when state changed
      this.state.refreshTree = true;
      this.setState(this.state);
    }

    var that = this;
    if (testcase && testcase.uuid) {
      var node = $(that.tree.getNodeById(testcase.uuid));
      if (node[0] != null) {
          $(that.tree.getNodeById(testcase.uuid)[0])
          .parents(".list-group-item")
          .each((num, node) => {
            var nodeId = (node.dataset || {}).id || "";
            var dataNode = Utils.getNodeFromDataSource(nodeId, { children: that.tree.dataSource });
            var htmlImageNode = $(node).find("img")[0];
	    if (htmlImageNode !== undefined && dataNode !== undefined) {
               var nodeImage = Utils.getNodeStatusImg(dataNode);
               $(htmlImageNode).attr("src", nodeImage);
	    }
          });
      }
    }
     //rerender buttons, tree and update number
    if(this.state.refreshTree){
      this.getUpdatedLaunch();
      this.state.launch.testCaseTree = this.filterLaunchTestCasesOnStatus();
      this.buildTree(this.state.configAttributePairs);
      this.updateCount();
      this.renderLaunchFilter();
    }
  }

  checkUpdatedTestCases() {
    if (!this.testCasesStateMap) {
      this.buildTestCasesStateMap(this.state.launch.testCaseTree);
    }
    this.updateTestCasesStateFromLaunch(this.state.launch.testCaseTree);
  }

  updateTestCasesStateFromLaunch(tree) {
    tree.testCases.forEach(
      function (testCase) {
        if (this.testCasesStateMap && this.testCasesStateMap[testCase.uuid] !== testCase.launchStatus) {
          this.onTestcaseStateChanged(testCase);
        }
      }.bind(this),
    );
    tree.children.forEach(
      function (child) {
        this.updateTestCasesStateFromLaunch(child);
      }.bind(this),
    );
    
  }

  buildTestCasesStateMap(tree) {
    this.testCasesStateMap = {};
    tree.testCases.forEach(
      function (testCase) {
        this.testCasesStateMap[testCase.uuid] = testCase.launchStatus;
      }.bind(this),
    );
    tree.children.forEach(
      function (child) {
        this.buildTestCasesStateMap(child);
      }.bind(this),
    );
  }

  showLaunchStats(event) {
    this.state.selectedTestCase.uuid = null;
    this.setState(this.state);
  }

  onLaunchRestart(failedOnly, event) {
    this.state.restartFailedOnly = failedOnly;
    this.setState(this.state);
    $("#restart-launch-modal").modal("toggle");
    event.preventDefault();
  }

  filterLaunchTestCasesOnStatus() {
    let testcasesTree = this.state.launch.testCaseTree; 
    let filterLaunch = this.state.filterLaunch;
    var testCases = [];
    if (filterLaunch && filterLaunch.length>0) {
      if (testcasesTree.testCases && testcasesTree.testCases.length>0) {
  
        filterLaunch.forEach(status => {
          testCases = testCases.concat(this.state.launch.testCaseTree?.testCases.filter((tc) => tc.launchStatus.includes(status)));
        });
        if (testCases ) {
          this.state.launch.testCaseTree.testCases = testCases;
        }
  
      } else if (testcasesTree.children && testcasesTree.children.length>0) {
        
        filterLaunch.forEach(status => {
          testCases = testCases.concat(testcasesTree.children[0].testCases.filter((tc) => tc.launchStatus.includes(status)));
        }
        );
        
        if (testCases ) {
          testcasesTree.children[0].testCases = testCases;

        }
      }
    }
    return testcasesTree;
  }
  
  updateCount() {
    let testCases = [];
    let groups = this.state.launch.testSuite.filter.groups ;
   
    this.state.count = this.state.launch.launchStats.total;
    if (this.state.launch.testCaseTree) {
    let  tcTree = this.state.launch.testCaseTree;
      if (tcTree.testCases && (groups && groups.length===0)) {

        this.state.count = tcTree.testCases.length;
      } else if(tcTree.children && (groups && groups.length>0)) {

        tcTree.children.forEach(child=> 
          {
             testCases = testCases.concat(child.testCases)
          })

        this.state.count = testCases.length;

      }
    }
   this.setState(this.state);
  }

  getUpdatedLaunch(){
    //console.log("In updated launchh : " + this.state.projectId + "/launch/" + this.props.match.params.launchId);
    Backend.get(this.state.projectId + "/launch/" + this.props.match.params.launchId)
    .then(response => {
      this.state.launch = response;
      this.state.refreshTree=false;
      this.setState(this.state);

    })
    .catch(error => {
      console.log(error);
      this.setState({errorMessage: "Couldn't get launch: " + error});
      this.state.loading = false;
      this.setState(this.state);
    });
  }




  renderLaunchFilter(){
    this.state.notRun = this.state.launch.launchStats.statusCounters.RUNNABLE + this.state.launch.launchStats.statusCounters.RUNNING; 
      return (
        
        <div className="col-6 btn-group" role="group">
          <button type="button" className={this.state.passButtonCounter === 0 ? 'btn btn-success' : 'btn btn-success disabled'}
            onClick={e => this.handleSubmit("PASSED", e)} >
            Passed &nbsp;
            <span className="badge badge-light text-dark" > {this.state.launch.launchStats.statusCounters.PASSED}
            </span>
          </button>
          <button type="button" className={this.state.failButtonCounter === 0 ? 'btn btn-danger' : 'btn btn-danger disabled'}
            onClick={e => this.handleSubmit(this.LAUNCH_STATUS.FAILED, e)} >
            Fail  &nbsp;
            <span className="badge badge-light text-dark" > {this.state.launch.launchStats.statusCounters.FAILED}
            </span>
          </button>
          <button type="button" className={this.state.brokenButtonCounter === 0 ? 'btn btn-warning' : 'btn btn-warning disabled'}
            onClick={e => this.handleSubmit(this.LAUNCH_STATUS.BROKEN, e)} >
            Broken &nbsp;<span className="badge badge-light text-dark" > {this.state.launch.launchStats.statusCounters.BROKEN}
            </span>
          </button>
          <button type="button" className={this.state.NotrunButtonCounter === 0 ? 'btn btn-secondary' : 'btn btn-secondary disabled'}
            onClick={e => this.handleSubmit(this.LAUNCH_STATUS.RUNNABLE, e)} >
            Not Run &nbsp;
            <span className="badge badge-light text-dark" > {this.state.notRun}
            </span>
          </button>
        </div>
      );
  }


  handleSubmit(status, event) {
  
    switch (status) {
      case this.LAUNCH_STATUS.PASSED:
        this.state.filterLaunch.push(this.LAUNCH_STATUS.PASSED);
        this.state.passButtonCounter++;
            if (this.state.passButtonCounter > 1) {
          this.state.filterLaunch = this.state.filterLaunch.filter((stat) => stat !== status);
          this.state.passButtonCounter = 0;
        }
        break;
      case this.LAUNCH_STATUS.FAILED:
        this.state.filterLaunch.push(this.LAUNCH_STATUS.FAILED);
        this.state.failButtonCounter++;
        if (this.state.failButtonCounter > 1) {
          this.state.filterLaunch = this.state.filterLaunch.filter((stat) => stat !== status);
          this.state.failButtonCounter = 0;
        }
        break;
      case this.LAUNCH_STATUS.BROKEN:

      this.state.filterLaunch.push(this.LAUNCH_STATUS.BROKEN);
        this.state.brokenButtonCounter++

        if (this.state.brokenButtonCounter > 1) {
          this.state.filterLaunch = this.state.filterLaunch.filter((stat) => stat !== status);
          this.state.brokenButtonCounter = 0;
        }
        break;
      case this.LAUNCH_STATUS.RUNNING:
      case this.LAUNCH_STATUS.RUNNABLE:
        this.state.filterLaunch.push(this.LAUNCH_STATUS.RUNNING);
        this.state.filterLaunch.push(this.LAUNCH_STATUS.RUNNABLE);
        this.state.NotrunButtonCounter++;
        if (this.state.NotrunButtonCounter > 1) {
          this.state.filterLaunch = this.state.filterLaunch.filter((stat) => (stat !== this.LAUNCH_STATUS.RUNNABLE) && (stat !== this.LAUNCH_STATUS.RUNNING));
          this.state.NotrunButtonCounter = 0;
          
        }
        break;
      default:
        console.log(`Wrong selection`);
    }
    
    this.getLaunch(true);

    event.preventDefault();

  }




  render() {
    return (
      <div>
        <div className="row filter-control-row">
            <div className="col-3">
              <h3>
                <Link to={"/" + this.state.projectId + "/launch/" + this.state.launch.id} onClick={this.showLaunchStats}>
                  {this.state.launch.name}
                </Link>
              </h3>
            </div>
            <div className="col-1"></div>
           { this.renderLaunchFilter()}
        </div>
        <ControlledPopup popupMessage={this.state.errorMessage}/>
          {/* Added for Issue 82 */}
        <div>
          Number of Testcases : <span style={{fontWeight : 'bold'}}>{this.state.count}</span>
        </div>
        <br/>
        <div className="sweet-loading">
          <FadeLoader sizeUnit={"px"} size={100} color={"#135f38"} loading={this.state.loading} />
        </div>
        <div className="grid_container">
          <div className="tree-side">
            <div id="tree"></div>
          </div>
          <div id="testCase" className="testcase-side">
            {this.state.selectedTestCase && this.state.selectedTestCase.uuid && (
              <TestCase
                testcase={this.state.selectedTestCase}
                projectAttributes={this.state.projectAttributes}
                readonly={true}
                launchId={this.props.match.params.launchId}
                projectId={this.state.projectId}
              />
            )}
            {this.state.selectedTestCase && this.state.selectedTestCase.uuid && (
              <LaunchTestcaseControls
                testcase={this.state.selectedTestCase}
                launchId={this.props.match.params.launchId}
                projectId={this.state.projectId}
                callback={this.onTestcaseStateChanged}
              />
            )}
            {(!this.state.selectedTestCase || !this.state.selectedTestCase.uuid) && (
              <div>
                {this.state.launch.launchGroup && (
                  <div className="launch-summary-block">
                    <div>
                      <Link to={"/" + this.state.projectId + "/launches?launchGroup=" + this.state.launch.launchGroup}>
                        View Launch Group
                      </Link>
                    </div>
                  </div>
                )}
                {(this.state.launch.testSuite || {}).id && (
                  <div className="launch-summary-block">
                    <div>Test Suite:</div>
                    <div>
                      <Link to={"/" + this.state.projectId + "/testcases?testSuite=" + this.state.launch.testSuite.id}>
                        {this.state.launch.testSuite.name}
                      </Link>
                    </div>
                  </div>
                )}
                <div className="launch-summary-block">
                  <div>Created at: {Utils.timeToDate(this.state.launch.createdTime)}</div>
                  <div>Started at: {Utils.timeToDate(this.state.launch.startTime)}</div>
                  <div>Finished at: {Utils.timeToDate(this.state.launch.finishTime)}</div>
                </div>
                {typeof(this.state.launch) != 'undefined' &&
                <div className="progress launch-summary-block">
                  <div
                    className="progress-bar progress-bar-striped"
                    role="progressbar"
                    style={Utils.getProgressBarStyle(
                      this.state.launch.launchStats.statusCounters.RUNNING,
                      this.state.launch.launchStats.total,
                    )}
                  >
                    {Utils.getProgressBarNumber(
                      this.state.launch.launchStats.statusCounters.RUNNING,
                      this.state.launch.launchStats.total,
                    )}
                  </div>
                  <div
                    className="progress-bar bg-success"
                    role="progressbar"
                    style={Utils.getProgressBarStyle(
                      this.state.launch.launchStats.statusCounters.PASSED,
                      this.state.launch.launchStats.total,
                    )}
                  >
                    {Utils.getProgressBarNumber(
                      this.state.launch.launchStats.statusCounters.PASSED,
                      this.state.launch.launchStats.total,
                    )}
                  </div>
                  <div
                    className="progress-bar bg-danger"
                    role="progressbar"
                    style={Utils.getProgressBarStyle(
                      this.state.launch.launchStats.statusCounters.FAILED,
                      this.state.launch.launchStats.total,
                    )}
                  >
                    {Utils.getProgressBarNumber(
                      this.state.launch.launchStats.statusCounters.FAILED,
                      this.state.launch.launchStats.total,
                    )}
                  </div>
                  <div
                    className="progress-bar bg-warning"
                    role="progressbar"
                    style={Utils.getProgressBarStyle(
                      this.state.launch.launchStats.statusCounters.BROKEN,
                      this.state.launch.launchStats.total,
                    )}
                  >
                    {Utils.getProgressBarNumber(
                      this.state.launch.launchStats.statusCounters.BROKEN,
                      this.state.launch.launchStats.total,
                    )}
                  </div>
                </div>
                }
                <div className="restart-launch-control">
                  <button type="button" className="btn btn-primary" onClick={e => this.onLaunchRestart(false, e)}>
                    Restart All
                  </button>
                  <button type="button" className="btn btn-danger" onClick={e => this.onLaunchRestart(true, e)}>
                    Restart Failed
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          className="modal fade"
          id="restart-launch-modal"
          tabIndex="-1"
          role="dialog"
          aria-labelledby="launchLabel"
          aria-hidden="true"
        >
          <LaunchForm launch={this.state.launch} restart={true} failedOnly={this.state.restartFailedOnly} modalName="restart-launch-modal" />
        </div>
      </div>
    );
  }
}

export default withRouter(Launch);

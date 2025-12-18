/* eslint-disable eqeqeq */
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TestCase from "../testcases/TestCase";
import LaunchForm from "../launches/LaunchForm";
import { Link } from "react-router-dom";
import * as Utils from "../common/Utils";
import { FadeLoader } from "react-spinners";
import ControlledPopup from "../common/ControlledPopup";
import Backend from "../services/backend";
import $ from "jquery";

const jQuery = require("jquery");
window.jQuery = jQuery;
window.jQuery = $;
window.$ = $;
global.jQuery = $;

require("gijgo/js/gijgo.min.js");
require("gijgo/css/gijgo.min.css");

const Launch = () => {
  const { project: projectId, launchId, testcaseUuid } = useParams();
  const navigate = useNavigate();

  const LAUNCH_STATUS = Object.freeze({
    PASSED: 'PASSED',
    FAILED: 'FAILED',
    BROKEN: 'BROKEN',
    RUNNABLE: 'RUNNABLE',
    RUNNING: 'RUNNING',
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [launch, setLaunch] = useState({
    launchStats: {
      statusCounters: {},
    },
    testSuite: {},
    restartFailedOnly: false,
  });
  const [configAttributePairs, setConfigAttributePairs] = useState([]);
  const [selectedTestCase, setSelectedTestCase] = useState({
    uuid: testcaseUuid || null,
  });
  const [attributesStatus, setAttributesStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [projectAttributes, setProjectAttributes] = useState([]);
  const [tcSizesFilter] = useState({
    skip: 0,
    limit: 20,
    orderby: "name",
    orderdir: "ASC",
    includedFields: "name,minLines,maxLines",
  });
  const [tcSizes, setTcSizes] = useState({});
  const [count, setCount] = useState(0);
  const [filterLaunch, setFilterLaunch] = useState([]);
  const [notRun, setNotRun] = useState(0);
  const [passButtonCounter, setPassButtonCounter] = useState(0);
  const [failButtonCounter, setFailButtonCounter] = useState(0);
  const [brokenButtonCounter, setBrokenButtonCounter] = useState(0);
  const [NotrunButtonCounter, setNotrunButtonCounter] = useState(0);
  const [refreshTree, setRefreshTree] = useState(false);

  const treeRef = useRef(null);
  const intervalRef = useRef(null);
  const testCasesStateMapRef = useRef(null);

  // Fetch test case sizes
  const handleGetTCSizes = () => {
    Backend.get("/testcasesizes/getalltcsizes?" + Utils.filterToQuery(tcSizesFilter))
      .then(response => {
        setTcSizes(response);
      })
      .catch(() => {
        console.log("Error in handleGetTCsizes");
      });
  };

  // Build attributes status map
  const buildAttributesStatusMap = (head, statusMap) => {
    head.testCases.forEach(testCase => {
      Object.keys(testCase.attributes).forEach(attrKey => {
        if (!statusMap[attrKey]) {
          statusMap[attrKey] = {
            name: Utils.getProjectAttribute(projectAttributes, attrKey).name || "",
            values: {},
          };
        }

        testCase.attributes[attrKey].forEach(attrValue => {
          if (!statusMap[attrKey].values[attrValue]) {
            statusMap[attrKey].values[attrValue] = {
              PASSED: 0,
              FAILED: 0,
              BROKEN: 0,
              RUNNABLE: 0,
              RUNNING: 0,
            };
          }
          statusMap[attrKey].values[attrValue][testCase.launchStatus] += 1;
        });
      });
    });
    head.children.forEach(child => buildAttributesStatusMap(child, statusMap));
  };

  // Add unknown attributes to status map
  const addUnknownAttributesToAttributesStatusMap = (head, statusMap) => {
    head.testCases.forEach(testCase => {
      Object.keys(statusMap).forEach(attrKey => {
        if (!testCase.attributes[attrKey]) {
          if (!statusMap[attrKey].values["Unknown"]) {
            statusMap[attrKey].values["Unknown"] = {
              PASSED: 0,
              FAILED: 0,
              BROKEN: 0,
              RUNNABLE: 0,
              RUNNING: 0,
            };
          }
          statusMap[attrKey].values["Unknown"][testCase.launchStatus] += 1;
        }
      });
    });
    head.children.forEach(child => addUnknownAttributesToAttributesStatusMap(child, statusMap));
  };

  // Filter launch test cases on status
  const filterLaunchTestCasesOnStatus = (testcasesTree, filterArray) => {
    let testCases = [];
    if (filterArray && filterArray.length > 0) {
      if (testcasesTree.testCases && testcasesTree.testCases.length > 0) {
        filterArray.forEach(status => {
          testCases = testCases.concat(testcasesTree.testCases.filter((tc) => tc.launchStatus.includes(status)));
        });
        if (testCases) {
          testcasesTree.testCases = testCases;
        }
      } else if (testcasesTree.children && testcasesTree.children.length > 0) {
        filterArray.forEach(status => {
          testCases = testCases.concat(testcasesTree.children[0].testCases.filter((tc) => tc.launchStatus.includes(status)));
        });
        if (testCases) {
          testcasesTree.children[0].testCases = testCases;
        }
      }
    }
    return testcasesTree;
  };

  // Update count
  const updateCount = (launchData) => {
    let testCases = [];
    let groups = launchData.testSuite.filter.groups;
    
    let newCount = launchData.launchStats.total;
    if (launchData.testCaseTree) {
      let tcTree = launchData.testCaseTree;
      if (tcTree.testCases && (groups && groups.length === 0)) {
        newCount = tcTree.testCases.length;
      } else if (tcTree.children && (groups && groups.length > 0)) {
        tcTree.children.forEach(child => {
          testCases = testCases.concat(child.testCases);
        });
        newCount = testCases.length;
      }
    }
    setCount(newCount);
  };

  // Build tree
  const buildTree = (configAttrPairs, launchData) => {
    if (treeRef.current) {
      treeRef.current.destroy();
    }

    treeRef.current = $("#tree").tree({
      primaryKey: "uuid",
      uiLibrary: "bootstrap4",
      imageHtmlField: "statusHtml",
      dataSource: Utils.parseTree(launchData.testCaseTree, [], tcSizes, configAttrPairs),
    });

    treeRef.current.on("select", (e, node, id) => {
      const selectedTC = Utils.getTestCaseFromTree(
        id,
        launchData.testCaseTree,
        (testCase, tcId) => testCase.uuid === tcId
      );
      setSelectedTestCase(selectedTC);
      navigate("/" + projectId + "/launch/" + launchData.id + "/" + id);
    });

    if (selectedTestCase && selectedTestCase.id) {
      const node = treeRef.current.getNodeById(selectedTestCase.id);
      if (node) {
        treeRef.current.select(node);
        launchData.testSuite.filter.groups.forEach(groupId => {
          const attributes = Utils.getTestCaseFromTree(
            selectedTestCase.id,
            launchData.testCaseTree,
            (testCase, id) => testCase.uuid === id
          ).attributes || {};
          const values = attributes[groupId] || ["None"];
          values.forEach(value => {
            const attrNode = treeRef.current.getNodeById(groupId + ":" + value);
            if (attrNode) {
              treeRef.current.expand(attrNode);
            }
          });
        });
      }
    }
  };

  // Get launch data
  const getLaunch = (buildTreeFlag = false) => {
    Backend.get(projectId + "/launch/" + launchId)
      .then(response => {
        setConfigAttributePairs(response.configAttributePairs || []);
        
        let updatedLaunch = { ...response };
        if (!updatedLaunch.testSuite || !updatedLaunch.testSuite.filter) {
          updatedLaunch.testSuite = { filter: { groups: [] } };
        }

        if (selectedTestCase && selectedTestCase.uuid) {
          const updatedSelectedTC = Utils.getTestCaseFromTree(
            selectedTestCase.uuid,
            updatedLaunch.testCaseTree,
            (testCase, id) => testCase.uuid === id
          );
          if (updatedSelectedTC) {
            setSelectedTestCase(updatedSelectedTC);
          }
        }

        setLoading(false);
        
        const newAttributesStatus = {};
        buildAttributesStatusMap(updatedLaunch.testCaseTree, newAttributesStatus);
        addUnknownAttributesToAttributesStatusMap(updatedLaunch.testCaseTree, newAttributesStatus);
        setAttributesStatus(newAttributesStatus);

        // Filter test cases on launch
        updatedLaunch.testCaseTree = filterLaunchTestCasesOnStatus(updatedLaunch.testCaseTree, filterLaunch);
        setRefreshTree(false);
        setLaunch(updatedLaunch);

        if (buildTreeFlag) {
          buildTree(response.configAttributePairs || [], updatedLaunch);
          updateCount(updatedLaunch);
        }
        checkUpdatedTestCases(updatedLaunch);
      })
      .catch(error => {
        console.log(error);
        setErrorMessage("getLaunch::Couldn't get launch, error: " + error);
        setLoading(false);
      });
  };

  // Build test cases state map
  const buildTestCasesStateMap = (tree) => {
    if (!testCasesStateMapRef.current) {
      testCasesStateMapRef.current = {};
    }
    tree.testCases.forEach(testCase => {
      testCasesStateMapRef.current[testCase.uuid] = testCase.launchStatus;
    });
    tree.children.forEach(child => buildTestCasesStateMap(child));
  };

  // Update test cases state from launch
  const updateTestCasesStateFromLaunch = (tree) => {
    tree.testCases.forEach(testCase => {
      if (testCasesStateMapRef.current && testCasesStateMapRef.current[testCase.uuid] !== testCase.launchStatus) {
        onTestcaseStateChanged(testCase);
      }
    });
    tree.children.forEach(child => updateTestCasesStateFromLaunch(child));
  };

  // Check updated test cases
  const checkUpdatedTestCases = (launchData) => {
    if (!testCasesStateMapRef.current) {
      buildTestCasesStateMap(launchData.testCaseTree);
    }
    updateTestCasesStateFromLaunch(launchData.testCaseTree);
  };

  // On testcase state changed
  const onTestcaseStateChanged = (testcase) => {
    setErrorMessage(testcase.displayErrorMessage || "");

    const updatedTestCase = Utils.getTestCaseFromTree(
      testcase.uuid,
      launch.testCaseTree,
      (existingTestCase) => existingTestCase.uuid === testcase.uuid
    );
    
    if (updatedTestCase) {
      Object.assign(updatedTestCase, testcase);
      const obj = { testCaseTree: launch.testCaseTree };
      if (treeRef.current) {
        treeRef.current.dataSource = Utils.parseTree(obj, [], tcSizes, configAttributePairs) || [];
      }
      
      const testCaseHtmlNode = $("li[data-id='" + testcase.uuid + "']").find("img");
      testCaseHtmlNode.attr("src", Utils.getStatusImg(testcase));

      if (selectedTestCase && selectedTestCase.uuid && selectedTestCase.uuid == testcase.uuid) {
        setSelectedTestCase(testcase);
        setRefreshTree(true);
      }

      if (testcase && testcase.uuid && treeRef.current) {
        const node = $(treeRef.current.getNodeById(testcase.uuid));
        if (node[0] != null) {
          $(treeRef.current.getNodeById(testcase.uuid)[0])
            .parents(".list-group-item")
            .each((num, nodeEl) => {
              const nodeId = (nodeEl.dataset || {}).id || "";
              const dataNode = Utils.getNodeFromDataSource(nodeId, { children: treeRef.current.dataSource });
              const htmlImageNode = $(nodeEl).find("img")[0];
              if (htmlImageNode !== undefined && dataNode !== undefined) {
                const nodeImage = Utils.getNodeStatusImg(dataNode);
                $(htmlImageNode).attr("src", nodeImage);
              }
            });
        }
      }

      if (refreshTree) {
        getLaunch(true);
      }
    }
  };

  // Show launch stats
  const showLaunchStats = (event) => {
    setSelectedTestCase({ uuid: null });
    navigate("/" + projectId + "/launch/" + launchId);
    event.preventDefault();
  };

  // On launch restart
  const onLaunchRestart = (failedOnly, event) => {
    setLaunch(prev => ({ ...prev, restartFailedOnly: failedOnly }));
    $("#restart-launch-modal").modal("toggle");
    event.preventDefault();
  };

  // Handle status filter
  const handleSubmit = (status, event) => {
    let newFilterLaunch = [...filterLaunch];
    
    switch (status) {
      case LAUNCH_STATUS.PASSED:
        if (passButtonCounter > 0) {
          newFilterLaunch = newFilterLaunch.filter((stat) => stat !== status);
          setPassButtonCounter(0);
        } else {
          newFilterLaunch.push(status);
          setPassButtonCounter(1);
        }
        break;
      case LAUNCH_STATUS.FAILED:
        if (failButtonCounter > 0) {
          newFilterLaunch = newFilterLaunch.filter((stat) => stat !== status);
          setFailButtonCounter(0);
        } else {
          newFilterLaunch.push(status);
          setFailButtonCounter(1);
        }
        break;
      case LAUNCH_STATUS.BROKEN:
        if (brokenButtonCounter > 0) {
          newFilterLaunch = newFilterLaunch.filter((stat) => stat !== status);
          setBrokenButtonCounter(0);
        } else {
          newFilterLaunch.push(status);
          setBrokenButtonCounter(1);
        }
        break;
      case LAUNCH_STATUS.RUNNING:
      case LAUNCH_STATUS.RUNNABLE:
        if (NotrunButtonCounter > 0) {
          newFilterLaunch = newFilterLaunch.filter((stat) => (stat !== LAUNCH_STATUS.RUNNABLE) && (stat !== LAUNCH_STATUS.RUNNING));
          setNotrunButtonCounter(0);
        } else {
          newFilterLaunch.push(LAUNCH_STATUS.RUNNING);
          newFilterLaunch.push(LAUNCH_STATUS.RUNNABLE);
          setNotrunButtonCounter(1);
        }
        break;
      default:
        console.log(`Wrong selection`);
    }
    
    setFilterLaunch(newFilterLaunch);
    getLaunch(true);
    event.preventDefault();
  };

  // Render launch filter
  const renderLaunchFilter = () => {
    const calculatedNotRun = (launch.launchStats.statusCounters.RUNNABLE || 0) + (launch.launchStats.statusCounters.RUNNING || 0);
    
    return (
      <div className="col-6 btn-group" role="group">
        <button 
          type="button" 
          className={passButtonCounter === 0 ? 'btn btn-success' : 'btn btn-success disabled'}
          onClick={e => handleSubmit(LAUNCH_STATUS.PASSED, e)}
        >
          Passed &nbsp;
          <span className="badge badge-light text-dark">
            {launch.launchStats.statusCounters.PASSED || 0}
          </span>
        </button>
        <button 
          type="button" 
          className={failButtonCounter === 0 ? 'btn btn-danger' : 'btn btn-danger disabled'}
          onClick={e => handleSubmit(LAUNCH_STATUS.FAILED, e)}
        >
          Fail &nbsp;
          <span className="badge badge-light text-dark">
            {launch.launchStats.statusCounters.FAILED || 0}
          </span>
        </button>
        <button 
          type="button" 
          className={brokenButtonCounter === 0 ? 'btn btn-warning' : 'btn btn-warning disabled'}
          onClick={e => handleSubmit(LAUNCH_STATUS.BROKEN, e)}
        >
          Broken &nbsp;
          <span className="badge badge-light text-dark">
            {launch.launchStats.statusCounters.BROKEN || 0}
          </span>
        </button>
        <button 
          type="button" 
          className={NotrunButtonCounter === 0 ? 'btn btn-secondary' : 'btn btn-secondary disabled'}
          onClick={e => handleSubmit(LAUNCH_STATUS.RUNNABLE, e)}
        >
          Not Run &nbsp;
          <span className="badge badge-light text-dark">
            {calculatedNotRun}
          </span>
        </button>
      </div>
    );
  };

  // Component mount effect
  useEffect(() => {
    handleGetTCSizes();
    
    Backend.get(projectId + "/attribute")
      .then(response => {
        setProjectAttributes(response);
      })
      .catch(error => console.log(error));

    intervalRef.current = setInterval(() => getLaunch(false), 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (treeRef.current) {
        treeRef.current.destroy();
      }
    };
  }, []);

  // Initial launch fetch after project attributes are loaded
  useEffect(() => {
    if (projectAttributes.length > 0) {
      getLaunch(true);
    }
  }, [projectAttributes]);

  return (
    <div>
      <div className="row filter-control-row">
        <div className="col-3">
          <h3>
            <Link to={"/" + projectId + "/launch/" + launch.id} onClick={showLaunchStats}>
              {launch.name}
            </Link>
          </h3>
        </div>
        <div className="col-1"></div>
        {renderLaunchFilter()}
      </div>
      <ControlledPopup popupMessage={errorMessage} />
      
      <div>
        Number of Testcases : <span style={{ fontWeight: 'bold' }}>{count}</span>
      </div>
      <br />
      
      <div className="sweet-loading">
        <FadeLoader sizeUnit={"px"} size={100} color={"#135f38"} loading={loading} />
      </div>
      
      <div className="grid_container">
        <div className="tree-side">
          <div id="tree"></div>
        </div>
        <div id="testCase" className="testcase-side">
          {selectedTestCase && selectedTestCase.uuid && (
            <TestCase
              testcase={selectedTestCase}
              projectAttributes={projectAttributes}
              readonly={true}
              launchId={launchId}
              projectId={projectId}
              callback={onTestcaseStateChanged}
            />
          )}
          {(!selectedTestCase || !selectedTestCase.uuid) && (
            <div>
              {launch.launchGroup && (
                <div className="launch-summary-block">
                  <div>
                    <Link to={"/" + projectId + "/launches?launchGroup=" + launch.launchGroup}>
                      View Launch Group
                    </Link>
                  </div>
                </div>
              )}
              {(launch.testSuite || {}).id && (
                <div className="launch-summary-block">
                  <div>Test Suite:</div>
                  <div>
                    <Link to={"/" + projectId + "/testcases?testSuite=" + launch.testSuite.id}>
                      {launch.testSuite.name}
                    </Link>
                  </div>
                </div>
              )}
              <div className="launch-summary-block">
                <div>Created at: {Utils.timeToDate(launch.createdTime)}</div>
                <div>Started at: {Utils.timeToDate(launch.startTime)}</div>
                <div>Finished at: {Utils.timeToDate(launch.finishTime)}</div>
              </div>
              {typeof (launch) != 'undefined' && (
                <div className="progress launch-summary-block">
                  <div
                    className="progress-bar progress-bar-striped"
                    role="progressbar"
                    style={Utils.getProgressBarStyle(
                      launch.launchStats.statusCounters.RUNNING,
                      launch.launchStats.total
                    )}
                  >
                    {Utils.getProgressBarNumber(
                      launch.launchStats.statusCounters.RUNNING,
                      launch.launchStats.total
                    )}
                  </div>
                  <div
                    className="progress-bar bg-success"
                    role="progressbar"
                    style={Utils.getProgressBarStyle(
                      launch.launchStats.statusCounters.PASSED,
                      launch.launchStats.total
                    )}
                  >
                    {Utils.getProgressBarNumber(
                      launch.launchStats.statusCounters.PASSED,
                      launch.launchStats.total
                    )}
                  </div>
                  <div
                    className="progress-bar bg-danger"
                    role="progressbar"
                    style={Utils.getProgressBarStyle(
                      launch.launchStats.statusCounters.FAILED,
                      launch.launchStats.total
                    )}
                  >
                    {Utils.getProgressBarNumber(
                      launch.launchStats.statusCounters.FAILED,
                      launch.launchStats.total
                    )}
                  </div>
                  <div
                    className="progress-bar bg-warning"
                    role="progressbar"
                    style={Utils.getProgressBarStyle(
                      launch.launchStats.statusCounters.BROKEN,
                      launch.launchStats.total
                    )}
                  >
                    {Utils.getProgressBarNumber(
                      launch.launchStats.statusCounters.BROKEN,
                      launch.launchStats.total
                    )}
                  </div>
                </div>
              )}
              <div className="restart-launch-control">
                <button type="button" className="btn btn-primary" onClick={e => onLaunchRestart(false, e)}>
                  Restart All
                </button>
                <button type="button" className="btn btn-danger" onClick={e => onLaunchRestart(true, e)}>
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
        <LaunchForm 
          launch={launch} 
          restart={true} 
          failedOnly={launch.restartFailedOnly} 
          modalName="restart-launch-modal" 
        />
      </div>
    </div>
  );
};
export default Launch;

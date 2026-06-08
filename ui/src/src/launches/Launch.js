/* eslint-disable eqeqeq */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { withRouter } from "../common/withRouter";
import TestCase from "../testcases/TestCase";
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

const LAUNCH_STATUS = Object.freeze({ PASSED: 'PASSED', FAILED: 'FAILED', BROKEN: 'BROKEN', RUNNABLE: 'RUNNABLE', RUNNING: 'RUNNING' });

// Structural fingerprint of a parsed tree (node uuids + nesting), independent of status.
// Two fetches with the same structure differ only in icons, so we can refresh in place
// instead of tearing the tree down and rebuilding it (which detaches DOM nodes mid-click).
function treeStructureSignature(nodes) {
  return (nodes || []).map(n => n.uuid + "(" + treeStructureSignature(n.children) + ")").join(",");
}

// Update each node's own status icon in place. gijgo renders a node's image inside
// <li data-id=X> > div[data-role=wrapper] > span[data-role=image] > img; the direct-child
// path avoids touching descendant nodes' icons. statusHtml is "<img src=...>" (possibly
// prefixed), so we lift the src out of it rather than recomputing.
function updateTreeNodeIcons(nodes) {
  (nodes || []).forEach(function (n) {
    if (n.uuid != null && n.uuid !== "" && n.statusHtml) {
      const m = /src="([^"]*)"/.exec(n.statusHtml);
      if (m) {
        $("#tree li[data-id='" + n.uuid + "'] > div[data-role='wrapper'] > span[data-role='image'] img").attr("src", m[1]);
      }
    }
    if (n.children) updateTreeNodeIcons(n.children);
  });
}

function Launch({ match, history }) {
  const project = match?.params?.project;
  const launchId = match?.params?.launchId;
  const testcaseUuidParam = match?.params?.testcaseUuid;

  const [launch, setLaunch] = useState({ launchStats: { statusCounters: {} }, testSuite: {}, restartFailedOnly: false });
  const [selectedTestCase, setSelectedTestCase] = useState(testcaseUuidParam ? { uuid: testcaseUuidParam } : { uuid: null });
  const [projectAttributes, setProjectAttributes] = useState([]);
  const [configAttributePairs, setConfigAttributePairs] = useState([]);
  const [tcSizes, setTcSizes] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [count, setCount] = useState(0);
  const [filterLaunch, setFilterLaunch] = useState([]);
  const [passCounter, setPassCounter] = useState(0);
  const [failCounter, setFailCounter] = useState(0);
  const [brokenCounter, setBrokenCounter] = useState(0);
  const [notRunCounter, setNotRunCounter] = useState(0);
  const [notRun, setNotRun] = useState(0);
  const [restartFailedOnly, setRestartFailedOnly] = useState(false);

  const treeRef = useRef(null);
  const launchRef = useRef(launch);
  const filterLaunchRef = useRef(filterLaunch);
  const selectedTestCaseRef = useRef(selectedTestCase);
  const tcSizesRef = useRef(tcSizes);
  const configAttrPairsRef = useRef(configAttributePairs);
  const testCasesStateMap = useRef(null);
  const intervalRef = useRef(null);
  const fetchIdRef = useRef(0);
  const expandedNodesRef = useRef(new Set());
  const lastTreeSignatureRef = useRef(null);

  useEffect(() => { launchRef.current = launch; }, [launch]);
  // Reset tracked expansion when switching to a different launch — node ids from the
  // previous launch must not leak in and auto-expand unrelated groups in the new one.
  // Also clear the tree signature so the new launch always gets a full (re)build.
  useEffect(() => { expandedNodesRef.current = new Set(); lastTreeSignatureRef.current = null; }, [launchId]);
  useEffect(() => { filterLaunchRef.current = filterLaunch; }, [filterLaunch]);
  useEffect(() => { selectedTestCaseRef.current = selectedTestCase; }, [selectedTestCase]);
  useEffect(() => { tcSizesRef.current = tcSizes; }, [tcSizes]);
  useEffect(() => { configAttrPairsRef.current = configAttributePairs; }, [configAttributePairs]);

  function buildTree(launchData, caps, sizes) {
    const dataSource = Utils.parseTree(launchData.testCaseTree, [], sizes, caps);
    const signature = treeStructureSignature(dataSource);
    // Status-only update (same nodes, same nesting): refresh icons in place and keep the
    // existing DOM. Destroying/recreating the tree here detaches nodes that Selenium — or a
    // real user — may be mid-click on, surfacing as StaleElementReferenceException. Expansion
    // and selection are preserved automatically since we don't tear the tree down.
    if (treeRef.current && signature === lastTreeSignatureRef.current) {
      updateTreeNodeIcons(dataSource);
      return;
    }
    lastTreeSignatureRef.current = signature;
    if (treeRef.current) treeRef.current.destroy();
    treeRef.current = $("#tree").tree({
      primaryKey: "uuid",
      uiLibrary: "bootstrap4",
      imageHtmlField: "statusHtml",
      dataSource: dataSource,
    });
    treeRef.current.on("select", function (e, node, id) {
      const tc = Utils.getTestCaseFromTree(id, launchData.testCaseTree, (tc, id) => tc.uuid === id);
      if (!tc) return; // Group node selected — don't navigate or change view
      // Skip state update if this is a programmatic re-selection of the already-selected node.
      // buildTree calls select() to restore the visual highlight; if we let it overwrite React
      // state with capturedLaunch data (which may be stale), we lose in-flight status updates.
      if (selectedTestCaseRef.current && selectedTestCaseRef.current.uuid === id) return;
      setSelectedTestCase(tc);
      history.push("/" + project + "/launch/" + launchData.id + "/" + id);
    });
    // Track which group nodes are expanded so we can restore them after a rebuild.
    // gijgo's destroy()/recreate resets every node to collapsed, which otherwise
    // makes a node the user (or Selenium) just expanded snap shut on the next fetch.
    treeRef.current.on("expand", function (e, node, id) { expandedNodesRef.current.add(String(id)); });
    treeRef.current.on("collapse", function (e, node, id) { expandedNodesRef.current.delete(String(id)); });
    expandedNodesRef.current.forEach(function (id) {
      const node = treeRef.current.getNodeById(id);
      if (node && node.length) treeRef.current.expand(node);
    });
    const selTC = selectedTestCaseRef.current;
    if (selTC && selTC.id) {
      const node = treeRef.current.getNodeById(selTC.id);
      if (node) treeRef.current.select(node);
    }
  }

  function updateCount(launchData) {
    const groups = (launchData.testSuite?.filter?.groups) || [];
    let cnt = launchData.launchStats.total;
    if (launchData.testCaseTree) {
      const tcTree = launchData.testCaseTree;
      if (tcTree.testCases && groups.length === 0) {
        cnt = tcTree.testCases.length;
      } else if (tcTree.children && groups.length > 0) {
        let tcs = [];
        tcTree.children.forEach(child => { tcs = tcs.concat(child.testCases); });
        cnt = tcs.length;
      }
    }
    setCount(cnt);
    setNotRun((launchData.launchStats.statusCounters.RUNNABLE || 0) + (launchData.launchStats.statusCounters.RUNNING || 0));
  }

  function filterLaunchTestCasesOnStatus(launchData, flFilter) {
    const testcasesTree = launchData.testCaseTree;
    if (!flFilter || flFilter.length === 0) return launchData;
    const updated = { ...launchData, testCaseTree: { ...testcasesTree } };
    if (testcasesTree.testCases && testcasesTree.testCases.length > 0) {
      let tcs = [];
      flFilter.forEach(status => { tcs = tcs.concat(testcasesTree.testCases.filter(tc => tc.launchStatus.includes(status))); });
      updated.testCaseTree = { ...testcasesTree, testCases: tcs };
    } else if (testcasesTree.children && testcasesTree.children.length > 0) {
      let tcs = [];
      flFilter.forEach(status => { tcs = tcs.concat(testcasesTree.children[0].testCases.filter(tc => tc.launchStatus.includes(status))); });
      const updatedChildren = [...testcasesTree.children];
      updatedChildren[0] = { ...updatedChildren[0], testCases: tcs };
      updated.testCaseTree = { ...testcasesTree, children: updatedChildren };
    }
    return updated;
  }

  const fetchLaunch = useCallback((shouldBuildTree, flFilter) => {
    const myFetchId = ++fetchIdRef.current;
    Backend.get(project + "/launch/" + launchId)
      .then(response => {
        // Discard results from an earlier in-flight fetch that resolved after a newer one.
        // Without this, a Start-fetch resolving after a Pass-fetch overwrites PASSED state
        // with stale RUNNING data, causing Selenium to never see the status badge update.
        if (fetchIdRef.current !== myFetchId) return;
        if (!response.testSuite || !response.testSuite.filter) response.testSuite = { filter: { groups: [] } };
        const caps = response.configAttributePairs;
        setConfigAttributePairs(caps);
        const selTC = selectedTestCaseRef.current;
        if (selTC && selTC.uuid) {
          const found = Utils.getTestCaseFromTree(selTC.uuid, response.testCaseTree, (tc, id) => tc.uuid === id);
          if (found) setSelectedTestCase(found);
        }
        const filtered = filterLaunchTestCasesOnStatus(response, flFilter || filterLaunchRef.current);
        setLaunch(filtered);
        setLoading(false);
        updateCount(filtered);
        if (shouldBuildTree) {
          const capturedLaunch = filtered;
          const capturedCaps = caps;
          // Defer until after React has committed its re-render. Without this,
          // React 18 batches the state updates above and flushes them AFTER
          // buildTree runs, causing a re-render that makes Selenium's DOM
          // references stale (StaleElementReferenceException on tree nodes).
          requestAnimationFrame(() => buildTree(capturedLaunch, capturedCaps, tcSizesRef.current));
        }
      })
      .catch(error => { setErrorMessage("Couldn't get launch: " + error); setLoading(false); });
  }, [project, launchId]);

  useEffect(() => {
    Backend.get("/testcasesizes/getalltcsizes?" + Utils.filterToQuery({ skip: 0, limit: 20, orderby: "name", orderdir: "ASC", includedFields: "name,minLines,maxLines" }))
      .then(response => setTcSizes(response))
      .catch(() => console.log("Error in handleGetTCSizes"));

    Backend.get(project + "/attribute")
      .then(response => {
        setProjectAttributes(response);
        fetchLaunch(true, []);
      })
      .catch(error => console.log(error));

    intervalRef.current = setInterval(() => fetchLaunch(false, filterLaunchRef.current), 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  function onTestcaseStateChanged(testcase) {
    setErrorMessage(testcase.displayErrorMessage || "");
    const updatedTC = Utils.getTestCaseFromTree(testcase.uuid, launchRef.current.testCaseTree, (tc) => tc.uuid === testcase.uuid);
    if (updatedTC) Object.assign(updatedTC, testcase);
    const selTC = selectedTestCaseRef.current;
    if (selTC && selTC.uuid == testcase.uuid) {
      setSelectedTestCase(testcase);
      fetchLaunch(true, filterLaunchRef.current);
    }
    if (treeRef.current) {
      const testCaseHtmlNode = $("li[data-id='" + testcase.uuid + "']").find("img");
      testCaseHtmlNode.attr("src", Utils.getStatusImg(testcase));
    }
  }

  function handleSubmit(status, event) {
    setFilterLaunch(prev => {
      let updated = [...prev];
      switch (status) {
        case LAUNCH_STATUS.PASSED:
          setPassCounter(c => {
            if (c + 1 > 1) { updated = updated.filter(s => s !== LAUNCH_STATUS.PASSED); return 0; }
            updated.push(LAUNCH_STATUS.PASSED); return c + 1;
          }); break;
        case LAUNCH_STATUS.FAILED:
          setFailCounter(c => {
            if (c + 1 > 1) { updated = updated.filter(s => s !== LAUNCH_STATUS.FAILED); return 0; }
            updated.push(LAUNCH_STATUS.FAILED); return c + 1;
          }); break;
        case LAUNCH_STATUS.BROKEN:
          setBrokenCounter(c => {
            if (c + 1 > 1) { updated = updated.filter(s => s !== LAUNCH_STATUS.BROKEN); return 0; }
            updated.push(LAUNCH_STATUS.BROKEN); return c + 1;
          }); break;
        case LAUNCH_STATUS.RUNNABLE:
        case LAUNCH_STATUS.RUNNING:
          setNotRunCounter(c => {
            if (c + 1 > 1) { updated = updated.filter(s => s !== LAUNCH_STATUS.RUNNABLE && s !== LAUNCH_STATUS.RUNNING); return 0; }
            updated.push(LAUNCH_STATUS.RUNNING, LAUNCH_STATUS.RUNNABLE); return c + 1;
          }); break;
        default: break;
      }
      fetchLaunch(true, updated);
      return updated;
    });
    event.preventDefault();
  }

  function onLaunchRestart(failedOnly, event) {
    setRestartFailedOnly(failedOnly);
    $("#restart-launch-modal").modal("toggle");
    event.preventDefault();
  }

  const stats = launch.launchStats?.statusCounters || {};

  return (
    <div>
      <div className="row filter-control-row">
        <div className="col-3">
          <h3>
            <Link to={"/" + project + "/launch/" + launch.id} onClick={() => setSelectedTestCase({ uuid: null })}>
              {launch.name}
            </Link>
          </h3>
        </div>
        <div className="col-1"></div>
        <div className="col-6 btn-group" role="group">
          <button type="button" className={passCounter === 0 ? 'btn btn-success' : 'btn btn-success disabled'} onClick={e => handleSubmit("PASSED", e)}>
            Passed &nbsp;<span className="badge badge-light text-dark">{stats.PASSED}</span>
          </button>
          <button type="button" className={failCounter === 0 ? 'btn btn-danger' : 'btn btn-danger disabled'} onClick={e => handleSubmit(LAUNCH_STATUS.FAILED, e)}>
            Fail &nbsp;<span className="badge badge-light text-dark">{stats.FAILED}</span>
          </button>
          <button type="button" className={brokenCounter === 0 ? 'btn btn-warning' : 'btn btn-warning disabled'} onClick={e => handleSubmit(LAUNCH_STATUS.BROKEN, e)}>
            Broken &nbsp;<span className="badge badge-light text-dark">{stats.BROKEN}</span>
          </button>
          <button type="button" className={notRunCounter === 0 ? 'btn btn-secondary' : 'btn btn-secondary disabled'} onClick={e => handleSubmit(LAUNCH_STATUS.RUNNABLE, e)}>
            Not Run &nbsp;<span className="badge badge-light text-dark">{notRun}</span>
          </button>
        </div>
      </div>
      <ControlledPopup popupMessage={errorMessage} />
      <div>Number of Testcases : <span style={{ fontWeight: "bold" }}>{count}</span></div>
      <br />
      <div className="sweet-loading"><FadeLoader size={100} color={"#135f38"} loading={loading} /></div>
      <div className="grid_container">
        <div className="tree-side"><div id="tree"></div></div>
        <div id="testCase" className="testcase-side">
          {selectedTestCase && selectedTestCase.uuid && (
            <TestCase
              testcase={selectedTestCase}
              projectAttributes={projectAttributes}
              readonly={true}
              launchId={launchId}
              projectId={project}
              callback={onTestcaseStateChanged}
            />
          )}
          {(!selectedTestCase || !selectedTestCase.uuid) && (
            <div>
              {launch.launchGroup && (
                <div className="launch-summary-block">
                  <Link to={"/" + project + "/launches?launchGroup=" + launch.launchGroup}>View Launch Group</Link>
                </div>
              )}
              {(launch.testSuite || {}).id && (
                <div className="launch-summary-block">
                  <div>Test Suite:</div>
                  <Link to={"/" + project + "/testcases?testSuite=" + launch.testSuite.id}>{launch.testSuite.name}</Link>
                </div>
              )}
              <div className="launch-summary-block">
                <div>Created at: {Utils.timeToDate(launch.createdTime)}</div>
                <div>Started at: {Utils.timeToDate(launch.startTime)}</div>
                <div>Finished at: {Utils.timeToDate(launch.finishTime)}</div>
              </div>
              {typeof launch !== 'undefined' && (
                <div className="progress launch-summary-block">
                  <div className="progress-bar progress-bar-striped" role="progressbar" style={Utils.getProgressBarStyle(stats.RUNNING, launch.launchStats.total)}>
                    {Utils.getProgressBarNumber(stats.RUNNING, launch.launchStats.total)}
                  </div>
                  <div className="progress-bar bg-success" role="progressbar" style={Utils.getProgressBarStyle(stats.PASSED, launch.launchStats.total)}>
                    {Utils.getProgressBarNumber(stats.PASSED, launch.launchStats.total)}
                  </div>
                  <div className="progress-bar bg-danger" role="progressbar" style={Utils.getProgressBarStyle(stats.FAILED, launch.launchStats.total)}>
                    {Utils.getProgressBarNumber(stats.FAILED, launch.launchStats.total)}
                  </div>
                  <div className="progress-bar bg-warning" role="progressbar" style={Utils.getProgressBarStyle(stats.BROKEN, launch.launchStats.total)}>
                    {Utils.getProgressBarNumber(stats.BROKEN, launch.launchStats.total)}
                  </div>
                </div>
              )}
              <div className="restart-launch-control">
                <button type="button" className="btn btn-primary" onClick={e => onLaunchRestart(false, e)}>Restart All</button>
                <button type="button" className="btn btn-danger" onClick={e => onLaunchRestart(true, e)}>Restart Failed</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="modal fade" id="restart-launch-modal" tabIndex="-1" role="dialog" aria-hidden="true">
        <LaunchForm launch={launch} restart={true} failedOnly={restartFailedOnly} modalName="restart-launch-modal" />
      </div>
    </div>
  );
}

export default withRouter(Launch);

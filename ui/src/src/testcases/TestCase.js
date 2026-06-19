/*unc eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable eqeqeq */
import React, { useState, useEffect, useRef, useMemo } from "react";
import Attachments from "../testcases/Attachments";
import Results from "../testcases/Results";
import Comments from "../comments/Comments";
import EventsWidget from "../audit/EventsWidget";
import { Link } from "react-router-dom";
import { withRouter } from "../common/withRouter";
import $ from "jquery";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt } from "../common/icons";
import { faMinusCircle } from "../common/icons";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import CreatableSelect from "react-select/creatable";
import * as Utils from "../common/Utils";
import ControlledPopup from "../common/ControlledPopup";
import { FadeLoader } from "react-spinners";
import { faPlug } from "@fortawesome/free-solid-svg-icons";
import { Checkbox } from "semantic-ui-react";
import { ConfirmButton } from "../common/uicomponents/ConfirmButton";
import { Editor } from "@tinymce/tinymce-react";
import Backend from "../services/backend";
import LaunchTestcaseControls from "../launches/LaunchTestcaseControls";

const tinymcePlugins =
  "advlist autolink lists link image charmap preview anchor searchreplace visualblocks code table fullscreen insertdatetime media codesample help wordcount";

const tinymceToolbar =
  "undo redo | formatselect | bold italic forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | table | codesample | help";
const tinymceContentStyle = "p {margin: 0}";

const emptyTestcase = () => ({
  id: null,
  importedName: "",
  description: "",
  steps: [],
  attributes: {},
  attachments: [],
  results: [],
  comments: [],
  properties: [],
  broken: false,
  locked: false,
  displayErrorMessage: "",
});

function TestCase({
  testcase: testcaseProp,
  testcaseId,
  projectId: projectIdProp,
  match,
  onProjectChange,
  onSessionChange,
  launchId: launchIdProp,
  testDeveloper: testDeveloperProp,
  readonly: readonlyProp,
  callback,
  projectAttributes: projectAttrsProp,
}) {
  // Determine projectId from multiple sources
  const projectId = projectIdProp || match?.params?.project;

  const [testcase, setTestcase] = useState(testcaseProp || emptyTestcase());
  const [originalTestcase, setOriginalTestcase] = useState({ steps: [], attributes: {} });
  const [projectAttributes, setProjectAttributes] = useState(projectAttrsProp || []);
  const [attributesInEdit, setAttributesInEdit] = useState(new Set());
  const [, setPropertiesInEdit] = useState(new Set());
  const [session, setSession] = useState({ person: {} });
  const [readonly, setReadonly] = useState(readonlyProp || false);
  const [testDeveloper, setTestDeveloper] = useState(testDeveloperProp || false);
  const [loading, setLoading] = useState(true);
  const [commentsCount, setCommentsCount] = useState(0);
  const [launchId, setLaunchId] = useState(launchIdProp);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState("main");

  const historyFilter = useMemo(
    () => ({
      skip: 0,
      limit: 10,
      orderby: "id",
      orderdir: "DESC",
      entityType: "TestCase",
      entityId: testcase.id,
      eventType: ["PASSED", "FAILED", "BROKEN", "UPDATED"],
    }),
    [testcase.id],
  );

  // Keep a ref to projectId for use in callbacks
  const projectIdRef = useRef(projectId);
  useEffect(() => {
    projectIdRef.current = projectId;
  }, [projectId]);

  // TinyMCE editor instances — used to reset content on cancel without React re-renders
  const editorInstances = useRef({});

  function getSession() {
    Backend.get("user/session")
      .then(response => {
        setSession(response);
      })
      .catch(() => console.log("Unable to fetch session"));
  }

  function getAttributes() {
    if (!projectIdRef.current) return;
    Backend.get(projectIdRef.current + "/attribute")
      .then(response => {
        setProjectAttributes(response.filter(p => p.type != "undefined").filter(p => p.type != "LAUNCH"));
      })
      .catch(() => setErrorMessage("Couldn't fetch attributes"));
  }

  function getTestCase(pid, tcId) {
    if (!pid || !tcId) return;
    Backend.get(pid + "/testcase/" + tcId)
      .then(response => {
        setTestcase(response);
        setOriginalTestcase(JSON.parse(JSON.stringify(response)));
        setAttributesInEdit(new Set());
        setPropertiesInEdit(new Set());
        setLoading(false);
      })
      .catch(() => {
        setErrorMessage("Couldn't fetch testcase");
        setLoading(false);
      });
  }

  // One-time init: session, attributes, flags
  useEffect(() => {
    if (readonlyProp) setReadonly(true);
    if (testDeveloperProp) setTestDeveloper(true);
    if (launchIdProp) setLaunchId(launchIdProp);
    getSession();
    getAttributes();
    // One-time init (former componentDidMount); prop flags are read once on mount intentionally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset to the Main tab only when navigating to a *different* testcase.
  // Keyed on the stable id (not the object reference) so a refresh of the
  // same testcase — e.g. after a launch status change — doesn't snap the
  // active tab back to Main.
  const activeTestcaseKey = testcaseProp?.uuid ?? testcaseProp?.id ?? testcaseId ?? match?.params?.testcase;
  useEffect(() => {
    setActiveTab("main");
  }, [activeTestcaseKey]);

  // Load testcase whenever testcaseId or testcaseProp changes (also fires on initial mount)
  useEffect(() => {
    if (testcaseProp) {
      setTestcase(testcaseProp);
      setLoading(false);
      setTestDeveloper(testDeveloperProp || false);
    } else if (testcaseId) {
      getTestCase(projectId, testcaseId);
    } else {
      const routeTcId = match?.params?.testcase;
      const routePid = projectIdRef.current || match?.params?.project;
      if (routeTcId) getTestCase(routePid, routeTcId);
    }
    // Keyed on testcaseProp/testcaseId; route params are read via refs/fallbacks, not deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testcaseProp, testcaseId]);

  useEffect(() => {
    if (projectAttrsProp) setProjectAttributes(projectAttrsProp);
  }, [projectAttrsProp]);

  // Apply role-based readonly when session loads (locked testcase enforcement is server-side)
  useEffect(() => {
    const roles = session.person?.roles && session.person.roles.length > 0 ? session.person.roles : [];
    if (roles.length === 0) return; // session not loaded yet
    const isTester = roles.some(r => r.includes("TESTER"));
    const isObserverOnly = roles.some(r => r.includes("OBSERVERONLY"));
    const isTestDeveloper = roles.some(r => r.includes("TESTDEVELOPER"));
    setTestDeveloper(isTestDeveloper);
    if (isTester || isObserverOnly) {
      setReadonly(true);
    } else if (isTestDeveloper) {
      setReadonly(false);
    }
  }, [session]);

  useEffect(() => {
    if (launchIdProp) setLaunchId(launchIdProp);
  }, [launchIdProp]);

  function onTestcaseUpdated() {
    const pid = projectIdRef.current;
    const tcId = testcaseId || match?.params?.testcase;
    if (pid && tcId) {
      getTestCase(pid, tcId);
      getAttributes();
    }
  }

  // jQuery-based in-place edit toggle (same as original)
  function toggleEdit(fieldName, event, index) {
    var fieldId = fieldName;
    if (index !== undefined) fieldId = fieldId + "-" + index;
    if ($("#" + fieldId + "-display").offsetParent !== null) {
      setOriginalTestcase(prev => {
        const updated = { ...prev };
        if (index !== undefined) {
          updated[fieldName] = [...(updated[fieldName] || [])];
          updated[fieldName][index] = JSON.parse(JSON.stringify((testcase[fieldName] || [])[index] || ""));
        } else {
          updated[fieldName] = JSON.parse(JSON.stringify(testcase[fieldName] || ""));
        }
        return updated;
      });
    }
    $("#" + fieldId + "-display").toggle();
    $("#" + fieldId + "-form").toggle();
    if (event) event.preventDefault();
  }

  function handleChange(fieldName, event, index, arrObjectKey, skipStateRefresh) {
    setTestcase(prev => {
      const updated = { ...prev };
      if (index != undefined) {
        updated[fieldName] = [...(updated[fieldName] || [])];
        if (arrObjectKey) {
          updated[fieldName][index] = { ...updated[fieldName][index], [arrObjectKey]: event.target.value };
        } else {
          updated[fieldName][index] = event.target.value;
        }
      } else {
        updated[fieldName] = event.target.value;
      }
      return updated;
    });
  }

  function cancelEdit(fieldName, event, index) {
    setTestcase(prev => {
      const updated = { ...prev };
      if (index != undefined) {
        updated[fieldName] = [...(updated[fieldName] || [])];
        updated[fieldName][index] = originalTestcase[fieldName]?.[index];
      } else {
        updated[fieldName] = originalTestcase[fieldName];
      }
      return updated;
    });
    // Reset TinyMCE editor content so it shows the original value next time
    if (index != undefined) {
      const actionKey = "step-action-" + index;
      const expKey = "step-exp-" + index;
      if (editorInstances.current[actionKey])
        editorInstances.current[actionKey].setContent(originalTestcase[fieldName]?.[index]?.action || "");
      if (editorInstances.current[expKey])
        editorInstances.current[expKey].setContent(originalTestcase[fieldName]?.[index]?.expectation || "");
    } else {
      if (editorInstances.current[fieldName])
        editorInstances.current[fieldName].setContent(originalTestcase[fieldName] || "");
    }
    toggleEdit(fieldName, event, index);
  }

  function handleSubmit(fieldName, event, index, ignoreToggleEdit) {
    const pid = projectIdRef.current;
    // Read latest content from TinyMCE editor instances before saving
    let tcToSave = { ...testcase };
    if (index != undefined) {
      // Read the editor's live content via getContent(). This reflects programmatic input
      // (Selenium SendKeys), which TinyMCE's onEditorChange does NOT fire for. Fall back to
      // whatever is already in state, and never persist undefined (which rendered as the
      // literal "Step undefined").
      const actionEditor = editorInstances.current["step-action-" + index];
      const expEditor = editorInstances.current["step-exp-" + index];
      const steps = [...(testcase.steps || [])];
      steps[index] = {
        ...steps[index],
        action: actionEditor ? actionEditor.getContent() : steps[index]?.action || "",
        expectation: expEditor ? expEditor.getContent() : steps[index]?.expectation || "",
        _new: undefined,
      };
      tcToSave = { ...tcToSave, steps };
    } else if (editorInstances.current[fieldName]) {
      // Description or preconditions editor
      tcToSave = { ...tcToSave, [fieldName]: editorInstances.current[fieldName].getContent() };
    }
    Backend.put(pid + "/testcase/", tcToSave)
      .then(response => {
        setTestcase(response);
        setOriginalTestcase(JSON.parse(JSON.stringify(response)));
        setAttributesInEdit(new Set());
        setPropertiesInEdit(new Set());
        getAttributes();
        if (!ignoreToggleEdit) toggleEdit(fieldName, event, index);
      })
      .catch(() => setErrorMessage("Couldn't save testcase"));
    if (event) event.preventDefault();
  }

  function getAttributeName(id) {
    return Utils.getProjectAttribute(projectAttributes, id).name || "";
  }

  function getAttributeValues(id) {
    return Utils.getProjectAttribute(projectAttributes, id).attrValues || [];
  }

  function getAttributeKeysToAdd() {
    return (projectAttributes || [])
      .filter(a => !Object.keys(testcase.attributes || {}).includes(a.id))
      .filter(a => a.id !== "broken")
      .map(a => ({ value: a.id, label: a.name }));
  }

  function editAttributeValues(key, values) {
    setOriginalTestcase(prev => ({
      ...prev,
      attributes: { ...prev.attributes, [key]: (testcase.attributes || {})[key] },
    }));
    setTestcase(prev => ({ ...prev, attributes: { ...prev.attributes, [key]: (values || []).map(v => v.value) } }));
  }

  function cancelEditAttributeValues(event, key) {
    setTestcase(prev => ({ ...prev, attributes: { ...prev.attributes, [key]: originalTestcase.attributes?.[key] } }));
    setAttributesInEdit(prev => {
      const s = new Set(prev);
      s.delete(key);
      return s;
    });
    toggleEdit("attributes", event, key);
  }

  function cancelEditAttributeKey(event, key) {
    setTestcase(prev => {
      const attrs = { ...prev.attributes };
      if (!attrs[key] || attrs[key].length === 0) delete attrs[key];
      return { ...prev, attributes: attrs };
    });
    setAttributesInEdit(prev => {
      const s = new Set(prev);
      s.delete(key);
      return s;
    });
  }

  function removeAttribute(key, event) {
    setTestcase(prev => {
      const attrs = { ...prev.attributes };
      delete attrs[key];
      return { ...prev, attributes: attrs };
    });
    setAttributesInEdit(prev => {
      const s = new Set(prev);
      s.delete(key);
      return s;
    });
    // Submit happens after state update — use current testcase minus this attribute
    const pid = projectIdRef.current;
    const updated = { ...testcase, attributes: { ...testcase.attributes } };
    delete updated.attributes[key];
    Backend.put(pid + "/testcase/", updated).catch(() => setErrorMessage("Couldn't save testcase"));
    if (event) event.preventDefault();
  }

  function addAttribute(event) {
    setTestcase(prev => ({ ...prev, attributes: { ...prev.attributes, [null]: [] } }));
    setAttributesInEdit(prev => {
      const s = new Set(prev);
      s.add(null);
      return s;
    });
  }

  function editAttributeKey(key, data, reRender) {
    setProjectAttributes(prev => {
      if (!prev.find(a => a.id === data.value)) return [...prev, { id: data.value, name: data.value }];
      return prev;
    });
    setAttributesInEdit(prev => {
      const s = new Set(prev);
      s.delete(key);
      s.add(data.value);
      return s;
    });
    setTestcase(prev => {
      const attrs = { ...prev.attributes, [data.value]: prev.attributes[key] };
      delete attrs[key];
      return { ...prev, attributes: attrs };
    });
  }

  function toggleEditAttribute(attributeId) {
    setAttributesInEdit(prev => {
      const s = new Set(prev);
      s.add(attributeId);
      return s;
    });
  }

  function handleStepActionChange(index, value) {
    setTestcase(prev => {
      const steps = [...(prev.steps || [])];
      steps[index] = { ...steps[index], action: value };
      return { ...prev, steps };
    });
  }

  function handleStepExpectationChange(index, value) {
    setTestcase(prev => {
      const steps = [...(prev.steps || [])];
      steps[index] = { ...steps[index], expectation: value };
      return { ...prev, steps };
    });
  }

  function addStep() {
    setTestcase(prev => {
      const steps = prev.steps || [];
      // Ignore repeat activations while a blank/unsaved step is already open. Under
      // automation, SendKeys text (which contains spaces) can land on the still-focused
      // "Add Step" button and activate it once per Space, adding a pile of blank steps.
      if (steps.length > 0 && steps[steps.length - 1] && steps[steps.length - 1]._new) return prev;
      return { ...prev, steps: [...steps, { _new: true }] };
    });
  }

  function removeStep(event, index) {
    const updated = { ...testcase, steps: testcase.steps.filter((_, i) => i !== index) };
    setTestcase(updated);
    Backend.put(projectIdRef.current + "/testcase/", updated).catch(() => setErrorMessage("Couldn't save testcase"));
    if (event) event.preventDefault();
  }

  function removeTestcase() {
    Backend.delete(projectIdRef.current + "/testcase/" + testcase.id)
      .then(() => {
        window.location.href = window.location.href.replace("testcase=" + testcase.id, "");
      })
      .catch(() => setErrorMessage("Couldn't remove testcase"));
  }

  function lockTestcase() {
    Backend.post(projectIdRef.current + "/testcase/" + testcase.id + "/lock")
      .then(() => {
        window.location.href = window.location.href.replace("testcase=" + testcase.id, "");
      })
      .catch(() => setErrorMessage("Couldn't lock testcase"));
  }

  function unlockTestcase() {
    Backend.post(projectIdRef.current + "/testcase/" + testcase.id + "/unlock")
      .then(() => {
        window.location.href = window.location.href.replace("testcase=" + testcase.id, "");
      })
      .catch(() => setErrorMessage("Couldn't unlock testcase"));
  }

  function cloneTestCase() {
    Backend.post(projectIdRef.current + "/testcase/" + testcase.id + "/clone")
      .then(response => {
        window.location.href = window.location.href.replace("testcase=" + testcase.id, "testcase=" + response.id);
      })
      .catch(() => setErrorMessage("Couldn't clone testcase"));
  }

  function onBrokenToggle() {
    const updated = { ...testcase, broken: !testcase.broken };
    setTestcase(updated);
    Backend.put(projectIdRef.current + "/testcase/", updated).catch(() => setErrorMessage("Couldn't save testcase"));
  }

  function handleOnClickToSelectText() {
    var text = window.getSelection();
    if (text.rangeCount > 0) {
      var mark = document.createElement("span");
      mark.style.color = "blue";
      mark.style.fontWeight = "bold";
      var selectionRange = text.getRangeAt(0);
      mark.appendChild(selectionRange.extractContents());
      selectionRange.insertNode(mark);
    }
  }

  return (
    <div>
      <ControlledPopup popupMessage={errorMessage} />
      <ul className="nav nav-tabs" id="tcTabs" role="tablist">
        <li
          className="nav-item"
          onClick={e => {
            e.preventDefault();
            setActiveTab("main");
          }}
        >
          <a
            className={`nav-link${activeTab === "main" ? " active" : ""}`}
            id="main-tab"
            href="#"
            role="tab"
            aria-controls="home"
            aria-selected={activeTab === "main"}
          >
            Main
          </a>
        </li>
        {testcase.failureDetails && Object.keys(testcase.failureDetails).length > 0 && (
          <li
            className="nav-item"
            onClick={e => {
              e.preventDefault();
              setActiveTab("failure");
            }}
          >
            <a className={`nav-link${activeTab === "failure" ? " active" : ""}`} id="failure-tab" href="#" role="tab">
              Failure
            </a>
          </li>
        )}
        {!launchId && (
          <li
            className="nav-item"
            onClick={e => {
              e.preventDefault();
              setActiveTab("attachments");
            }}
          >
            <a
              className={`nav-link${activeTab === "attachments" ? " active" : ""}`}
              id="attachments-tab"
              href="#"
              role="tab"
            >
              Attachments
              {testcase.attachments && testcase.attachments.length > 0 && (
                <span className="badge badge-pill badge-secondary tab-badge">{testcase.attachments.length}</span>
              )}
            </a>
          </li>
        )}
        {launchId && (
          <li
            className="nav-item"
            onClick={e => {
              e.preventDefault();
              setActiveTab("results");
            }}
          >
            <a className={`nav-link${activeTab === "results" ? " active" : ""}`} id="results-tab" href="#" role="tab">
              Results
              {testcase.results && testcase.results.length > 0 && (
                <span className="badge badge-pill badge-secondary tab-badge">{testcase.results.length}</span>
              )}
            </a>
          </li>
        )}
        {launchId && (
          <li
            className="nav-item"
            onClick={e => {
              e.preventDefault();
              setActiveTab("comments");
            }}
          >
            <a className={`nav-link${activeTab === "comments" ? " active" : ""}`} id="comments-tab" href="#" role="tab">
              Comments
              {commentsCount > 0 && <span className="badge badge-pill badge-secondary tab-badge">{commentsCount}</span>}
            </a>
          </li>
        )}
        {testcase.metaData && Object.keys(testcase.metaData).length > 0 && (
          <li
            className="nav-item"
            onClick={e => {
              e.preventDefault();
              setActiveTab("metadata");
            }}
          >
            <a className={`nav-link${activeTab === "metadata" ? " active" : ""}`} id="metadata-tab" href="#" role="tab">
              Metadata
            </a>
          </li>
        )}
        <li
          className="nav-item"
          onClick={e => {
            e.preventDefault();
            setActiveTab("history");
          }}
        >
          <a className={`nav-link${activeTab === "history" ? " active" : ""}`} id="history-tab" href="#" role="tab">
            History
          </a>
        </li>
      </ul>

      <div className="tab-content" id="tcTabContent">
        <div className="sweet-loading">
          <FadeLoader size={100} color={"#135f38"} loading={loading} />
        </div>

        <div
          className={`tab-pane fade${activeTab === "main" ? " show active" : ""}`}
          id="main"
          role="tabpanel"
          aria-labelledby="main-tab"
        >
          <div id="name" className="testcase-section">
            <div id="name-display" className="inplace-display row">
              <div className="col-9">
                <h1>
                  <em>
                    <span className="testcase-id-in-title text-muted">{testcase.id}</span>
                  </em>
                  <Link to={"/" + projectId + "/testcase/" + testcase.id}>
                    {testcase.name || testcase.importedName || ""}
                  </Link>
                  <span className="name-icon">{testcase.automated && <FontAwesomeIcon icon={faPlug} />}</span>
                  {!readonly && (
                    <span className="edit edit-icon clickable" onClick={e => toggleEdit("name", e)}>
                      <FontAwesomeIcon icon={faPencilAlt} />
                    </span>
                  )}
                </h1>
              </div>
              {!readonly && (
                <div className="col-1">
                  <div className="dropdown">
                    <span
                      className="dropdown-toggle clickable"
                      href="#"
                      role="button"
                      id="dropdownMenuLink"
                      data-toggle="dropdown"
                      aria-haspopup="true"
                      aria-expanded="false"
                    >
                      <FontAwesomeIcon icon={faBars} />
                    </span>
                    <div className="dropdown-menu" aria-labelledby="dropdownMenuLink">
                      <a className="dropdown-item" href="#" onClick={() => cloneTestCase()}>
                        Clone
                      </a>
                    </div>
                  </div>
                </div>
              )}
              {!readonly && testcase.launchStatus !== undefined && (
                <div className="col-2">
                  <Checkbox
                    toggle
                    onChange={onBrokenToggle}
                    checked={testcase.broken}
                    label={{ children: testcase.broken ? "On" : "Off" }}
                  />
                </div>
              )}
            </div>
            {!readonly && (
              <div id="name-form" className="inplace-form" style={{ display: "none" }}>
                <form>
                  <div className="form-group row">
                    <div className="col-8">
                      <input
                        type="text"
                        name="name"
                        className="form-control"
                        onChange={e => handleChange("name", e)}
                        value={testcase.name || testcase.importedName}
                      />
                    </div>
                    <div className="col-4">
                      <button type="button" className="btn btn-light" onClick={e => cancelEdit("name", e)}>
                        Cancel
                      </button>
                      <button type="button" className="btn btn-primary" onClick={e => handleSubmit("name", e)}>
                        Save
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Description */}
          <div id="description" className="card mb-4">
            <div className="card-header">
              <h5>
                Description
                {!readonly && (
                  <span className="edit edit-icon clickable" onClick={e => toggleEdit("description", e)}>
                    <FontAwesomeIcon icon={faPencilAlt} />
                  </span>
                )}
              </h5>
            </div>
            <div className="card-body">
              <div
                id="description-display"
                className="inplace-display"
                dangerouslySetInnerHTML={{ __html: testcase.description }}
              />
              {!readonly && (
                <div id="description-form" className="inplace-form" style={{ display: "none" }}>
                  <Editor
                    key={testcase.id + "-description"}
                    tinymceScriptSrc="/tinymce/tinymce.min.js"
                    initialValue={testcase.description}
                    onInit={(evt, editor) => {
                      editorInstances.current["description"] = editor;
                    }}
                    init={{
                      height: 500,
                      menubar: false,
                      plugins: tinymcePlugins,
                      toolbar: tinymceToolbar,
                      content_style: tinymceContentStyle,
                    }}
                    onEditorChange={() => {}}
                  />
                  <form>
                    <div className="testcase-inplace-buttons-down">
                      <button type="button" className="btn btn-light" onClick={e => cancelEdit("description", e)}>
                        Cancel
                      </button>
                      <button type="button" className="btn btn-primary" onClick={e => handleSubmit("description", e)}>
                        Save
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Preconditions */}
          <div id="preconditions" className="card mb-4">
            <div className="card-header">
              <h5>
                Preconditions
                {!readonly && (
                  <span className="edit edit-icon clickable" onClick={e => toggleEdit("preconditions", e)}>
                    <FontAwesomeIcon icon={faPencilAlt} />
                  </span>
                )}
              </h5>
            </div>
            <div className="card-body">
              <div
                id="preconditions-display"
                className="inplace-display"
                dangerouslySetInnerHTML={{ __html: testcase.preconditions }}
              />
              {!readonly && (
                <div id="preconditions-form" className="inplace-form" style={{ display: "none" }}>
                  <Editor
                    key={testcase.id + "-preconditions"}
                    tinymceScriptSrc="/tinymce/tinymce.min.js"
                    initialValue={testcase.preconditions}
                    onInit={(evt, editor) => {
                      editorInstances.current["preconditions"] = editor;
                    }}
                    init={{
                      height: 500,
                      menubar: false,
                      plugins: tinymcePlugins,
                      toolbar: tinymceToolbar,
                      content_style: tinymceContentStyle,
                    }}
                    onEditorChange={() => {}}
                  />
                  <form>
                    <div className="testcase-inplace-buttons-down">
                      <button type="button" className="btn btn-light" onClick={e => cancelEdit("preconditions", e)}>
                        Cancel
                      </button>
                      <button type="button" className="btn btn-primary" onClick={e => handleSubmit("preconditions", e)}>
                        Save
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Steps */}
          <div id="steps" className="mb-4">
            <LaunchTestcaseControls
              testcase={testcase}
              launchId={launchId}
              projectId={projectId}
              callback={callback}
              indicator={"START"}
            />
            <h5>Steps</h5>
            {(testcase.steps || []).map((step, i) => {
              if (!step || step._new) {
                return (
                  <div className="step" key={i}>
                    <div id={"steps-" + i + "-form"} className="inplace-form card">
                      <div className="card-header">{i + 1}. Step</div>
                      <div className="card-body">
                        <p className="card-text">
                          <Editor
                            key={testcase.id + "-step-" + i + "-action"}
                            tinymceScriptSrc="/tinymce/tinymce.min.js"
                            initialValue={step.action}
                            onInit={(evt, editor) => {
                              editorInstances.current["step-action-" + i] = editor;
                            }}
                            init={{
                              height: 300,
                              menubar: false,
                              plugins: tinymcePlugins,
                              toolbar: tinymceToolbar,
                              content_style: tinymceContentStyle,
                            }}
                            onEditorChange={content => handleStepActionChange(i, content)}
                          />
                        </p>
                        <h6 className="card-subtitle mb-2 text-muted">Expectations</h6>
                        <p className="card-text">
                          <Editor
                            key={testcase.id + "-step-" + i + "-exp"}
                            tinymceScriptSrc="/tinymce/tinymce.min.js"
                            initialValue={step.expectation}
                            onInit={(evt, editor) => {
                              editorInstances.current["step-exp-" + i] = editor;
                            }}
                            init={{
                              height: 300,
                              menubar: false,
                              plugins: tinymcePlugins,
                              toolbar: tinymceToolbar,
                              content_style: tinymceContentStyle,
                            }}
                            onEditorChange={content => handleStepExpectationChange(i, content)}
                          />
                        </p>
                        <button type="button" className="btn btn-light" onClick={e => removeStep(e, i)}>
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={e => handleSubmit("steps", e, i, true)}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={i}>
                    <div id={"steps-" + i + "-display"} className="inplace-display col-sm-12">
                      <div className="row">
                        <div className="card col-md-12">
                          <div className="card-body">
                            {testcase.launchStatus && testcase.launchStatus.includes("RUNNING") ? (
                              <div className="card-text">
                                <div
                                  onClick={handleOnClickToSelectText}
                                  dangerouslySetInnerHTML={{
                                    __html: "<b><i>" + (i + 1) + ". Step </i></b>" + step.action,
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="card-text">
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html: "<b><i>" + (i + 1) + ". Step </i></b>" + step.action,
                                  }}
                                />
                              </div>
                            )}
                            <h6 className="card-subtitle mb-2 expectations">
                              <b>
                                <i>Expectations</i>
                              </b>
                            </h6>
                            <div className="card-text" dangerouslySetInnerHTML={{ __html: step.expectation }} />
                            {!readonly && (
                              <div className="row">
                                <div className="col-md-10"></div>
                                <div className="col-md-1">
                                  <a href="#" className="card-link" onClick={e => toggleEdit("steps", e, i)}>
                                    Edit
                                  </a>
                                </div>
                                <div className="col-md-1">
                                  <ConfirmButton
                                    onSubmit={removeStep}
                                    buttonClass={"card-link red float-right"}
                                    id={i}
                                    modalText={"Are you sure you want to remove Test Step?"}
                                    buttonText={"Remove"}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {!readonly && (
                      <div
                        id={"steps-" + i + "-form"}
                        className="inplace-form card col-md-12"
                        style={{ display: "none" }}
                      >
                        <div className="card-body">
                          <h6 className="card-subtitle mb-2 text-muted">{i + 1}. Step</h6>
                          <p className="card-text">
                            <Editor
                              key={testcase.id + "-step-" + i + "-action-edit"}
                              tinymceScriptSrc="/tinymce/tinymce.min.js"
                              initialValue={step.action}
                              onInit={(evt, editor) => {
                                editorInstances.current["step-action-" + i] = editor;
                              }}
                              init={{
                                height: 300,
                                menubar: false,
                                plugins: tinymcePlugins,
                                toolbar: tinymceToolbar,
                                content_style: tinymceContentStyle,
                              }}
                              onEditorChange={content => handleStepActionChange(i, content)}
                            />
                          </p>
                          <h6 className="card-subtitle mb-2 text-muted">Expectations</h6>
                          <p className="card-text">
                            <Editor
                              key={testcase.id + "-step-" + i + "-exp-edit"}
                              tinymceScriptSrc="/tinymce/tinymce.min.js"
                              initialValue={step.expectation}
                              onInit={(evt, editor) => {
                                editorInstances.current["step-exp-" + i] = editor;
                              }}
                              init={{
                                height: 300,
                                menubar: false,
                                plugins: tinymcePlugins,
                                toolbar: tinymceToolbar,
                                content_style: tinymceContentStyle,
                              }}
                              onEditorChange={content => handleStepExpectationChange(i, content)}
                            />
                          </p>
                          <button type="button" className="btn btn-light" onClick={e => cancelEdit("steps", e, i)}>
                            Cancel
                          </button>
                          <button type="button" className="btn btn-primary" onClick={e => handleSubmit("steps", e, i)}>
                            Save
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
            })}
            {!readonly && (
              <div>
                <button type="button" className="btn btn-primary" onClick={addStep}>
                  Add Step
                </button>
              </div>
            )}
          </div>

          <LaunchTestcaseControls
            testcase={testcase}
            launchId={launchId}
            projectId={projectId}
            callback={callback}
            indicator={"FAILUREDETAILS"}
          />

          {/* Attributes */}
          <div id="attributes" className="mb-4">
            <h5>Attributes</h5>
            {Object.keys(testcase.attributes || {}).map((attributeId, i) => {
              const attributeValues = testcase.attributes[attributeId] || [];
              if (attributeId && attributeId != "null") {
                return (
                  <div key={i} className="form-group attribute-block">
                    <div
                      id={"attributes-" + attributeId + "-display"}
                      className="inplace-display"
                      style={{ display: attributesInEdit.has(attributeId) ? "none" : "block" }}
                    >
                      <div className="card">
                        <div className="card-header">
                          <b>
                            {getAttributeName(attributeId)}
                            {!readonly && (
                              <span
                                className="edit edit-icon clickable"
                                onClick={() => toggleEditAttribute(attributeId)}
                              >
                                <FontAwesomeIcon icon={faPencilAlt} />
                              </span>
                            )}
                            {!readonly && (
                              <span className="clickable edit-icon red" onClick={e => removeAttribute(attributeId, e)}>
                                <FontAwesomeIcon icon={faMinusCircle} />
                              </span>
                            )}
                          </b>
                        </div>
                        <div className="card-body">{attributeValues.join(", ")}</div>
                      </div>
                    </div>
                    {!readonly && (
                      <div
                        id={"attributes-" + attributeId + "-form"}
                        className="inplace-form"
                        style={{ display: attributesInEdit.has(attributeId) ? "block" : "none" }}
                      >
                        <form>
                          <div className="card">
                            <div className="card-header">
                              <b>{getAttributeName(attributeId)}</b>
                            </div>
                            <div className="card-body">
                              <CreatableSelect
                                value={(attributeValues || []).map(val => ({ value: val, label: val }))}
                                isMulti
                                isClearable
                                onChange={e => editAttributeValues(attributeId, e)}
                                options={getAttributeValues(attributeId).map(av => ({
                                  value: av.value,
                                  label: av.value,
                                }))}
                              />
                              <button
                                type="button"
                                className="btn btn-light"
                                onClick={e => cancelEditAttributeValues(e, attributeId)}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                className="btn btn-primary"
                                onClick={e => handleSubmit("attributes", e, attributeId, true)}
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                );
              } else {
                return (
                  <div key={i} className="form-group attribute-block">
                    <div id={"attributes-" + attributeId + "-form"} className="inplace-form">
                      <div className="card">
                        <div className="card-header">
                          <CreatableSelect
                            onChange={e => editAttributeKey(attributeId, e, true)}
                            options={getAttributeKeysToAdd()}
                          />
                          <button
                            type="button"
                            className="btn btn-light"
                            onClick={e => cancelEditAttributeKey(e, attributeId)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            })}
            {!readonly && Utils.isAdmin(session) && (
              <div>
                <button type="button" className="btn btn-primary" onClick={addAttribute}>
                  Add Attribute
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Failure tab */}
        <div className={`tab-pane fade${activeTab === "failure" ? " show active" : ""}`} id="failure" role="tabpanel">
          {testcase.failureDetails && Object.keys(testcase.failureDetails).length > 0 && (
            <div className="testcase-section">
              <h5>Failure Details</h5>
              <div>{testcase.failureDetails.text}</div>
            </div>
          )}
        </div>

        {/* Attachments tab */}
        {!launchId && (
          <div
            className={`tab-pane fade${activeTab === "attachments" ? " show active" : ""}`}
            id="attachments"
            role="tabpanel"
          >
            <Attachments
              testcase={testcase}
              projectId={projectId}
              onTestcaseUpdated={onTestcaseUpdated}
              readonly={readonly}
              testDeveloper={testDeveloper}
            />
          </div>
        )}

        {/* Results tab */}
        {launchId && (
          <div className={`tab-pane fade${activeTab === "results" ? " show active" : ""}`} id="results" role="tabpanel">
            <Results testcase={testcase} projectId={projectId} onTestcaseUpdated={onTestcaseUpdated} />
          </div>
        )}

        {/* Comments tab */}
        <div
          className={`tab-pane fade${activeTab === "comments" ? " show active" : ""}`}
          id="comments-tab-body"
          role="tabpanel"
        >
          {launchId && (
            <Comments
              entityId={launchId + "_" + testcase.id}
              projectId={projectId}
              entityType="launch"
              onCommentsNumberChanged={setCommentsCount}
            />
          )}
        </div>

        {/* Metadata tab */}
        <div className={`tab-pane fade${activeTab === "metadata" ? " show active" : ""}`} id="metadata" role="tabpanel">
          <dl>
            {Object.keys(testcase.metaData || {}).map(key => (
              <span key={key}>
                <dt>{key}</dt>
                <dd>{testcase.metaData[key]}</dd>
              </span>
            ))}
          </dl>
        </div>

        {/* History tab */}
        <div className={`tab-pane fade${activeTab === "history" ? " show active" : ""}`} id="history" role="tabpanel">
          <EventsWidget projectId={projectId} filter={historyFilter} />
        </div>
      </div>

      {/* Bottom action buttons */}
      <div className="row" style={{ position: "relative" }}>
        <div className="col-md-6"></div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", marginRight: "10px" }}>
          {!readonly && Utils.isAdmin(session) && !testcase.locked && (
            <div style={{ marginRight: "10px" }}>
              <ConfirmButton
                onSubmit={lockTestcase}
                buttonClass={"btn btn-danger"}
                id={"testcase-lock"}
                modalText={"Are you sure you want to lock this test case?"}
                buttonText={"Lock Testcase"}
              />
            </div>
          )}
          {!readonly && Utils.isAdmin(session) && testcase.locked && (
            <div style={{ marginRight: "10px" }}>
              <ConfirmButton
                onSubmit={unlockTestcase}
                buttonClass={"btn btn-danger"}
                id={"testcase-unlock"}
                modalText={"Are you sure you want to unlock this test case?"}
                buttonText={"Unlock Testcase"}
              />
            </div>
          )}
          {!readonly && (
            <ConfirmButton
              onSubmit={removeTestcase}
              buttonClass={"btn btn-danger"}
              id={"testcase-removal"}
              modalText={"Are you sure you want to remove the Test Case?"}
              buttonText={"Remove Testcase"}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default withRouter(TestCase);

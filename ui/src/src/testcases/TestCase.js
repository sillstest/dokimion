/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable eqeqeq */
import React, { useState, useEffect, useCallback } from "react";
import Attachments from "../testcases/Attachments";
import Results from "../testcases/Results";
import Comments from "../comments/Comments";
import EventsWidget from "../audit/EventsWidget";
import { Link, useParams } from "react-router-dom";
import { withRouter } from "../common/withRouter";
import $ from "jquery";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt, faMinusCircle, faBars, faPlug } from "@fortawesome/free-solid-svg-icons";
import CreatableSelect from "react-select/creatable";
import * as Utils from "../common/Utils";
import ControlledPopup from "../common/ControlledPopup";
import { FadeLoader } from "react-spinners";
import { Checkbox } from "@mui/material";
import { ConfirmButton } from "../common/uicomponents/ConfirmButton";
import { Editor } from "@tinymce/tinymce-react";
import Backend from "../services/backend";
import LaunchTestcaseControls from "../launches/LaunchTestcaseControls";

const TestCase = (props) => {
  const params = useParams();
  
  // TinyMCE configuration constants
  const tinymcePlugins = [
    "advlist autolink lists link image charmap print preview anchor",
    "searchreplace visualblocks code table fullscreen",
    "insertdatetime media table paste codesample help wordcount autosave",
  ];
  
  const tinymceToolbar =
    "undo redo | formatselect | " +
    "bold italic forecolor backcolor | alignleft aligncenter " +
    "alignright alignjustify | bullist numlist outdent indent | " +
    "removeformat | table | codesample | help";
  
  const tinymceContentStyle = "p {margin: 0}";

  // State management
  const [testcase, setTestcase] = useState({
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
  
  const [originalTestcase, setOriginalTestcase] = useState({
    steps: [],
    attributes: {},
  });
  
  const [projectAttributes, setProjectAttributes] = useState([]);
  const [readonly, setReadonly] = useState(props.readonly || false);
  const [testDeveloper, setTestDeveloper] = useState(props.testDeveloper || false);
  const [attributesInEdit, setAttributesInEdit] = useState(new Set());
  const [propertiesInEdit, setPropertiesInEdit] = useState(new Set());
  const [commentsCount, setCommentsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [session, setSession] = useState({ person: {} });
  const [projectId, setProjectId] = useState(props.projectId || params.project);
  const [launchId, setLaunchId] = useState(props.launchId);

  // Get session data
  const getSession = useCallback(() => {
    Backend.get("user/session")
      .then(response => {
        setSession(response);
        if (props.onSessionChange) {
          props.onSessionChange(response);
        }
      })
      .catch(() => {
        console.log("Unable to fetch session");
      });
  }, [props]);

  // Get attributes
  const getAttributes = useCallback(() => {
    if (!projectId) return;
    
    Backend.get(projectId + "/attribute")
      .then(response => {
        const filtered = response
          .filter(p => p.type != 'undefined')
          .filter(p => p.type != 'LAUNCH');
        setProjectAttributes(filtered);
      })
      .catch(error => {
        setErrorMessage("getAttributes::Couldn't fetch attributes");
      });
  }, [projectId]);

  // Get test case data
  const getTestCase = useCallback((projId, testcaseId) => {
    console.log("TestCase::getTestCase");

    Backend.get(projId + "/testcase/" + testcaseId)
      .then(response => {
        setTestcase(response);
        setOriginalTestcase(JSON.parse(JSON.stringify(response)));
        setAttributesInEdit(new Set());
        setPropertiesInEdit(new Set());
        setLoading(false);

        const roles = session.person.roles && session.person.roles.length > 0 
          ? session.person.roles : [];

        if (roles.length == 0) {
          setReadonly(true);
        } else {
          const isTester = roles.filter(val => val.includes('TESTER')).length > 0;
          const isObserverOnly = roles.filter(val => val.includes('OBSERVERONLY')).length > 0;
          const isTestDev = roles.filter(val => val.includes('TESTDEVELOPER')).length > 0;
          setTestDeveloper(isTestDev);

          if (isTester || isObserverOnly) {
            setReadonly(true);
          } else if (isTestDev && response.locked) {
            setReadonly(true);
          } else if (isTestDev) {
            setReadonly(false);
          } else {
            setReadonly(false);
          }
        }
      })
      .catch(error => {
        setErrorMessage("getTestCase::Couldn't fetch testcase");
        setLoading(false);
      });
  }, [session.person.roles]);

  // Initial load effect
  useEffect(() => {
    if (props.testcase) {
      setTestcase(props.testcase);
      getSession();
      setLoading(false);
      return;
    }

    let projId, testcaseId;
    if (props.testcaseId) {
      projId = props.projectId;
      testcaseId = props.testcaseId;
    } else {
      projId = params.project;
      testcaseId = params.testcase;
    }

    if (!projId || !testcaseId) return;

    setProjectId(projId);

    const sessionPromise = Backend.get("user/session");
    const testcasePromise = Backend.get(projId + "/testcase/" + testcaseId);

    Promise.all([sessionPromise, testcasePromise])
      .then(([sessionData, testcaseData]) => {
        setSession(sessionData);
        setTestcase(testcaseData);
        setOriginalTestcase(JSON.parse(JSON.stringify(testcaseData)));
        setAttributesInEdit(new Set());
        setPropertiesInEdit(new Set());

        const roles = sessionData.person.roles && sessionData.person.roles.length > 0 
          ? sessionData.person.roles : [];

        if (roles.length == 0) {
          setReadonly(true);
        } else {
          const isTester = roles.filter(val => val.includes('TESTER')).length > 0;
          const isObserverOnly = roles.filter(val => val.includes('OBSERVERONLY')).length > 0;
          const isTestDev = roles.filter(val => val.includes('TESTDEVELOPER')).length > 0;
          setTestDeveloper(isTestDev);

          if (isTester || isObserverOnly) {
            setReadonly(true);
          } else if (isTestDev && testcaseData.locked) {
            setReadonly(true);
          } else if (isTestDev) {
            setReadonly(false);
          } else {
            setReadonly(false);
          }
        }

        setLoading(false);
      })
      .catch(error => {
        console.log("Error loading testcase or session:", error);
        setErrorMessage("componentDidMount::Couldn't fetch testcase or session");
        setLoading(false);
      });
  }, []);

  // Handle props changes  
  useEffect(() => {
    if (props.testcase) {
      setTestcase(props.testcase);
      setLoading(false);
      setTestDeveloper(props.testDeveloper);
    } else if (props.testcaseId && props.projectId) {
      setProjectId(props.projectId);
      setReadonly(false);
      getTestCase(props.projectId, props.testcaseId);
    }
    
    if (props.projectAttributes) {
      setProjectAttributes(props.projectAttributes);
    }
    
    if (props.launchId) {
      setLaunchId(props.launchId);
    }
    
    if (props.projectId && props.projectId !== projectId) {
      setProjectId(props.projectId);
    }
  }, [props.testcase, props.testcaseId, props.projectId, props.launchId, props.projectAttributes, props.testDeveloper]);

  // CONTINUATION IN NEXT ARTIFACT - See testcase_complete_pt2
  // Due to artifact size limits, the rest of the functions and JSX are in the next artifact
  // Copy both artifacts and combine them to get the complete file

  const cloneTestCase = () => {
    console.log("TestCase::cloneTestCase");
    Backend.post(projectId + "/testcase/" + testcase.id + "/clone")
      .then(response => {
        window.location.href = window.location.href.replace('testcase=' + testcase.id, 'testcase=' + response.id);
      })
      .catch(error => {
        setErrorMessage("cloneTestCase::Couldn't clone testcase");
        setLoading(false);
      });
  };

  const handleChange = (fieldName, event, index, arrObjectKey, skipStateRefresh) => {
    setTestcase(prevTestcase => {
      const newTestcase = { ...prevTestcase };
      
      if (index !== undefined) {
        if (arrObjectKey) {
          newTestcase[fieldName][index][arrObjectKey] = event.target.value;
        } else {
          newTestcase[fieldName][index] = event.target.value;
        }
      } else {
        newTestcase[fieldName] = event.target.value;
      }
      
      return newTestcase;
    });
  };

  const cancelEdit = (fieldName, event, index) => {
    setTestcase(prevTestcase => {
      const newTestcase = { ...prevTestcase };
      
      if (index !== undefined) {
        newTestcase[fieldName][index] = originalTestcase[fieldName][index];
      } else {
        newTestcase[fieldName] = originalTestcase[fieldName];
      }

      return newTestcase;
    });
    
    toggleEdit(fieldName, event, index);
  };

  const handleSubmit = (fieldName, event, index, ignoreToggleEdit) => {
    console.log("TestCase::handleSubmit");
    Backend.put(projectId + "/testcase/", testcase)
      .then(response => {
        setTestcase(response);
        setOriginalTestcase(JSON.parse(JSON.stringify(response)));
        setAttributesInEdit(new Set());
        setPropertiesInEdit(new Set());
        getAttributes();
        if (!ignoreToggleEdit) {
          toggleEdit(fieldName, event, index);
        }
      })
      .catch(error => {
        setErrorMessage("handleSubmit::Couldn't save testcase");
      });
    if (event) {
      event.preventDefault();
    }
  };

  const toggleEdit = (fieldName, event, index) => {
    let fieldId = fieldName;
    if (index !== undefined) {
      fieldId = fieldId + "-" + index;
    }
    
    if ($("#" + fieldId + "-display").offsetParent !== null) {
      setOriginalTestcase(prevOriginal => {
        const newOriginal = { ...prevOriginal };
        if (index !== undefined) {
          if (!newOriginal[fieldName]) newOriginal[fieldName] = [];
          newOriginal[fieldName][index] = JSON.parse(
            JSON.stringify(testcase[fieldName]?.[index] || "")
          );
        } else {
          newOriginal[fieldName] = JSON.parse(JSON.stringify(testcase[fieldName] || ""));
        }
        return newOriginal;
      });
    }
    
    $("#" + fieldId + "-display").toggle();
    $("#" + fieldId + "-form").toggle();
    
    if (event) {
      event.preventDefault();
    }
  };

  const getAttributeName = (id) => {
    return Utils.getProjectAttribute(projectAttributes, id).name || "";
  };

  const getAttributeValues = (id) => {
    return Utils.getProjectAttribute(projectAttributes, id).attrValues || [];
  };

  const editAttributeValues = (key, values) => {
    setOriginalTestcase(prevOriginal => {
      const newOriginal = { ...prevOriginal };
      if (!newOriginal.attributes) newOriginal.attributes = {};
      newOriginal.attributes[key] = testcase.attributes?.[key];
      return newOriginal;
    });

    setTestcase(prevTestcase => {
      const newTestcase = { ...prevTestcase };
      if (!newTestcase.attributes) newTestcase.attributes = {};
      newTestcase.attributes[key] = values ? values.map(value => value.value) : [];
      return newTestcase;
    });
  };

  const cancelEditAttributeValues = (event, key) => {
    setTestcase(prevTestcase => {
      const newTestcase = { ...prevTestcase };
      if (newTestcase.attributes && originalTestcase.attributes) {
        newTestcase.attributes[key] = originalTestcase.attributes[key];
      }
      return newTestcase;
    });

    setAttributesInEdit(prev => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });

    toggleEdit("attributes", event, key);
  };

  const cancelEditAttributeKey = (event, key) => {
    setTestcase(prevTestcase => {
      const newTestcase = { ...prevTestcase };
      if (
        newTestcase.attributes?.[key] === undefined ||
        key === undefined ||
        newTestcase.attributes?.[key]?.values === undefined ||
        newTestcase.attributes?.[key]?.values === null ||
        newTestcase.attributes?.[key]?.values?.length == 0
      ) {
        if (newTestcase.attributes) {
          delete newTestcase.attributes[key];
        }
      }
      return newTestcase;
    });

    setAttributesInEdit(prev => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
  };

  const removeAttribute = (key, event) => {
    setTestcase(prevTestcase => {
      const newTestcase = { ...prevTestcase };
      if (newTestcase.attributes) {
        delete newTestcase.attributes[key];
      }
      return newTestcase;
    });

    setAttributesInEdit(prev => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });

    handleSubmit("attributes", event, 0, true);
  };

  const addAttribute = (event) => {
    setTestcase(prevTestcase => {
      const newTestcase = { ...prevTestcase };
      if (!newTestcase.attributes) {
        newTestcase.attributes = {};
      }
      newTestcase.attributes[null] = [];
      return newTestcase;
    });

    setAttributesInEdit(prev => {
      const newSet = new Set(prev);
      newSet.add(null);
      return newSet;
    });
  };

  const addProperty = (event) => {
    setTestcase(prevTestcase => {
      const newTestcase = { ...prevTestcase };
      if (!newTestcase.properties) {
        newTestcase.properties = [];
      }
      newTestcase.properties.push({ key: "", value: "" });
      return newTestcase;
    });
    
    setOriginalTestcase(prevOriginal => {
      const newOriginal = { ...prevOriginal };
      if (!newOriginal.properties) {
        newOriginal.properties = [];
      }
      newOriginal.properties.push({ key: "", value: "" });
      return newOriginal;
    });

    setPropertiesInEdit(prev => {
      const newSet = new Set(prev);
      newSet.add(testcase.properties?.length || 0);
      return newSet;
    });
  };

  const toggleEditProperty = (event, index) => {
    setOriginalTestcase(prevOriginal => {
      const newOriginal = { ...prevOriginal };
      if (newOriginal.properties && testcase.properties) {
        newOriginal.properties[index] = JSON.parse(JSON.stringify(testcase.properties[index]));
      }
      return newOriginal;
    });

    setPropertiesInEdit(prev => {
      const newSet = new Set(prev);
      newSet.add(index);
      return newSet;
    });
  };

  const removeProperty = (index, event) => {
    setTestcase(prevTestcase => {
      const newTestcase = { ...prevTestcase };
      if (newTestcase.properties) {
        newTestcase.properties.splice(index, 1);
      }
      return newTestcase;
    });

    setPropertiesInEdit(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });

    handleSubmit("properties", event, 0, true);
  };

  const cancelEditProperty = (index, event) => {
    const originalProperty = originalTestcase.properties?.[index];
    if (originalProperty?.key == "" && originalProperty?.value == "") {
      removeProperty(index, event);
    } else {
      setTestcase(prevTestcase => {
        const newTestcase = { ...prevTestcase };
        if (newTestcase.properties && originalProperty) {
          newTestcase.properties[index] = originalProperty;
        }
        return newTestcase;
      });

      setPropertiesInEdit(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });

      toggleEdit("properties", event, index, true);
    }
  };

  const editAttributeKey = (key, data, reRender) => {
    setProjectAttributes(prevAttrs => {
      const newProjectAttrs = [...prevAttrs];
      if (!newProjectAttrs.find(attribute => attribute.id === data.value)) {
        newProjectAttrs.push({ id: data.value, name: data.value });
      }
      return newProjectAttrs;
    });

    setAttributesInEdit(prev => {
      const newSet = new Set(prev);
      newSet.delete(key);
      newSet.add(data.value);
      return newSet;
    });

    setTestcase(prevTestcase => {
      const newTestcase = { ...prevTestcase };
      if (newTestcase.attributes) {
        newTestcase.attributes[data.value] = newTestcase.attributes[key];
        delete newTestcase.attributes[key];
      }
      return newTestcase;
    });
  };

  const handleStepActionChange = (index, value, reRender) => {
    setTestcase(prevTestcase => {
      const newTestcase = { ...prevTestcase };
      if (newTestcase.steps?.[index]) {
        newTestcase.steps[index].action = value;
      }
      return newTestcase;
    });
  };

  const handleStepExpectationChange = (index, value, reRender) => {
    setTestcase(prevTestcase => {
      const newTestcase = { ...prevTestcase };
      if (newTestcase.steps?.[index]) {
        newTestcase.steps[index].expectation = value;
      }
      return newTestcase;
    });
  };

  const addStep = () => {
    setTestcase(prevTestcase => {
      const newTestcase = { ...prevTestcase };
      if (!newTestcase.steps) {
        newTestcase.steps = [];
      }
      newTestcase.steps.push({});
      return newTestcase;
    });
  };

  const removeStep = (event, index) => {
    setTestcase(prevTestcase => {
      const newTestcase = { ...prevTestcase };
      if (newTestcase.steps) {
        newTestcase.steps.splice(index, 1);
      }
      return newTestcase;
    });
    handleSubmit("steps", event, index, true);
  };

  const toggleEditAttribute = (attributeId) => {
    setAttributesInEdit(prev => {
      const newSet = new Set(prev);
      newSet.add(attributeId);
      return newSet;
    });
  };

  const getAttributeKeysToAdd = () => {
    return (projectAttributes || [])
      .filter(attribute => !(Object.keys(testcase.attributes || {}) || []).includes(attribute.id))
      .filter(attribute => attribute.id !== 'broken')
      .map(attribute => ({ value: attribute.id, label: attribute.name }));
  };

  const onCommentsCountChanged = (count) => {
    setCommentsCount(count);
  };

  const removeTestcase = () => {
    console.log("TestCase::removeTestCase");
    Backend.delete(projectId + "/testcase/" + testcase.id)
      .then(response => {
        window.location.href = window.location.href.replace("testcase=" + testcase.id, "");
      })
      .catch(error => {
        setErrorMessage("removeTestcase::Couldn't remove testcase");
      });
  };

  const lockTestcase = () => {
    Backend.post(projectId + "/testcase/" + testcase.id + "/lock")
      .then(response => {
        setTestcase(prevTestcase => ({
          ...prevTestcase,
          lock: true
        }));
        window.location.href = window.location.href.replace("testcase=" + testcase.id, "");
      })
      .catch(error => {
        setErrorMessage("lockTestcase::Couldn't lock testcase");
      });
  };

  const unlockTestcase = () => {
    Backend.post(projectId + "/testcase/" + testcase.id + "/unlock")
      .then(response => {
        setTestcase(prevTestcase => ({
          ...prevTestcase,
          lock: false
        }));
        window.location.href = window.location.href.replace("testcase=" + testcase.id, "");
      })
      .catch(error => {
        setErrorMessage("unlockTestcase::Couldn't unlock testcase");
      });
  };

  const onBrokenToggle = () => {
    const newBroken = !testcase.broken;
    setTestcase(prevTestcase => ({
      ...prevTestcase,
      broken: newBroken
    }));
    setTimeout(() => {
      handleSubmit(null, null, null, true);
    }, 0);
  };

  const onTestcaseUpdated = (count) => {
    if (projectId && testcase.id) {
      getTestCase(projectId, testcase.id);
      getAttributes();
    }
  };

  const handleOnClickToSelectText = () => {
    const text = window.getSelection();
    if (text.rangeCount > 0) {
      const mark = document.createElement("span");
      mark.style.color = 'blue';
      mark.style.fontWeight = 'bold';

      const selectionRange = text.getRangeAt(0);
      mark.appendChild(selectionRange.extractContents());
      selectionRange.insertNode(mark);
    }
  };


  return (
    <div>
      <ControlledPopup popupMessage={errorMessage} />
      <ul className="nav nav-tabs" id="tcTabs" role="tablist">
        <li className="nav-item">
          <a
            className="nav-link active"
            id="main-tab"
            data-toggle="tab"
            href="#main"
            role="tab"
            aria-controls="home"
            aria-selected="true"
          >
            Main
          </a>
        </li>

        {testcase.failureDetails && Object.keys(testcase.failureDetails).length > 0 && (
          <li className="nav-item">
            <a
              className="nav-link"
              id="failure-tab"
              data-toggle="tab"
              href="#failure"
              role="tab"
              aria-controls="failure"
              aria-selected="false"
            >
              Failure
            </a>
          </li>
        )}

        {!launchId && (
          <li className="nav-item">
            <a
              className="nav-link"
              id="attachments-tab"
              data-toggle="tab"
              href="#attachments"
              role="tab"
              aria-controls="attachments"
              aria-selected="false"
            >
              Attachments
              {testcase.attachments && testcase.attachments.length > 0 && (
                <span className="badge badge-pill badge-secondary tab-badge">
                  {testcase.attachments.length}
                </span>
              )}
            </a>
          </li>
        )}

        {launchId && (
          <li className="nav-item">
            <a
              className="nav-link"
              id="results-tab"
              data-toggle="tab"
              href="#results"
              role="tab"
              aria-controls="results"
              aria-selected="false"
            >
              Results
              {testcase.results && testcase.results.length > 0 && (
                <span className="badge badge-pill badge-secondary tab-badge">
                  {testcase.results.length}
                </span>
              )}
            </a>
          </li>
        )}

        {launchId && (
          <li className="nav-item">
            <a
              className="nav-link"
              id="comments-tab"
              data-toggle="tab"
              href="#comments-tab-body"
              role="tab"
              aria-controls="comments-tab-body"
              aria-selected="false"
            >
              Comments
              {commentsCount > 0 && (
                <span className="badge badge-pill badge-secondary tab-badge">{commentsCount}</span>
              )}
            </a>
          </li>
        )}

        {testcase.metaData && Object.keys(testcase.metaData).length > 0 && (
          <li className="nav-item">
            <a
              className="nav-link"
              id="history-tab"
              data-toggle="tab"
              href="#metadata"
              role="tab"
              aria-controls="metadata"
              aria-selected="false"
            >
              Metadata
            </a>
          </li>
        )}
        
        <li className="nav-item">
          <a
            className="nav-link"
            id="history-tab"
            data-toggle="tab"
            href="#history"
            role="tab"
            aria-controls="history"
            aria-selected="false"
          >
            History
          </a>
        </li>
      </ul>

      <div className="tab-content" id="tcTabContent">
        <div className="sweet-loading">
          <FadeLoader sizeUnit={"px"} size={100} color={"#135f38"} loading={loading} />
        </div>
        
        <div className="tab-pane fade show active" id="main" role="tabpanel" aria-labelledby="main-tab">
          <div id="name" className="testcase-section">
            <div id="name-display" className="inplace-display row">
              <div className="col-9">
                <h1>
                  <em><span className="testcase-id-in-title text-muted">{testcase.id}</span></em>
                  <Link to={"/" + projectId + "/testcase/" + testcase.id}>
                    {testcase.name || testcase.importedName || ""}
                  </Link>
                  <span className="name-icon">
                    {testcase.automated && <FontAwesomeIcon icon={faPlug} />}
                  </span>
                  <span>
                    {!readonly && (
                      <span className="edit edit-icon clickable" onClick={e => toggleEdit("name", e)}>
                        <FontAwesomeIcon icon={faPencilAlt} />
                      </span>
                    )}
                  </span>
                </h1>
              </div>
              {!readonly && (
                <div className="col-1">
                  <div className="dropdown">
                    <span className="dropdown-toggle clickable" href="#" role="button" id="dropdownMenuLink" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                      <FontAwesomeIcon icon={faBars} />
                    </span>
                    <div className="dropdown-menu" aria-labelledby="dropdownMenuLink">
                      <a className="dropdown-item" href="#" onClick={e => cloneTestCase()}>Clone</a>
                    </div>
                  </div>
                </div>
              )}
              {!readonly && (
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
                      <button
                        type="button"
                        className="btn btn-light"
                        data-dismiss="modal"
                        onClick={e => cancelEdit("name", e)}
                      >
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
              ></div>
              {!readonly && (
                <div id="description-form" className="inplace-form" style={{ display: "none" }}>
                  <Editor
                    tinymceScriptSrc='/tinymce/tinymce.min.js'
                    initialValue={testcase.description}
                    init={{
                      license_key: 'gpl',
                      height: 500,
                      menubar: false,
                      plugins: tinymcePlugins,
                      toolbar: tinymceToolbar,
                      content_style: tinymceContentStyle
                    }}
                    onEditorChange={val =>
                      handleChange("description", { target: { value: val } }, null, null, true)
                    }
                  />
                  <form>
                    <div className="testcase-inplace-buttons-down">
                      <button
                        type="button"
                        className="btn btn-light"
                        data-dismiss="modal"
                        onClick={e => cancelEdit("description", e)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={e => handleSubmit("description", e)}
                      >
                        Save
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>

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
              ></div>
              {!readonly && (
                <div id="preconditions-form" className="inplace-form" style={{ display: "none" }}>
                  <Editor
                    tinymceScriptSrc='/tinymce/tinymce.min.js'
                    initialValue={testcase.preconditions}
                    init={{
                      license_key: 'gpl',
                      height: 500,
                      menubar: false,
                      plugins: tinymcePlugins,
                      toolbar: tinymceToolbar,
                      content_style: tinymceContentStyle
                    }}
                    onEditorChange={val =>
                      handleChange("preconditions", { target: { value: val } }, null, null, true)
                    }
                  />
                  <form>
                    <div className="testcase-inplace-buttons-down">
                      <button
                        type="button"
                        className="btn btn-light"
                        onClick={e => cancelEdit("preconditions", e)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={e => handleSubmit("preconditions", e)}
                      >
                        Save
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>

          <div id="steps" className="mb-4">
            <LaunchTestcaseControls
              testcase={testcase}
              launchId={launchId}
              projectId={projectId}
              callback={props.callback}
              indicator={"START"}
            />

            <h5>Steps</h5>

            {testcase.steps && testcase.steps.length > 0 ? (
              (testcase.steps || []).map((step, i) => {
                if (!step || (!step.action && !step.expectation)) {
                  return (
                    <div className="step" key={i}>
                      <div id={"steps-" + i + "-form"} index={i} className="inplace-form card">
                        <div className="card-header">{i + 1}. Step</div>
                        <div className="card-body">
                          <p className="card-text">
                            <Editor
                              tinymceScriptSrc='/tinymce/tinymce.min.js'
                              initialValue={testcase.steps[i]?.action}
                              init={{
                                license_key: 'gpl',
                                height: 300,
                                menubar: false,
                                plugins: tinymcePlugins,
                                toolbar: tinymceToolbar,
                                content_style: tinymceContentStyle
                              }}
                              onEditorChange={val => handleStepActionChange(i, val, false)}
                            />
                          </p>
                          <h6 className="card-subtitle mb-2 text-muted">Expectations</h6>
                          <p className="card-text">
                            <Editor
                              tinymceScriptSrc='/tinymce/tinymce.min.js'
                              initialValue={testcase.steps[i]?.expectation}
                              init={{
                                license_key: 'gpl',
                                height: 300,
                                menubar: false,
                                plugins: tinymcePlugins,
                                toolbar: tinymceToolbar,
                                content_style: tinymceContentStyle
                              }}
                              onEditorChange={val => handleStepExpectationChange(i, val, false)}
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
                    <div className key={i}>
                      <div id={"steps-" + i + "-display"} className="inplace-display col-sm-12">
                        <div index={i} className="row">
                          <div className="card col-md-12">
                            <div className="card-body">
                              {((typeof testcase.launchStatus !== 'undefined') && testcase.launchStatus.includes("RUNNING")) ? (
                                <div className="card-text">
                                  <div
                                    onClick={handleOnClickToSelectText}
                                    dangerouslySetInnerHTML={{
                                      __html: "<b><i>" + (i + 1) + ". Step </i></b>" + testcase.steps[i].action,
                                    }}
                                  ></div>
                                </div>
                              ) : (
                                <div className="card-text">
                                  <div
                                    dangerouslySetInnerHTML={{
                                      __html: "<b><i>" + (i + 1) + ". Step </i></b>" + testcase.steps[i].action,
                                    }}
                                  ></div>
                                </div>
                              )}

                              <h6 className="card-subtitle mb-2 expectations">
                                <b><i>Expectations</i></b>
                              </h6>
                              <div
                                className="card-text"
                                dangerouslySetInnerHTML={{ __html: testcase.steps[i].expectation }}
                              ></div>

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
                          index={i}
                          className="inplace-form card col-md-12"
                          style={{ display: "none" }}
                        >
                          <div className="card-body">
                            <h6 className="card-subtitle mb-2 text-muted">{i + 1}. Step</h6>
                            <p className="card-text">
                              <Editor
                                tinymceScriptSrc='/tinymce/tinymce.min.js'
                                initialValue={testcase.steps[i]?.action}
                                init={{
                                  license_key: 'gpl',
                                  height: 300,
                                  menubar: false,
                                  plugins: tinymcePlugins,
                                  toolbar: tinymceToolbar,
                                  content_style: tinymceContentStyle
                                }}
                                onEditorChange={val => handleStepActionChange(i, val, false)}
                              />
                            </p>
                            <h6 className="card-subtitle mb-2 text-muted">Expectations</h6>
                            <p className="card-text">
                              <Editor
                                tinymceScriptSrc='/tinymce/tinymce.min.js'
                                initialValue={testcase.steps[i]?.expectation}
                                init={{
                                  license_key: 'gpl',
                                  height: 300,
                                  menubar: false,
                                  plugins: tinymcePlugins,
                                  toolbar: tinymceToolbar,
                                  content_style: tinymceContentStyle
                                }}
                                onEditorChange={val => handleStepExpectationChange(i, val, false)}
                              />
                            </p>
                            <button
                              type="button"
                              className="btn btn-light"
                              onClick={e => cancelEdit("steps", e, i)}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={e => handleSubmit("steps", e, i)}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
              })
            ) : (
              <></>
            )}

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
            callback={props.callback}
            indicator={"FAILUREDETAILS"}
          />

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
                      <div index={attributeId} className="card">
                        <div className="card-header">
                          <b>
                            {getAttributeName(attributeId)}
                            {!readonly && (
                              <span
                                className="edit edit-icon clickable"
                                onClick={e => {
                                  toggleEditAttribute(attributeId);
                                }}
                              >
                                <FontAwesomeIcon icon={faPencilAlt} />
                              </span>
                            )}
                            {!readonly && (
                              <span
                                className="clickable edit-icon red"
                                index={attributeId}
                                onClick={e => removeAttribute(attributeId, e)}
                              >
                                <FontAwesomeIcon icon={faMinusCircle} />
                              </span>
                            )}
                          </b>
                        </div>
                        {<div className="card-body">{attributeValues.join(", ")}</div>}
                      </div>
                    </div>
                    {!readonly && (
                      <div
                        id={"attributes-" + attributeId + "-form"}
                        className="inplace-form"
                        style={{ display: attributesInEdit.has(attributeId) ? "block" : "none" }}
                      >
                        <form>
                          <div index={attributeId} className="card">
                            <div className="card-header">
                              <b>{getAttributeName(attributeId)}</b>
                            </div>
                            <div className="card-body">
                              <CreatableSelect
                                value={(attributeValues || []).map(val => {
                                  return { value: val, label: val };
                                })}
                                isMulti
                                isClearable
                                onChange={e => editAttributeValues(attributeId, e)}
                                options={getAttributeValues(attributeId).map(attrValue => {
                                  return { value: attrValue.value, label: attrValue.value };
                                })}
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
                      <div index={attributeId} className="card">
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
              <div className>
                <button type="button" className="btn btn-primary" onClick={e => addAttribute(e)}>
                  Add Attribute 
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="tab-pane fade show" id="failure" role="tabpanel" aria-labelledby="failure-tab">
          {testcase.failureDetails && Object.keys(testcase.failureDetails).length > 0 && (
            <div className="testcase-section">
              <h5>Failure Details</h5>
              <div>{testcase.failureDetails.text}</div>
            </div>
          )}
        </div>

        {!launchId && (
          <div className="tab-pane fade show" id="attachments" role="tabpanel" aria-labelledby="attachments-tab">
            <Attachments
              testcase={testcase}
              projectId={projectId}
              onTestcaseUpdated={onTestcaseUpdated}
              readonly={readonly}
              testDeveloper={testDeveloper}
            />
          </div>
        )}

        {launchId && (
          <div className="tab-pane fade show" id="results" role="tabpanel" aria-labelledby="results-tab">
            <Results
              testcase={testcase}
              projectId={projectId}
              onTestcaseUpdated={onTestcaseUpdated}
            />
          </div>
        )}

        <div
          className="tab-pane fade show"
          id="comments-tab-body"
          role="tabpanel"
          aria-labelledby="comments-tab-body"
        >
          <Comments
            entityId={launchId + "_" + testcase.id}
            projectId={projectId}
            entityType="launch"
            onCommentsNumberChanged={onCommentsCountChanged}
          />
        </div>

        <div className="tab-pane fade show" id="metadata" role="tabpanel" aria-labelledby="metadata-tab">
          <dl>
            {Object.keys(testcase.metaData || {}).map(key => {
              return (
                <span key={key}>
                  <dt>{key}</dt>
                  <dd>{testcase.metaData[key]}</dd>
                </span>
              );
            })}
          </dl>
        </div>

        <div className="tab-pane fade show" id="history" role="tabpanel" aria-labelledby="history-tab">
          <EventsWidget
            projectId={projectId}
            filter={{
              skip: 0,
              limit: 10,
              orderby: "id",
              orderdir: "DESC",
              entityType: "TestCase",
              entityId: testcase.id,
              eventType: ["PASSED", "FAILED", "BROKEN", "UPDATED"],
            }}
          />
        </div>
      </div>

      <div className="row">
        <div className="col-md-6"></div>
        {!readonly && (Utils.isAdmin(session) && !testcase.locked) && (
          <ConfirmButton
            onSubmit={lockTestcase}
            buttonClass={"btn btn-danger float-left"}
            id={"testcase-lock"}
            modalText={"Are you sure you want to lock this test case?"}
            buttonText={"Lock Testcase"}
          />
        )}

        {!readonly && (Utils.isAdmin(session) && testcase.locked) && (
          <ConfirmButton
            onSubmit={unlockTestcase}
            buttonClass={"btn btn-danger float-left"}
            id={"testcase-unlock"}
            modalText={"Are you sure you want to unlock this test case?"}
            buttonText={"Unlock Testcase"}
          />
        )}

        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;

        {!readonly && (
          <ConfirmButton
            onSubmit={removeTestcase}
            buttonClass={"btn btn-danger float-right"}
            id={"testcase-removal"}
            modalText={"Are you sure you want to remove the Test Case?"}
            buttonText={"Remove Testcase"}
          />
        )}
      </div>
    </div>
  );
};

export default withRouter(TestCase);

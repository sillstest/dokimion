/* eslint-disable eqeqeq */
import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinusCircle } from "../common/icons";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import $ from "jquery";
import ControlledPopup from "../common/ControlledPopup";
import Backend from "../services/backend";

const defaultIssue = () => ({ name: "", type: {}, description: "", priority: {}, trackerProject: {} });
const mapToView = (items, id, label) => (items || []).map(i => ({ value: i[id], label: i[label] }));

function Issues({ testcase, projectId, onTestcaseUpdated }) {
  const [issue, setIssue] = useState(defaultIssue());
  const [linkIssueView, setLinkIssueView] = useState({});
  const [suggestedTrackerProjects, setSuggestedTrackerProjects] = useState([]);
  const [issueTypes, setIssueTypes] = useState([]);
  const [issuePriorities, setIssuePriorities] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const issueToRemove = useRef(null);

  useEffect(() => {
    if (!projectId) return;
    Backend.get(projectId + "/testcase/issue/projects")
      .then(response => setSuggestedTrackerProjects(response))
      .catch(error => setErrorMessage("Couldn't fetch tracker projects: " + error));
  }, [projectId]);

  function suggestIssues(value, callback) {
    const existingIds = (testcase?.issues || []).map(i => i.id);
    Backend.get(projectId + "/testcase/issue/suggest?text=" + value).then(response => {
      const filtered = (response || []).filter(i => !existingIds.includes(i.id));
      callback(filtered.map(i => ({ value: i.id, label: i.id + " - " + i.name })));
    });
  }

  function changeTrackerProject(value) {
    setIssue(prev => ({ ...prev, trackerProject: { name: value.label, id: value.value } }));
    Backend.get(projectId + "/testcase/issue/types?project=" + value.value)
      .then(response => setIssueTypes(response));
    Backend.get(projectId + "/testcase/issue/priorities?project=" + value.value)
      .then(response => setIssuePriorities(response));
  }

  function createIssue(event) {
    Backend.post(projectId + "/testcase/" + testcase.id + "/issue", issue)
      .then(() => { $("#issue-modal").modal("hide"); setIssue(defaultIssue()); if (onTestcaseUpdated) onTestcaseUpdated(); })
      .catch(() => setErrorMessage("Couldn't create issue"));
    event.preventDefault();
  }

  function linkIssue(event) {
    Backend.post(
      projectId + "/testcase/" + testcase.id + "/issue/link/" + (linkIssueView.value || ""),
      issue,
    )
      .then(() => { setLinkIssueView({}); $("#issue-modal").modal("hide"); if (onTestcaseUpdated) onTestcaseUpdated(); })
      .catch(error => setErrorMessage("Couldn't link issue: " + error));
    event.preventDefault();
  }

  function unlinkIssueConfirmation(issueId) {
    issueToRemove.current = issueId;
    $("#unlink-issue-confirmation").modal("show");
  }

  function cancelUnlinkIssueConfirmation() {
    issueToRemove.current = null;
    $("#unlink-issue-confirmation").modal("hide");
  }

  function unlinkIssue() {
    Backend.delete(projectId + "/testcase/" + testcase.id + "/issue/" + issueToRemove.current)
      .then(() => { issueToRemove.current = null; $("#unlink-issue-confirmation").modal("hide"); if (onTestcaseUpdated) onTestcaseUpdated(); })
      .catch(() => setErrorMessage("Couldn't unlink issue"));
  }

  const trackerProjectOptions = (suggestedTrackerProjects || []).map(p => ({ value: p.id, label: p.name }));
  const issueTypeOptions = (issueTypes || []).map(t => ({ value: t.id, label: t.name }));
  const issuePriorityOptions = (issuePriorities || []).map(p => ({ value: p.id, label: p.name }));

  return (
    <div>
      <ControlledPopup popupMessage={errorMessage} />
      <div id="issues" className="issues-list">
        <table className="table table-striped">
          <tbody>
            {(testcase?.issues || []).map(iss => (
              <tr key={iss.id}>
                <td>
                  {iss.isClosed ? (
                    <s><a href={iss.url || ""} target="_blank" rel="noreferrer">{iss.id} - {iss.name}</a></s>
                  ) : (
                    <a href={iss.url || ""} target="_blank" rel="noreferrer">{iss.id} - {iss.name}</a>
                  )}
                </td>
                <td>{iss.type?.name}</td>
                <td>{iss.status}</td>
                <td>{iss.priority?.name}</td>
                <td>
                  <span className="clickable edit-icon-visible red" onClick={() => unlinkIssueConfirmation(iss.id)}>
                    <FontAwesomeIcon icon={faMinusCircle} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <button type="button" className="btn btn-primary" data-toggle="modal" data-target="#issue-modal">Add Issue</button>
      </div>

      <div className="modal fade bd-example-modal-lg" tabIndex="-1" role="dialog" id="issue-modal">
        <div className="modal-dialog modal-lg" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <ul className="nav nav-tabs" id="issueTabs" role="tablist">
                <li className="nav-item">
                  <a className="nav-link active" id="create-issue-tab" data-toggle="tab" href="#create-issue" role="tab">
                    <h5 className="modal-title">Create Issue</h5>
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" id="link-issue-tab" data-toggle="tab" href="#link-issue" role="tab">
                    <h5 className="modal-title">Link Issue</h5>
                  </a>
                </li>
              </ul>
              <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="tab-content" id="issuesTabContent">
              <div className="tab-pane fade show active" id="create-issue" role="tabpanel">
                <div className="modal-body">
                  <form>
                    <div className="form-group row">
                      <label className="col-sm-3 col-form-label">Project</label>
                      <div className="col-sm-9">
                        <Select value={{ value: issue.trackerProject.id, label: issue.trackerProject.name }} onChange={changeTrackerProject} options={trackerProjectOptions} />
                      </div>
                    </div>
                    <div className="form-group row">
                      <label className="col-sm-3 col-form-label">Name</label>
                      <div className="col-sm-9">
                        <input type="text" className="form-control" name="name" onChange={e => setIssue(prev => ({ ...prev, name: e.target.value }))} value={issue.name} />
                      </div>
                    </div>
                    <div className="form-group row">
                      <label className="col-sm-3 col-form-label">Type</label>
                      <div className="col-sm-9">
                        <Select name="type" value={{ label: issue.type.name, value: issue.type.id }} onChange={v => setIssue(prev => ({ ...prev, type: { name: v.label, id: v.value } }))} options={issueTypeOptions} />
                      </div>
                    </div>
                    <div className="form-group row">
                      <label className="col-sm-3 col-form-label">Priority</label>
                      <div className="col-sm-9">
                        <Select name="priority" value={{ label: issue.priority.name, value: issue.priority.id }} onChange={v => setIssue(prev => ({ ...prev, priority: { name: v.label, id: v.value } }))} options={issuePriorityOptions} />
                      </div>
                    </div>
                    <div className="form-group row">
                      <label className="col-sm-3 col-form-label">Description</label>
                      <div className="col-sm-9">
                        <textarea rows="7" name="description" className="form-control" onChange={e => setIssue(prev => ({ ...prev, description: e.target.value }))} value={issue.description} />
                      </div>
                    </div>
                  </form>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
                  <button type="button" className="btn btn-primary" onClick={createIssue}>Create Issue</button>
                </div>
              </div>
              <div className="tab-pane fade" id="link-issue" role="tabpanel">
                <div className="modal-body">
                  <form>
                    <div className="form-group row">
                      <label className="col-sm-3 col-form-label">Search</label>
                      <div className="col-sm-9">
                        <AsyncSelect value={linkIssueView} loadOptions={suggestIssues} onChange={setLinkIssueView} />
                      </div>
                    </div>
                  </form>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
                  <button type="button" className="btn btn-primary" onClick={linkIssue}>Link Issue</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" tabIndex="-1" role="dialog" id="unlink-issue-confirmation">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Unlink Issue</h5>
              <button type="button" className="close" onClick={cancelUnlinkIssueConfirmation} aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">Are you sure you want to unlink issue?</div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={cancelUnlinkIssueConfirmation}>Close</button>
              <button type="button" className="btn btn-danger" onClick={unlinkIssue}>Unlink Issue</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Issues;

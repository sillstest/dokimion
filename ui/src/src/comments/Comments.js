/* eslint-disable eqeqeq */
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import $ from "jquery";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt } from "../common/icons";
import { faMinusCircle } from "../common/icons";
import * as Utils from "../common/Utils";
import Backend from "../services/backend";
import ControlledPopup from "../common/ControlledPopup";

function Comments({ projectId, entityId, entityType, forceFetch, hideForm, onCommentsNumberChanged }) {
  const [comments, setComments] = useState([]);
  const [commentToEdit, setCommentToEdit] = useState({ text: "", entityId, entityType });
  const [session, setSession] = useState({ person: {} });
  const [errorMessage, setErrorMessage] = useState("");
  const commentToRemove = useRef(null);

  useEffect(() => {
    Backend.get("user/session")
      .then(response => setSession(response))
      .catch(() => console.log("Unable to fetch session"));
  }, []);

  useEffect(() => {
    if (projectId && entityId && entityType) {
      Backend.get(
        projectId +
          "/comment?entityType=" +
          entityType +
          "&entityId=" +
          entityId +
          "&orderby=createdTime&orderdir=DESC",
      )
        .then(response => {
          setComments(response);
          if (onCommentsNumberChanged) onCommentsNumberChanged(response.length);
        })
        .catch(error => console.log(error));
    }
  }, [projectId, entityId, entityType, forceFetch]);

  useEffect(() => {
    setCommentToEdit(prev => ({ ...prev, entityId, entityType }));
  }, [entityId, entityType]);

  function handleChange(fieldName, event) {
    setCommentToEdit(prev => ({ ...prev, [fieldName]: event.target.value }));
  }

  function handleSubmit(event) {
    Backend.put(projectId + "/comment/", { ...commentToEdit, projectId })
      .then(response => {
        const updated = [response, ...comments];
        setComments(updated);
        setCommentToEdit({ text: "", entityId, entityType });
        if (onCommentsNumberChanged) onCommentsNumberChanged(updated.length);
      })
      .catch(error => setErrorMessage("Couldn't create comment: " + error));
    event.preventDefault();
  }

  function handleUpdateChange(index, event) {
    setComments(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], text: event.target.value };
      return updated;
    });
    event.preventDefault();
  }

  function handleUpdateSubmit(index, event) {
    Backend.post(projectId + "/comment/", comments[index])
      .then(response => {
        setComments(prev => {
          const u = [...prev];
          u[index] = response;
          return u;
        });
        cancelEdit(index);
      })
      .catch(error => setErrorMessage("Couldn't update comment: " + error));
  }

  function cancelEdit(index) {
    $("#comment-" + index + "-display").show();
    $("#comment-" + index + "-form").hide();
  }

  function toggleEdit(index) {
    $("#comment-" + index + "-display").hide();
    $("#comment-" + index + "-form").show();
  }

  function removeCommentConfirmation(commentId) {
    commentToRemove.current = commentId;
    $("#remove-comment-confirmation").modal("show");
  }

  function cancelRemoveCommentConfirmation() {
    commentToRemove.current = null;
    $("#remove-comment-confirmation").modal("hide");
  }

  function removeComment() {
    Backend.delete(projectId + "/comment/" + commentToRemove.current)
      .then(() => {
        const updated = comments.filter(c => c.id != commentToRemove.current);
        setComments(updated);
        if (onCommentsNumberChanged) onCommentsNumberChanged(updated.length);
        commentToRemove.current = null;
        $("#remove-comment-confirmation").modal("hide");
      })
      .catch(error => setErrorMessage("Couldn't delete comment: " + error));
  }

  return (
    <div>
      <ControlledPopup popupMessage={errorMessage} />
      <div id="comments">
        {comments.map((comment, i) => (
          <div key={comment.id || i} className="card project-card container">
            <div className="card-header row">
              <div className="col-10">
                <Link to={"/user/profile/" + comment.createdBy}>{comment.createdBy}</Link>{" "}
                {Utils.timeToDate(comment.createdTime)}
              </div>
              {Utils.isUserOwnerOrAdmin(session, comment.createdBy) && (
                <div className="col-2">
                  <span className="clickable edit-icon-visible" onClick={() => toggleEdit(i)}>
                    <FontAwesomeIcon icon={faPencilAlt} />
                  </span>
                  <span
                    className="clickable edit-icon-visible red"
                    onClick={() => removeCommentConfirmation(comment.id)}
                  >
                    <FontAwesomeIcon icon={faMinusCircle} />
                  </span>
                </div>
              )}
            </div>
            <div className="card-body">
              <div className="inplace-display" id={"comment-" + i + "-display"}>
                <p className="card-text">{comment.textFormatted || ""}</p>
              </div>
              <div id={"comment-" + i + "-form"} className="inplace-form" style={{ display: "none" }}>
                <form>
                  <textarea
                    rows="7"
                    cols="70"
                    name="text"
                    onChange={e => handleUpdateChange(i, e)}
                    value={comment.text}
                  />
                  <div>
                    <button type="button" className="btn btn-light" onClick={() => cancelEdit(i)}>
                      Cancel
                    </button>
                    <button type="button" className="btn btn-primary" onClick={e => handleUpdateSubmit(i, e)}>
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!hideForm && (
        <div id="comment-form">
          <form>
            <textarea
              rows="7"
              cols="70"
              name="text"
              onChange={e => handleChange("text", e)}
              value={commentToEdit.text}
            />
            <div>
              <button type="button" className="btn btn-primary" onClick={handleSubmit}>
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="modal fade" tabIndex="-1" role="dialog" id="remove-comment-confirmation">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Remove Comment</h5>
              <button type="button" className="close" onClick={cancelRemoveCommentConfirmation} aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">Are you sure you want to remove comment?</div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={cancelRemoveCommentConfirmation}>
                Close
              </button>
              <button type="button" className="btn btn-danger" onClick={removeComment}>
                Remove Comment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Comments;

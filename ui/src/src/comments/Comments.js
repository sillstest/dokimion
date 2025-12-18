import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import $ from "jquery";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt, faMinusCircle } from "@fortawesome/free-solid-svg-icons";
import * as Utils from "../common/Utils";
import Backend from "../services/backend";
import ControlledPopup from "../common/ControlledPopup";

const Comments = ({
  projectId: propProjectId,
  entityId: propEntityId,
  entityType: propEntityType,
  onCommentsNumberChanged,
  hideForm = false,
  forceFetch = false,
}) => {
  const [comments, setComments] = useState([]);
  const [commentToEdit, setCommentToEdit] = useState({
    text: "",
    entityId: propEntityId,
    entityType: propEntityType,
  });
  const [session, setSession] = useState({ person: {} });
  const [errorMessage, setErrorMessage] = useState("");

  const commentToRemoveRef = useRef(null); // To store comment ID for deletion

  // Sync commentToEdit when entity props change
  useEffect(() => {
    setCommentToEdit((prev) => ({
      ...prev,
      entityId: propEntityId,
      entityType: propEntityType,
    }));
  }, [propEntityId, propEntityType]);

  // Fetch session
  useEffect(() => {
    Backend.get("user/session")
      .then((response) => setSession(response))
      .catch(() => console.log("Unable to fetch session"));
  }, []);

  // Fetch comments
  const getComments = () => {
    if (!propProjectId || !propEntityId || !propEntityType) return;

    Backend.get(
      `${propProjectId}/comment?entityType=${propEntityType}&entityId=${propEntityId}&orderby=createdTime&orderdir=DESC`
    )
      .then((response) => {
        setComments(response);
        if (onCommentsNumberChanged) {
          onCommentsNumberChanged(response.length);
        }
      })
      .catch((error) => console.log("Error fetching comments:", error));
  };

  useEffect(() => {
    getComments();
  }, [propProjectId, propEntityId, propEntityType, forceFetch]);

  const handleChange = (e) => {
    setCommentToEdit((prev) => ({ ...prev, text: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!commentToEdit.text.trim()) return;

    Backend.put(`${propProjectId}/comment/`, commentToEdit)
      .then((response) => {
        setComments((prev) => [response, ...prev]);
        setCommentToEdit({ text: "", entityId: propEntityId, entityType: propEntityType });
        if (onCommentsNumberChanged) {
          onCommentsNumberChanged(comments.length + 1);
        }
      })
      .catch((error) => {
        setErrorMessage(`handleSubmit::Couldn't create comment, error: ${error}`);
      });
  };

  const toggleEdit = (index) => {
    $(`#comment-${index}-display`).hide();
    $(`#comment-${index}-form`).show();
  };

  const cancelEdit = (index) => {
    $(`#comment-${index}-display`).show();
    $(`#comment-${index}-form`).hide();
  };

  const handleUpdateChange = (index, e) => {
    const newText = e.target.value;
    setComments((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], text: newText };
      return updated;
    });
  };

  const handleUpdateSubmit = (index, e) => {
    e.preventDefault();
    const comment = comments[index];

    Backend.post(`${propProjectId}/comment/`, comment)
      .then((response) => {
        setComments((prev) => {
          const updated = [...prev];
          updated[index] = response;
          return updated;
        });
        cancelEdit(index);
      })
      .catch((error) => {
        setErrorMessage(`handleUpdateSubmit::Couldn't update comment, error: ${error}`);
      });
  };

  const removeCommentConfirmation = (commentId) => {
    commentToRemoveRef.current = commentId;
    $("#remove-comment-confirmation").modal("show");
  };

  const cancelRemoveCommentConfirmation = () => {
    commentToRemoveRef.current = null;
    $("#remove-comment-confirmation").modal("hide");
  };

  const removeComment = () => {
    const commentId = commentToRemoveRef.current;
    if (!commentId) return;

    Backend.delete(`${propProjectId}/comment/${commentId}`)
      .then(() => {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        if (onCommentsNumberChanged) {
          onCommentsNumberChanged(comments.length - 1);
        }
        commentToRemoveRef.current = null;
        $("#remove-comment-confirmation").modal("hide");
      })
      .catch((error) => {
        setErrorMessage(`removeComment::Couldn't delete comment, error: ${error}`);
      });
  };

  const isOwnerOrAdmin = (createdBy) => {
    return Utils.isUserOwnerOrAdmin(session, createdBy);
  };

  return (
    <div>
      <ControlledPopup popupMessage={errorMessage} />

      <div id="comments">
        {comments.map((comment, i) => (
          <div key={comment.id || i} className="card project-card container mb-3">
            <div className="card-header row align-items-center">
              <div className="col-10">
                <Link to={`/user/profile/${comment.createdBy}`}>
                  {comment.createdBy}
                </Link>{" "}
                {Utils.timeToDate(comment.createdTime)}
              </div>

              {isOwnerOrAdmin(comment.createdBy) && (
                <div className="col-2 text-right">
                  <span
                    className="clickable edit-icon-visible mr-3"
                    onClick={() => toggleEdit(i)}
                  >
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
              {/* Display Mode */}
              <div className="inplace-display" id={`comment-${i}-display`}>
                <p className="card-text">{comment.textFormatted || comment.text || ""}</p>
              </div>

              {/* Edit Mode */}
              <div
                id={`comment-${i}-form`}
                className="inplace-form"
                style={{ display: "none" }}
              >
                <form>
                  <textarea
                    rows="7"
                    className="form-control mb-2"
                    value={comment.text || ""}
                    onChange={(e) => handleUpdateChange(i, e)}
                  />
                  <div>
                    <button
                      type="button"
                      className="btn btn-light mr-2"
                      onClick={() => cancelEdit(i)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={(e) => handleUpdateSubmit(i, e)}
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Comment Form */}
      {!hideForm && (
        <div id="comment-form" className="mt-4">
          <form onSubmit={handleSubmit}>
            <textarea
              rows="7"
              className="form-control mb-2"
              value={commentToEdit.text || ""}
              onChange={handleChange}
              placeholder="Write a comment..."
            />
            <div>
              <button type="submit" className="btn btn-primary">
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal (jQuery/Bootstrap controlled) */}
      <div
        className="modal fade"
        tabIndex="-1"
        role="dialog"
        id="remove-comment-confirmation"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Remove Comment</h5>
              <button
                type="button"
                className="close"
                onClick={cancelRemoveCommentConfirmation}
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              Are you sure you want to remove this comment?
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={cancelRemoveCommentConfirmation}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={removeComment}
              >
                Remove Comment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Comments;

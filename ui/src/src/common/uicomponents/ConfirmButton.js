/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useRef } from "react";

export function ConfirmButton({ onSubmit, buttonClass, id, modalText, buttonText }) {
  const componentId = useRef(id + "-" + Math.floor(Math.random() * 100)).current;

  function handleSubmit(event) {
    if (onSubmit) {
      onSubmit(event, id);
    }
  }

  return (
    <div>
      <a type="button" className={buttonClass} data-toggle="modal" data-target={"#confirmation-" + componentId}>
        {buttonText}
      </a>
      <div className="modal fade" tabIndex="-1" role="dialog" id={"confirmation-" + componentId}>
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Confirm</h5>
              <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">{modalText}</div>
            <div className="modal-footer">
              <a type="button" className={buttonClass} data-dismiss="modal" onClick={handleSubmit}>
                {buttonText}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";

export const ConfirmButton = (props) => {
  const [componentId] = useState(props.id + "-" + Math.floor(Math.random() * 100));

  const handleSubmit = (event) => {
    console.log({ props, componentId });
    if (props.onSubmit) {
      props.onSubmit(event, props.id);
    }
  };

  return (
    <div>
      <a
        type="button"
        className={props.buttonClass}
        data-toggle="modal"
        data-target={"#confirmation-" + componentId}
      >
        {props.buttonText}
      </a>
      <div 
        className="modal fade" 
        tabIndex="-1" 
        role="dialog" 
        id={"confirmation-" + componentId}
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Confirm</h5>
              <button 
                type="button" 
                className="close" 
                data-dismiss="modal" 
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">{props.modalText}</div>
            <div className="modal-footer">
              <a
                type="button"
                className={props.buttonClass}
                data-dismiss="modal"
                onClick={(e) => handleSubmit(e)}
              >
                {props.buttonText}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
import React from "react";
import Popup from "reactjs-popup";

const ControlledPopup = ({ popupMessage }) => {
  return (
    <div>
      <div className="popup-content">{popupMessage}</div>
      <Popup>
        <div className="body">
          <span className="body">&times;</span>
        </div>
      </Popup>
    </div>
  );
};

export default ControlledPopup;

import React from "react";
import Popup from "reactjs-popup";

const ControlledPopup = ({ popupMessage }) => {
  return (
    <div>
      <div className="popup-content">{popupMessage}</div>
      <Popup>
        <div className="body">
          <a className="body">&times;</a>
        </div>
      </Popup>
    </div>
  );
};

export default ControlledPopup;

import React, { useState } from 'react';
import Popup from 'reactjs-popup';

const ControlledPopup = ({popupMessage}) => {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="popup-content">
	  {popupMessage}
      </div>
      <Popup>
        <div className="body">
          <a className="body">
            &times;
          </a>
        </div>
      </Popup>
    </div>
  );
};

export default ControlledPopup;

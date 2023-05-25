import React, { useState } from 'react';
import Popup from 'reactjs-popup';

const ControlledPopup = ({popupMessage}) => {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="outer">
	  {popupMessage}
      </div>
      <Popup>
        <div className="inner">
          <a className="inner">
            &times;
          </a>
        </div>
      </Popup>
    </div>
  );
};

export default ControlledPopup;

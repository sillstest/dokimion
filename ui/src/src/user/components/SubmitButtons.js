import React, { Fragment } from "react";
import Button from "@mui/material/Button";

const SubmitButtons = ({ buttonText, buttonStyle }) => (
  <Fragment>
    <Button style={buttonStyle} type="submit" variant="contained" color="primary">
      {buttonText}
    </Button>
  </Fragment>
);

export default SubmitButtons;

import React, { Fragment } from "react";
import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import { linkStyle } from "./ButtonStyles";

const LinkButtons = ({ buttonText = "Default Button Text", buttonStyle, link = "/" }) => (
  <Fragment>
    <Link style={linkStyle} to={link}>
      <Button variant="contained" color="primary" style={buttonStyle}>
        {buttonText}
      </Button>
    </Link>
  </Fragment>
);

export default LinkButtons;

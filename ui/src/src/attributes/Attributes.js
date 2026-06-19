/* eslint-disable eqeqeq */
import React, { useState, useEffect } from "react";
import { withRouter } from "../common/withRouter";
import AttributeForm from "../attributes/AttributeForm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt } from "../common/icons";
import $ from "jquery";
import { FadeLoader } from "react-spinners";
import Backend from "../services/backend";

const emptyAttribute = () => ({ id: null, name: "", type: "TESTCASE", attrValues: [] });

function Attributes({ match }) {
  const project = match?.params?.project;
  const [attributes, setAttributes] = useState([]);
  const [attributeToEdit, setAttributeToEdit] = useState(emptyAttribute());
  const [edit, setEdit] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!project) return;
    Backend.get(project + "/attribute")
      .then(response => {
        setAttributes(response);
        setLoading(false);
      })
      .catch(error => console.log(error));
  }, [project]);

  function editAttribute(i) {
    setAttributeToEdit(attributes[i]);
    setEdit(true);
    $("#editAttribute").modal("show");
  }

  function onAttributeAdded(attribute) {
    setAttributes(prev => {
      const idx = prev.findIndex(a => a.id === attribute.id);
      const updated = idx >= 0 ? prev.map((a, i) => (i === idx ? attribute : a)) : [...prev, attribute];
      return updated;
    });
    setAttributeToEdit(emptyAttribute());
    setEdit(false);
    $("#editAttribute").modal("hide");
  }

  function onAttributeRemoved(attribute) {
    setAttributes(prev => prev.filter(a => a.id !== attribute.id));
    setAttributeToEdit(emptyAttribute());
    $("#editAttribute").modal("hide");
  }

  return (
    <div>
      <div className="sweet-loading">
        <FadeLoader size={100} color={"#135f38"} loading={loading} />
      </div>
      {attributes.map((attribute, i) => (
        <div key={i} className="alert" role="alert">
          <h5 className="alert-heading">
            <b>{attribute.name}</b>
            <span className="edit clickable edit-icon" onClick={() => editAttribute(i)}>
              <FontAwesomeIcon icon={faPencilAlt} />
            </span>
          </h5>
          <p>Type: {attribute.type == "LAUNCH" ? "LAUNCH" : "TESTCASE"}</p>
          <p>{attribute.description}</p>
          <hr />
          <p className="mb-0">{attribute.attrValues.map(val => val.value).join(", ")}</p>
        </div>
      ))}
      <div className="attributes-controls">
        <button type="button" className="btn btn-primary" data-toggle="modal" data-target="#editAttribute">
          Add
        </button>
      </div>
      <div
        className="modal fade"
        id="editAttribute"
        tabIndex="-1"
        role="dialog"
        aria-labelledby="editAttributeLabel"
        aria-hidden="true"
      >
        <AttributeForm
          project={project}
          projectAttributes={attributes}
          attribute={attributeToEdit}
          edit={edit}
          onAttributeAdded={onAttributeAdded}
          onAttributeRemoved={onAttributeRemoved}
        />
      </div>
    </div>
  );
}

export default withRouter(Attributes);

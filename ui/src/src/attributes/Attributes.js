import React, { useState, useEffect } from "react";
import SubComponent from "../common/SubComponent";
import AttributeForm from "../attributes/AttributeForm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt } from "@fortawesome/free-solid-svg-icons";
import { FadeLoader } from "react-spinners";
import Backend from "../services/backend";
import { useParams } from "react-router-dom";

const Attributes = () => {
  const { project } = useParams(); // Replaces this.props.router.params.project

  const [attributes, setAttributes] = useState([]);
  const [attributeToEdit, setAttributeToEdit] = useState({
    id: null,
    name: "",
    type: "TESTCASE",
    attrValues: [],
  });
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const openModal = (attribute = null) => {
    if (attribute) {
      setAttributeToEdit(attribute);
      setEdit(true);
    } else {
      setAttributeToEdit({
        id: null,
        name: "",
        type: "TESTCASE",
        attrValues: [],
      });
      setEdit(false);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const onAttributeAdded = (newAttribute) => {
    setAttributes((prev) => {
      const existingIndex = prev.findIndex((attr) => attr.id === newAttribute.id);
      if (existingIndex === -1) {
        return [...prev, newAttribute];
      } else {
        const updated = [...prev];
        updated[existingIndex] = newAttribute;
        return updated;
      }
    });
    closeModal();
  };

  const onAttributeRemoved = (removedAttribute) => {
    setAttributes((prev) => prev.filter((attr) => attr.id !== removedAttribute.id));
    closeModal();
  };

  const editAttribute = (attribute) => {
    openModal(attribute);
  };

  useEffect(() => {
    if (!project) return;

    Backend.get(`${project}/attribute`)
      .then((response) => {
        setAttributes(response);
        setLoading(false);
      })
      .catch((error) => {
        console.log("Error fetching attributes:", error);
        setLoading(false);
      });
  }, [project]);

  return (
    <div>
      {/* Loading Spinner */}
      <div className="sweet-loading">
        <FadeLoader sizeUnit={"px"} size={100} color={"#135f38"} loading={loading} />
      </div>

      {/* Attributes List */}
      {!loading &&
        attributes.map((attribute, i) => (
          <div key={attribute.id || i} className="alert" role="alert">
            <h5 className="alert-heading">
              <b>{attribute.name}</b>
              <span
                className="edit clickable edit-icon"
                onClick={() => editAttribute(attribute)}
              >
                <FontAwesomeIcon icon={faPencilAlt} />
              </span>
            </h5>
            <p>Type: {attribute.type === "LAUNCH" ? "LAUNCH" : "TESTCASE"}</p>
            <p>{attribute.description || ""}</p>
            <hr />
            <p className="mb-0">
              {attribute.attrValues?.map((val) => val.value).join(", ") || "No values"}
            </p>
          </div>
        ))}

      {/* Add Button */}
      <div className="attributes-controls">
        <button type="button" className="btn btn-primary" onClick={() => openModal()}>
          Add
        </button>
      </div>

      {/* Controlled Modal */}
      {showModal && (
        <>
          {/* Backdrop */}
          <div className="modal-backdrop fade show" onClick={closeModal}></div>

          {/* Modal */}
          <div
            className="modal fade show"
            tabIndex="-1"
            role="dialog"
            aria-labelledby="editAttributeLabel"
            aria-hidden="false"
            style={{ display: "block" }}
            onClick={closeModal} // Click outside to close
          >
            <div
              className="modal-dialog"
              role="document"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
              <div className="modal-content">
                <AttributeForm
                  project={project}
                  projectAttributes={attributes}
                  attribute={attributeToEdit}
                  onAttributeRemoved={onAttributeRemoved}
                  onAttributeAdded={onAttributeAdded}
                  edit={edit}
                  closeModal={closeModal}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Attributes;

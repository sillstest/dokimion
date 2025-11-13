import React from "react";
import SubComponent from "../common/SubComponent";
import AttributeForm from "../attributes/AttributeForm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt } from "@fortawesome/free-solid-svg-icons";
// REMOVED: import $ from "jquery"; - No longer needed for modal control
import { FadeLoader } from "react-spinners";
import Backend from "../services/backend";
import { withRouter } from "../common/withRouter";

class Attributes extends SubComponent {
  constructor(props) {
    super(props);
    this.state = {
      attributes: [],
      attributeToEdit: {
        id: null,
        name: "",
        type: "TESTCASE",
        attrValues: [],
      },
      loading: true,
      edit: false,
      showModal: false, // ADDED: State to control modal visibility
    };
    this.onAttributeAdded = this.onAttributeAdded.bind(this);
    this.onAttributeRemoved = this.onAttributeRemoved.bind(this);
  }

  onAttributeAdded(attribute) {
    var attributeToUpdate = this.state.attributes.find(function (attr) {
      return attr.id === attribute.id;
    });
    if (!attributeToUpdate) {
      this.state.attributes.push(attribute);
    } else {
      this.state.attributes[this.state.attributes.indexOf(attributeToUpdate)] = attribute;
    }
    this.state.attributeToEdit = {
      id: null,
      name: "",
      attrValues: [],
    };
    // CHANGED: Use setState instead of jQuery to hide modal
    this.state.showModal = false;
    const newState = Object.assign({}, this.state);
    this.setState(newState);
  }

  onAttributeRemoved(attribute) {
    this.state.attributes = this.state.attributes.filter(attr => attr.id !== attribute.id);
    // CHANGED: Use setState instead of jQuery to hide modal
    this.state.showModal = false;
    const newState = Object.assign({}, this.state);
    this.setState(newState);
  }

  editAttribute(i, event) {
    this.state.attributeToEdit = this.state.attributes[i];
    this.state.edit = true;
    // CHANGED: Set showModal to true instead of using jQuery
    this.state.showModal = true;
    this.setState(this.state);
  }

  // ADDED: Method to handle opening modal for new attribute
  openModal = () => {
    this.setState({
      showModal: true,
      edit: false,
      attributeToEdit: {
        id: null,
        name: "",
        type: "TESTCASE",
        attrValues: [],
      }
    });
  };

  // ADDED: Method to handle closing modal
  closeModal = () => {
    this.setState({ showModal: false });
  };

  componentDidMount() {
    super.componentDidMount();
    Backend.get(this.props.router.params.project + "/attribute")
      .then(response => {
        this.state.loading = false;
        const newState = Object.assign({}, this.state, {
          attributes: response,
        });
        this.setState(newState);
      })
      .catch(error => console.log(error));
  }

  render() {
    return (
      <div>
        <div className="sweet-loading">
          <FadeLoader sizeUnit={"px"} size={100} color={"#135f38"} loading={this.state.loading} />
        </div>
        {this.state.attributes.map(
          function (attribute, i) {
            return (
              <div key={i} className="alert" role="alert">
                <h5 className="alert-heading">
                  <b>{attribute.name}</b>
                  <span className="edit clickable edit-icon" index={i} onClick={e => this.editAttribute(i, e)}>
                    <FontAwesomeIcon icon={faPencilAlt} />
                  </span>
                </h5>
                <p>Type: {attribute.type == "LAUNCH" ? "LAUNCH" : "TESTCASE"}</p>
                <p>{attribute.description}</p>
                <hr />
                <p className="mb-0">{attribute.attrValues.map(val => val.value).join(", ")}</p>
              </div>
            );
          }.bind(this),
        )}

        <div className="attributes-controls">
          {/* CHANGED: Removed data-toggle and data-target, added onClick handler */}
          <button type="button" className="btn btn-primary" onClick={this.openModal}>
            Add
          </button>
        </div>
        {/* CHANGED: Added conditional rendering based on showModal state */}
        {this.state.showModal && (
          <>
            {/* ADDED: Modal backdrop - positioned outside the modal dialog */}
            <div className="modal-backdrop fade show"></div>
            <div
              className="modal fade show" // ADDED: 'show' class for visibility
              id="editAttribute"
              tabIndex="-1"
              role="dialog"
              aria-labelledby="editAttributeLabel"
              aria-hidden="false" // CHANGED: Set to false when modal is shown
              style={{ display: 'block' }} // ADDED: Inline style to display modal
              onClick={this.closeModal} // CHANGED: Close modal when clicking outside dialog
            >
              <div onClick={(e) => e.stopPropagation()}> {/* ADDED: Prevent clicks inside dialog from closing modal */}
                <AttributeForm
                  project={this.props.router.params.project}
                  projectAttributes={this.state.attributes}
                  attribute={this.state.attributeToEdit}
                  onAttributeRemoved={this.onAttributeRemoved}
                  onAttributeAdded={this.onAttributeAdded}
                  edit={this.state.edit}
                  closeModal={this.closeModal} // ADDED: Pass closeModal function to AttributeForm
                />
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
}

export default withRouter(Attributes);

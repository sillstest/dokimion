import React, { useState, useEffect, useCallback } from "react";
import * as Utils from "../common/Utils";
import Backend from "../services/backend";
import ControlledPopup from "../common/ControlledPopup";

const LauncherForm = ({
  projectId,
  launcherDescriptors = [],
  launcherConfig,
  configIndex,
  selectableType = true,
  handleLauncherChange,
}) => {
  const [project, setProject] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const getProject = useCallback(() => {
    if (!projectId) return;

    Backend.get(`project/${projectId}`)
      .then(response => {
        setProject(response);
      })
      .catch(error => {
        setErrorMessage(`getProject::Couldn't get project, error: ${error}`);
      });
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      getProject();
    }
  }, [projectId, getProject]);

  const handleLauncherBooleanChange = (event, index, propertyKey) => {
    event.target.value = event.target.checked;
    handleLauncherChange(event, index, propertyKey);
  };

  const getLauncherPropertyBooleanTemplate = (descriptorItem, config, index) => {
    const isChecked = config.properties[descriptorItem.key]?.toLowerCase() === "true";

    return (
      <input
        type="checkbox"
        className="form-control"
        name={descriptorItem.key}
        value={config.properties[descriptorItem.key] || ""}
        index={index}
        placeholder={descriptorItem.defaultValues.join(", ")}
        onChange={e => handleLauncherBooleanChange(e, index, descriptorItem.key)}
        checked={isChecked}
      />
    );
  };

  const getLauncherPropertyPasswordTemplate = (descriptorItem, config, index) => {
    return (
      <input
        type="password"
        className="form-control"
        name={descriptorItem.key}
        value={config.properties[descriptorItem.key] || ""}
        index={index}
        onChange={e => handleLauncherChange(e, index, descriptorItem.key)}
      />
    );
  };

  const getLauncherPropertyTextTemplate = (descriptorItem, config, index) => {
    return (
      <input
        type="text"
        className="form-control"
        name={descriptorItem.key}
        value={config.properties[descriptorItem.key] || ""}
        index={index}
        onChange={e => handleLauncherChange(e, index, descriptorItem.key)}
      />
    );
  };

  const getLauncherPropertyTextDisabledTemplate = (descriptorItem, config, index) => {
    return (
      <input
        type="text"
        className="form-control"
        name={descriptorItem.key}
        value={config.properties[descriptorItem.key] || ""}
        index={index}
        disabled
        onChange={e => handleLauncherChange(e, index, descriptorItem.key)}
      />
    );
  };

  const getLauncherPropertySelectRestrictedTemplate = (descriptorItem, config, index) => {
    return (
      <select
        className="form-control"
        name={descriptorItem.key}
        value={config.properties[descriptorItem.key] || ""}
        index={index}
        onChange={e => handleLauncherChange(e, index, descriptorItem.key)}
      >
        {descriptorItem.defaultValues.map((defaultValue, idx) => (
          <option key={idx} value={defaultValue}>
            {defaultValue}
          </option>
        ))}
      </select>
    );
  };

  const getLauncherPropertySelectEditableTemplate = (descriptorItem, config, index) => {
    return (
      <input
        type="text"
        className="form-control"
        name={descriptorItem.key}
        value={config.properties[descriptorItem.key] || ""}
        index={index}
        placeholder={descriptorItem.defaultValues.join(", ")}
        onChange={e => handleLauncherChange(e, index, descriptorItem.key)}
      />
    );
  };

  const getLauncherPropertyFormTemplate = (descriptorItem, config, index) => {
    if (descriptorItem.defaultValues.length > 1 && !descriptorItem.restricted) {
      return getLauncherPropertySelectEditableTemplate(descriptorItem, config, index);
    }
    if (descriptorItem.defaultValues.length > 1 && descriptorItem.restricted) {
      return getLauncherPropertySelectRestrictedTemplate(descriptorItem, config, index);
    }
    if (descriptorItem.boolean) {
      return getLauncherPropertyBooleanTemplate(descriptorItem, config, index);
    }
    if (descriptorItem.password) {
      return getLauncherPropertyPasswordTemplate(descriptorItem, config, index);
    }
    if (descriptorItem.restricted) {
      return getLauncherPropertyTextDisabledTemplate(descriptorItem, config, index);
    }
    return getLauncherPropertyTextTemplate(descriptorItem, config, index);
  };

  const getLauncherPropertyTemplate = (descriptorItem, config, index) => {
    return (
      <div key={descriptorItem.key} className="form-group row">
        <label className="col-4 col-form-label">{descriptorItem.name}</label>
        <div className="col-8">{getLauncherPropertyFormTemplate(descriptorItem, config, index)}</div>
      </div>
    );
  };

  const getLauncherForm = (config, index) => {
    if (!config) {
      return "";
    }

    const descriptor = Utils.getLaunchDescriptor(launcherDescriptors, config.launcherId) || {};

    return (
      <div className="card-text">
        <ControlledPopup popupMessage={errorMessage} />
        <form>
          {selectableType && (
            <div>
              <div className="form-group row">
                <label className="col-4 col-form-label">Launcher</label>
                <div className="col-8">
                  <select
                    id="launcherId"
                    className="form-control"
                    index={index}
                    onChange={e => handleLauncherChange(e, index, "launcherId")}
                    value={config.launcherId || ""}
                  >
                    <option value=""> </option>
                    {launcherDescriptors.map((desc, idx) => (
                      <option key={idx} value={desc.launcherId}>
                        {desc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group row">
                <label className="col-4 col-form-label">Name</label>
                <div className="col-8">
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={config.name || ""}
                    index={index}
                    onChange={e => handleLauncherChange(e, index, "name")}
                  />
                </div>
              </div>
            </div>
          )}
          {!selectableType && (
            <div className="form-group row">
              <label className="col-12 col-form-label">
                Launcher: {launcherConfig?.name || ""}
              </label>
            </div>
          )}
          {(descriptor.configDescriptors || []).map(descriptorItem =>
            getLauncherPropertyTemplate(descriptorItem, config, index)
          )}
        </form>
      </div>
    );
  };

  return <div>{getLauncherForm(launcherConfig, configIndex)}</div>;
};

export default LauncherForm;

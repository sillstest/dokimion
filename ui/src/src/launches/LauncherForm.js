/* eslint-disable eqeqeq */
import React, { useState, useEffect } from "react";
import * as Utils from "../common/Utils";
import ControlledPopup from "../common/ControlledPopup";

function LauncherForm({
  launcherConfig: launcherConfigProp,
  launcherDescriptors: launcherDescriptorsProp,
  configIndex: configIndexProp,
  selectableType: selectableTypeProp,
  handleLauncherChange,
}) {
  const [launcherConfig, setLauncherConfig] = useState(launcherConfigProp || {});
  const [launcherDescriptors, setLauncherDescriptors] = useState(launcherDescriptorsProp || []);
  const [configIndex, setConfigIndex] = useState(configIndexProp || 0);
  const [selectableType] = useState(selectableTypeProp !== undefined ? selectableTypeProp : true);
  const [errorMessage] = useState("");

  useEffect(() => {
    if (launcherConfigProp !== undefined) setLauncherConfig(launcherConfigProp);
    if (launcherDescriptorsProp !== undefined) setLauncherDescriptors(launcherDescriptorsProp);
    if (configIndexProp !== undefined) setConfigIndex(configIndexProp);
  }, [launcherConfigProp, launcherDescriptorsProp, configIndexProp]);

  function handleLauncherBooleanChange(event, index, propertyKey) {
    event.target.value = event.target.checked;
    if (handleLauncherChange) handleLauncherChange(event, index, propertyKey);
  }

  function getLauncherPropertyFormTemplate(descriptorItem, config, index) {
    if (descriptorItem.defaultValues.length > 1 && !descriptorItem.restricted) {
      return (
        <input
          type="text"
          className="form-control"
          name={descriptorItem.key}
          value={config.properties[descriptorItem.key] || ""}
          index={index}
          placeholder={descriptorItem.defaultValues.join(", ")}
          onChange={e => handleLauncherChange && handleLauncherChange(e, index, descriptorItem.key)}
        />
      );
    }
    if (descriptorItem.defaultValues.length > 1 && descriptorItem.restricted) {
      return (
        <select
          className="form-control"
          name={descriptorItem.key}
          value={config.properties[descriptorItem.key] || ""}
          index={index}
          onChange={e => handleLauncherChange && handleLauncherChange(e, index, descriptorItem.key)}
        >
          {descriptorItem.defaultValues.map(v => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      );
    }
    if (descriptorItem.boolean) {
      const isChecked = (config.properties[descriptorItem.key] || "").toLowerCase() === "true";
      return (
        <input
          type="checkbox"
          className="form-control"
          name={descriptorItem.key}
          checked={isChecked}
          value={config.properties[descriptorItem.key] || ""}
          onChange={e => handleLauncherBooleanChange(e, index, descriptorItem.key)}
        />
      );
    }
    if (descriptorItem.password) {
      return (
        <input
          type="password"
          className="form-control"
          name={descriptorItem.key}
          value={config.properties[descriptorItem.key] || ""}
          onChange={e => handleLauncherChange && handleLauncherChange(e, index, descriptorItem.key)}
        />
      );
    }
    if (descriptorItem.restricted) {
      return (
        <input
          type="text"
          className="form-control"
          name={descriptorItem.key}
          value={config.properties[descriptorItem.key] || ""}
          disabled
          onChange={e => handleLauncherChange && handleLauncherChange(e, index, descriptorItem.key)}
        />
      );
    }
    return (
      <input
        type="text"
        className="form-control"
        name={descriptorItem.key}
        value={config.properties[descriptorItem.key] || ""}
        onChange={e => handleLauncherChange && handleLauncherChange(e, index, descriptorItem.key)}
      />
    );
  }

  if (!launcherConfig) return null;
  const descriptor = Utils.getLaunchDescriptor(launcherDescriptors, launcherConfig.launcherId) || {};

  return (
    <div>
      <p className="card-text">
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
                    onChange={e => handleLauncherChange && handleLauncherChange(e, configIndex, "launcherId")}
                  >
                    <option> </option>
                    {launcherDescriptors.map(d => (
                      <option
                        key={d.launcherId}
                        value={d.launcherId}
                        selected={d.launcherId == launcherConfig.launcherId}
                      >
                        {d.name}
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
                    value={launcherConfig.name || ""}
                    onChange={e => handleLauncherChange && handleLauncherChange(e, configIndex, "name")}
                  />
                </div>
              </div>
            </div>
          )}
          {!selectableType && (
            <div className="form-group row">
              <label className="col-12 col-form-label">Launcher: {(launcherConfig || {}).name || ""}</label>
            </div>
          )}
          {(descriptor.configDescriptors || []).map(descriptorItem => (
            <div key={descriptorItem.key} className="form-group row">
              <label className="col-4 col-form-label">{descriptorItem.name}</label>
              <div className="col-8">
                {getLauncherPropertyFormTemplate(descriptorItem, launcherConfig, configIndex)}
              </div>
            </div>
          ))}
        </form>
      </p>
    </div>
  );
}

export default LauncherForm;

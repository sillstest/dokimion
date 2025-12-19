import React from "react";
import { useParams } from "react-router-dom";
import LaunchesStatisticsOverview from "../launches/LaunchesStatisticsOverview";
import LaunchTestcasesHeatmap from "../launches/LaunchTestcasesHeatmap";

const LaunchesStatistics = () => {
  const { project: projectId } = useParams();

  return (
    <div>
      <ul className="nav nav-tabs" id="tcTabs" role="tablist">
        <li className="nav-item">
          <a
            className="nav-link active"
            id="overview-tab"
            data-toggle="tab"
            href="#overview"
            role="tab"
            aria-controls="overview"
            aria-selected="true"
          >
            Overview
          </a>
        </li>
        <li className="nav-item">
          <a
            className="nav-link"
            id="heatmap-tab"
            data-toggle="tab"
            href="#heatmap"
            role="tab"
            aria-controls="heatmap"
            aria-selected="false"
          >
            Heat Map
          </a>
        </li>
      </ul>

      <div className="tab-content" id="tcTabContent">
        <div 
          className="tab-pane fade show active" 
          id="overview" 
          role="tabpanel" 
          aria-labelledby="overview-tab"
        >
          <LaunchesStatisticsOverview />
        </div>

        <div 
          className="tab-pane fade show" 
          id="heatmap" 
          role="tabpanel" 
          aria-labelledby="heatmap-tab"
        >
          <LaunchTestcasesHeatmap />
        </div>
      </div>
    </div>
  );
};

export default LaunchesStatistics;

import React from "react";
import { withRouter } from "react-router";
import SubComponent from "../common/SubComponent";
import LaunchesStatisticsOverview from "../launches/LaunchesStatisticsOverview";
import LaunchTestcasesHeatmap from "../launches/LaunchTestcasesHeatmap";

class LaunchesStatistics extends SubComponent {
  state = {};

  constructor(props) {
    super(props);
    this.state.projectId = this.props.match.params.project;
  }

  render() {
    return (
      <div>
        <ul class="nav nav-tabs" id="tcTabs" role="tablist">
          <li class="nav-item">
            <a
              class="nav-link active"
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
        </ul>

        <div className="tab-content" id="tcTabContent">
          <div class="tab-pane fade show active" id="overview" role="tabpanel" aria-labelledby="overview-tab">
            <LaunchesStatisticsOverview />
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(LaunchesStatistics);

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

import React from "react";
import { withRouter } from "../common/withRouter";
import LaunchesStatisticsOverview from "../launches/LaunchesStatisticsOverview";

function LaunchesStatistics() {
  return (
    <div>
      <div className="tab-content" id="tcTabContent">
        <div className="tab-pane fade show active" id="overview" role="tabpanel" aria-labelledby="overview-tab">
          <LaunchesStatisticsOverview />
        </div>
      </div>
    </div>
  );
}

export default withRouter(LaunchesStatistics);

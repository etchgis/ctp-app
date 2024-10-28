import moment from "moment";

const module = {

  getUpdates(tripPlan) {
    const now = moment().valueOf(),
      start = tripPlan.startTime;
    const updates = {
      transit: [],
    };
    for (let i = 0; i < tripPlan.legs.length; i++) {
      const leg = tripPlan.legs[i];
      let expectedDuration = leg.startTime - start,
        estimatedDuration = leg.startTime - now;
      if (estimatedDuration < expectedDuration && leg.agencyName && leg.route) {
        updates.transit.push({
          index: i,
          delayed: estimatedDuration - expectedDuration,
        });
      }
    }
    return updates;
  }

}

export default module;
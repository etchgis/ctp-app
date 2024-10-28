import { makeAutoObservable, runInAction } from 'mobx';
import TripPlan from '../models/trip-plan';
import TripRequest from '../models/trip-request';

class Trip {

  request = new TripRequest();
  plans = [];
  selectedPlan = null;
  // selectedPlan = samplePlan;
  generatingPlans = false;
  queryId = -1;

  constructor(rootStore) {
    makeAutoObservable(this);
    this.rootStore = rootStore;
  }

  create() {
    this.reset();
  }

  updateOrigin(origin) {
    runInAction(() => {
      this.request.updateProperty('origin', origin);
    });
  }

  updateDestination(destination) {
    runInAction(() => {
      this.request.updateProperty('destination', destination);
    });
  }

  updateWhenAction(whenAction) {
    runInAction(() => {
      this.request.updateProperty('whenAction', whenAction);
    });
  }

  updateWhen(when) {
    runInAction(() => {
      this.request.updateProperty('whenTime', when);
    });
  }

  addMode(mode) {
    runInAction(() => {
      this.request.addMode(mode);
    });
  }

  removeMode(mode) {
    runInAction(() => {
      this.request.removeMode(mode);
    });
  }

  toggleMode(mode) {
    runInAction(() => {
      this.request.toggleMode(mode);
    });
  }

  generatePlans() {
    runInAction(() => {
      this.generatingPlans = true;
      this.queryId = Date.now();
    });
    return new Promise((resolve, reject) => {
      TripPlan.generate(this.request, this.rootStore.preferences, this.queryId)
        .then((results) => {
          if (this.queryId === results.id) {
            runInAction(() => {
              this.generatingPlans = false;
              this.plans = results.plans;
            });
            resolve(this.plans);
          }
        })
        .catch(e => {
          console.log('PLANS ERROR');
          reject(e);
        });
    });
  }

  selectPlan(plan) {
    runInAction(() => {
      this.selectedPlan = plan;
    });
  }

  appendIndoorToPlans(indoorLeg) {
    runInAction(() => {
      for (var i = 0; i < this.plans.length; i++) {
        this.plans[i].legs.push(indoorLeg);
      }
    });
  }

  prependIndoorToPlans(indoorLeg) {
    runInAction(() => {
      for (var i = 0; i < this.plans.length; i++) {
        this.plans[i].legs.unshift(indoorLeg);
      }
    });
  }

  removeIndoor() {
    runInAction(() => {
      this.selectedPlan.legs.splice(
        this.selectedPlan.legs.findIndex(l => l.mode === 'INDOOR'),
        0);
    });
  }

  setRequest(options) {
    runInAction(() => {
      this.request = options ? new TripRequest(options) : new TripRequest();
    });
  }

  reset() {
    runInAction(() => {
      this.request = new TripRequest();
      this.plans = [];
      this.selectedPlan = null;
      this.generatingPlans = false;
      this.queryId = -1;
    });
  }

}

export default Trip;
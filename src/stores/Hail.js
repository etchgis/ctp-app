import { makeAutoObservable, runInAction } from 'mobx';

class Hail {

  _rootStore = undefined;
  service = undefined;
  ride = undefined;

  constructor(rootStore) {
    makeAutoObservable(this);
    this._rootStore = rootStore;
  }

  setService(hailService) {
    runInAction(() => {
      this.service = hailService;
    });
  }

  setRide(newRide) {
    runInAction(() => {
      this.ride = newRide;
    });
  }

  reset() {
    runInAction(() => {
      this.service = undefined;
      this.ride = undefined;
    });
  }

}

export default Hail;

import { library } from '@fortawesome/fontawesome-svg-core';
import voice from './voice';
import triptracker from './triptracker';
import rerouter from './rerouter';

import {
  faAngleLeft,
  faAngleRight,
  faArrowDown,
  faArrowLeft,
  faArrowRight,
  faBuilding,
  faBuildingCircleArrowRight,
  faCalendar,
  faCalendarDay,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faCircle,
  faCircleCheck,
  faCircleNotch,
  faCircleXmark,
  faClock,
  faGear,
  faHome,
  faLocationArrow,
  faLocationDot,
  faLock,
  faMagnifyingGlass,
  faMap,
  faPlay,
  faPlus,
  faRetweet,
  faRightFromBracket,
  faRightLong,
  faRotateRight,
  faSatellite,
  faShuttleVan,
  faStar,
  faTrash,
  faTriangleExclamation,
  faTruckFront,
  faUser,
  faWifi,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { geolocation } from '../models/geolocation';

const module = {

  init(store) {
    library.add(
      faAngleLeft,
      faAngleRight,
      faArrowDown,
      faArrowLeft,
      faArrowRight,
      faBuilding,
      faBuildingCircleArrowRight,
      faCalendar,
      faCalendarDay,
      faChevronDown,
      faChevronLeft,
      faChevronRight,
      faCircle,
      faCircleCheck,
      faCircleNotch,
      faCircleXmark,
      faClock,
      faGear,
      faHome,
      faLocationArrow,
      faLocationDot,
      faLock,
      faMagnifyingGlass,
      faMap,
      faPlay,
      faPlus,
      faRetweet,
      faRightFromBracket,
      faRightLong,
      faRotateRight,
      faSatellite,
      faShuttleVan,
      faStar,
      faTrash,
      faTriangleExclamation,
      faTruckFront,
      faUser,
      faWifi,
      faXmark,
    );
    voice.init();
    triptracker.init(store);
    rerouter.init(store);
    geolocation.init();
  },

};

export default module;

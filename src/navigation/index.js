import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
// import createMapStackNavigator from './MapStackNavigator';

import { interpolators, transitions } from './animations';
import Landing from '../views/Landing';
import Login from '../views/Login/Login';
import ConfirmLogin from '../views/Login/ConfirmLogin';

// register
import Account from '../views/Register/Account';
import ConfirmEmail from '../views/Register/ConfirmEmail';

// onboard
import LocationServices from '../views/Onboard/LocationServices';
import Contact from '../views/Onboard/Contact';
import Address from '../views/Onboard/Address';
import Caregiver from '../views/Onboard/Caregiver';
import EnhancedMobilityOptions from '../views/Onboard/EnhancedMobilityOptions';
import ConfirmPhone from '../views/Onboard/ConfirmPhone';

// profile
import Menu from '../views/Account/Menu';
import Profile from '../views/Account/Profile';
import Caregivers from '../views/Account/Caregivers';
import Dependents from '../views/Account/Dependents';
import Feedback from '../views/Account/Feedback';
import Favorites from '../views/Account/Favorites';
import TripPreferences from '../views/Account/TripPreferences';
import Password from '../views/Account/Password';
import Accessibility from '../views/Account/Accessibility';
import Notifications from '../views/Account/Notifications';
import TermsAndConditions from '../views/Account/TermsAndConditions';

// schedule a trip
import Plan from '../views/ScheduleTrip/Plan';
import Results from '../views/ScheduleTrip/Results';
import Selected from '../views/ScheduleTrip/Selected';
import Hail from '../views/ScheduleTrip/Hail';

import Home from '../views/Home';
import Schedule from '../views/Schedule';
import DependentSchedule from '../views/Schedule/DependentSchedule';
import TripLog from '../views/TripLog';
import ForgotPassword from '../views/RecoverAccount/ForgotPassword';
import ChangePassword from '../views/RecoverAccount/ChangePassword';

// navigation
import Navigator from '../views/Navigator';
import Tracker from '../views/Tracker';

import Spinner from '../components/Spinner';
import { observer } from 'mobx-react';
import { useStore } from '../stores/RootStore';
import SideMenu from '../components/SideMenu';

// const Stack = createMapStackNavigator();
const Stack = createStackNavigator();

const RootStack = observer(() => {
  const store = useStore();
  return (
    <>
      <Stack.Navigator>

        <Stack.Screen
          name="landing"
          component={Landing}
          options={{
            headerShown: false,
            gestureEnabled: false,
            cardStyleInterpolator: interpolators.fade,
            transitionSpec: {
              open: transitions.timing.linear,
              close: transitions.timing.linear,
            },
          }}
        />

        <Stack.Screen
          name="login"
          component={Login}
          options={{
            headerShown: false,
            gestureEnabled: false,
            cardStyleInterpolator: interpolators.slideVertical,
            transitionSpec: {
              open: transitions.timing.linear,
              close: transitions.timing.linear,
            },
          }}
        />

        <Stack.Screen
          name="login.confirm"
          component={ConfirmLogin}
          options={{
            headerShown: false,
            gestureEnabled: false,
            cardStyleInterpolator: interpolators.slideVertical,
            transitionSpec: {
              open: transitions.timing.linear,
              close: transitions.timing.linear,
            },
          }}
        />

        <Stack.Screen
          name="forgotPassword"
          component={ForgotPassword}
          options={{
            headerShown: false,
            gestureEnabled: false,
            cardStyleInterpolator: interpolators.slideHorizontal,
            transitionSpec: {
              open: transitions.timing.linear,
              close: transitions.timing.linear,
            },
          }}
        />

        <Stack.Screen
          name="changePassword"
          component={ChangePassword}
          options={{
            headerShown: false,
            gestureEnabled: false,
            cardStyleInterpolator: interpolators.slideHorizontal,
            transitionSpec: {
              open: transitions.timing.linear,
              close: transitions.timing.linear,
            },
          }}
        />

        <Stack.Screen
          name="register.account"
          component={Account}
          options={{
            headerShown: false,
            gestureEnabled: false,
            cardStyleInterpolator: interpolators.slideVertical,
            transitionSpec: {
              open: transitions.timing.linear,
              close: transitions.timing.linear,
            },
          }}
        />

        <Stack.Screen
          name="register.confirm"
          component={ConfirmEmail}
          options={{
            headerShown: false,
            gestureEnabled: false,
            cardStyleInterpolator: interpolators.slideHorizontal,
            transitionSpec: {
              open: transitions.timing.linear,
              close: transitions.timing.linear,
            },
          }}
        />

        <Stack.Screen
          name="onboard.location"
          component={LocationServices}
          options={{
            headerShown: false,
            gestureEnabled: false,
            cardStyleInterpolator: interpolators.slideHorizontal,
            transitionSpec: {
              open: transitions.timing.linear,
              close: transitions.timing.linear,
            },
          }}
        />

        <Stack.Screen
          name="onboard.contact"
          component={Contact}
          options={{
            headerShown: false,
            gestureEnabled: false,
            cardStyleInterpolator: interpolators.slideHorizontal,
            transitionSpec: {
              open: transitions.timing.linear,
              close: transitions.timing.linear,
            },
          }}
        />

        <Stack.Screen
          name="onboard.address"
          component={Address}
          options={{
            headerShown: false,
            gestureEnabled: false,
            cardStyleInterpolator: interpolators.slideHorizontal,
            transitionSpec: {
              open: transitions.timing.linear,
              close: transitions.timing.linear,
            },
          }}
        />

        <Stack.Screen
          name="onboard.caregiver"
          component={Caregiver}
          options={{
            headerShown: false,
            gestureEnabled: false,
            cardStyleInterpolator: interpolators.slideHorizontal,
            transitionSpec: {
              open: transitions.timing.linear,
              close: transitions.timing.linear,
            },
          }}
        />

        <Stack.Screen
          name="onboard.enhancedMobilityOptions"
          component={EnhancedMobilityOptions}
          options={{
            headerShown: false,
            gestureEnabled: false,
            cardStyleInterpolator: interpolators.slideHorizontal,
            transitionSpec: {
              open: transitions.timing.linear,
              close: transitions.timing.linear,
            },
          }}
        />

        <Stack.Screen
          name="onboard.confirm"
          component={ConfirmPhone}
          options={{
            headerShown: false,
            gestureEnabled: false,
            cardStyleInterpolator: interpolators.slideHorizontal,
            transitionSpec: {
              open: transitions.timing.linear,
              close: transitions.timing.linear,
            },
          }}
        />

        <Stack.Screen
          name="home"
          component={Home}
          options={{
            headerShown: false,
            gestureEnabled: false,
            cardStyleInterpolator: interpolators.fade,
            transitionSpec: {
              open: transitions.timing.linear,
              close: transitions.timing.linear,
            },
          }}
        />

        <Stack.Screen
          name="schedule"
          component={Schedule}
          options={{
            headerShown: false,
            gestureEnabled: false,
            cardStyleInterpolator: interpolators.fade,
            transitionSpec: {
              open: transitions.timing.linear,
              close: transitions.timing.linear,
            },
          }}
        />

        <Stack.Screen
          name="schedule.dependents"
          component={DependentSchedule}
          options={{
            headerShown: false,
            gestureEnabled: false,
            cardStyleInterpolator: interpolators.fade,
            transitionSpec: {
              open: transitions.timing.linear,
              close: transitions.timing.linear,
            },
          }}
        />

        <Stack.Screen
          name="tripLog"
          component={TripLog}
          options={{
            headerShown: false,
            gestureEnabled: false,
            cardStyleInterpolator: interpolators.slideHorizontal,
            transitionSpec: {
              open: transitions.timing.linear,
              close: transitions.timing.linear,
            },
          }}
        />

        <Stack.Screen
          name="account.menu"
          component={Menu}
          options={{
            headerShown: false,
            gestureEnabled: false,
            cardStyleInterpolator: interpolators.slideHorizontal,
            transitionSpec: {
              open: transitions.timing.linear,
              close: transitions.timing.linear,
            },
          }}
        />

        <Stack.Screen
          name="account.profile"
          component={Profile}
          options={{
            headerShown: false,
            gestureEnabled: false,
            cardStyleInterpolator: interpolators.slideHorizontal,
            transitionSpec: {
              open: transitions.timing.linear,
              close: transitions.timing.linear,
            },
          }}
        />

        <Stack.Screen
          name="account.caregivers"
          component={Caregivers}
          options={{
            headerShown: false,
            gestureEnabled: false,
            cardStyleInterpolator: interpolators.slideHorizontal,
            transitionSpec: {
              open: transitions.timing.linear,
              close: transitions.timing.linear,
            },
          }}
        />

        <Stack.Screen
          name="account.dependents"
          component={Dependents}
          options={{
            headerShown: false,
            gestureEnabled: false,
            cardStyleInterpolator: interpolators.slideHorizontal,
            transitionSpec: {
              open: transitions.timing.linear,
              close: transitions.timing.linear,
            },
          }}
        />

        <Stack.Screen
          name="account.feedback"
          component={Feedback}
          options={{
            headerShown: false,
            gestureEnabled: false,
            cardStyleInterpolator: interpolators.slideHorizontal,
            transitionSpec: {
              open: transitions.timing.linear,
              close: transitions.timing.linear,
            },
          }}
        />

        <Stack.Screen
          name="account.favorites"
          component={Favorites}
          options={{
            headerShown: false,
            gestureEnabled: false,
            cardStyleInterpolator: interpolators.slideHorizontal,
            transitionSpec: {
              open: transitions.timing.linear,
              close: transitions.timing.linear,
            },
          }}
        />

        <Stack.Screen
          name="account.tripPreferences"
          component={TripPreferences}
          options={{
            headerShown: false,
            gestureEnabled: false,
            cardStyleInterpolator: interpolators.slideHorizontal,
            transitionSpec: {
              open: transitions.timing.linear,
              close: transitions.timing.linear,
            },
          }}
        />

        <Stack.Screen
          name="account.password"
          component={Password}
          options={{
            headerShown: false,
            gestureEnabled: false,
            cardStyleInterpolator: interpolators.slideHorizontal,
            transitionSpec: {
              open: transitions.timing.linear,
              close: transitions.timing.linear,
            },
          }}
        />

        <Stack.Screen
          name="account.accessibility"
          component={Accessibility}
          options={{
            headerShown: false,
            gestureEnabled: false,
            cardStyleInterpolator: interpolators.slideHorizontal,
            transitionSpec: {
              open: transitions.timing.linear,
              close: transitions.timing.linear,
            },
          }}
        />

        <Stack.Screen
          name="account.notifications"
          component={Notifications}
          options={{
            headerShown: false,
            gestureEnabled: false,
            cardStyleInterpolator: interpolators.slideHorizontal,
            transitionSpec: {
              open: transitions.timing.linear,
              close: transitions.timing.linear,
            },
          }}
        />

        <Stack.Screen
          name="account.termsAndConditions"
          component={TermsAndConditions}
          options={{
            headerShown: false,
            gestureEnabled: false,
            cardStyleInterpolator: interpolators.slideHorizontal,
            transitionSpec: {
              open: transitions.timing.linear,
              close: transitions.timing.linear,
            },
          }}
        />

        <Stack.Screen
          name="schedule.plan"
          component={Plan}
          options={{
            headerShown: false,
            gestureEnabled: false,
            cardStyleInterpolator: interpolators.slideHorizontal,
            transitionSpec: {
              open: transitions.timing.linear,
              close: transitions.timing.linear,
            },
          }}
        />

        <Stack.Screen
          name="schedule.results"
          component={Results}
          options={{
            headerShown: false,
            gestureEnabled: false,
            cardStyleInterpolator: interpolators.slideHorizontal,
            transitionSpec: {
              open: transitions.timing.linear,
              close: transitions.timing.linear,
            },
          }}
        />

        <Stack.Screen
          name="schedule.selected"
          component={Selected}
          options={{
            headerShown: false,
            gestureEnabled: false,
            cardStyleInterpolator: interpolators.slideHorizontal,
            transitionSpec: {
              open: transitions.timing.linear,
              close: transitions.timing.linear,
            },
          }}
        />

        <Stack.Screen
          name="schedule.hail"
          component={Hail}
          options={{
            headerShown: false,
            gestureEnabled: false,
            cardStyleInterpolator: interpolators.slideHorizontal,
            transitionSpec: {
              open: transitions.timing.linear,
              close: transitions.timing.linear,
            },
          }}
        />

        <Stack.Screen
          name="navigator"
          component={Navigator}
          options={{
            headerShown: false,
            gestureEnabled: false,
            cardStyleInterpolator: interpolators.fade,
            transitionSpec: {
              open: transitions.timing.linear,
              close: transitions.timing.linear,
            },
          }}
        />

        <Stack.Screen
          name="tracker"
          component={Tracker}
          options={{
            headerShown: false,
            gestureEnabled: false,
            cardStyleInterpolator: interpolators.fade,
            transitionSpec: {
              open: transitions.timing.linear,
              close: transitions.timing.linear,
            },
          }}
        />

      </Stack.Navigator>

      {store.display.spinner &&
        <Spinner
          opacity={store.display.spinnerOpacity}
        />
      }

      <SideMenu />
    </>
  );
});

const linking = {
  prefixes: ['https://*.etch.app/complete-trip/activate', 'complete-trip://'],
  config: {
    screens: {
      activate: {
        path: 'activate/:token',
        parse: {
          token: (token) => `${token}`,
        },
      },
      notFound: '*',
    },
  },
};

const RootNavigation = React.forwardRef((props, ref) => (
  <NavigationContainer
    linking={linking}
    theme={{
      colors: {
        background: 'transparent',
      },
    }}
    {...props}
    ref={ref}
  >
    <RootStack />
  </NavigationContainer>
));

RootNavigation.displayName = 'RootNavigation';

export default RootNavigation;

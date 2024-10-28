import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import messaging from '@react-native-firebase/messaging';
import {onBackgroundMessageReceived} from './src/utils/notifications';

AppRegistry.registerComponent(appName, () => {
  // Notifications handlers
  messaging().setBackgroundMessageHandler(onBackgroundMessageReceived);

  return App;
});

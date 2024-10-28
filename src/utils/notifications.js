import config from '../config';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import {Platform} from 'react-native';

// When the app is in the background or closed and the user taps
// on a notification, this function will be called.
export async function onBackgroundMessageReceived(message) {
  try {
    console.log('Background message received. ', message);
    // Android messages received in the background will trigger both `onMessage` and this `onBackgroundMessageReceived`.
    // Only display the notification when the app is in the background for iOS.
    if (Platform.OS === 'ios') {
      onMessageReceived(message);
    }
  } catch (error) {
    console.log('unable to display notification ::: ', error);
  }
}

// Note that an async function or a function that returns a Promise
// is required for both subscribers.
export async function onMessageReceived(message) {
  console.log('Message received. ', message);
  generateNotification(message.notification.title, message.notification.body);
}

export async function generateNotification(title, body) {
  try {
    // Create a channel (required for Android)
    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
    });

    // Display a notification
    await notifee.displayNotification({
      title: title,
      body: body,
      ios: {
        sound: 'default',
      },
      android: {
        channelId,
        // smallIcon: 'name-of-a-small-icon', // optional, defaults to 'ic_launcher'.
        // pressAction is needed if you want the notification to open the app when pressed
        pressAction: {
          id: 'default',
        },
      },
    });
  } catch (error) {
    console.log('unable to display notification ::: ', error);
  }
}

export const checkNotificationsPermissions = async registerDevice => {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    console.log('Notifications authorization status ::: ', enabled, authStatus);

    try {
      let token = await messaging().getToken();
      console.log('device token received ::: ', token);
      registerDevice(token);
    } catch (error) {
      console.log('unable to get device token ::: ', error);
    }
  } catch (error) {
    console.log('unable to check notifications permissions ::: ', error);
  }
};

export const registerDevice = async (deviceToken, accessToken) => {
  if (deviceToken) {
    // we want to grab the notifications endpoint from the config file
    // and use fetch to send a POST request to the endpoint with the deviceToken
    // as the body of the request
    fetch(`${config.SERVICES.notifications.url}/devices/register`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-api-key': config.SERVICES.notifications.xApiKey,
      },
      body: JSON.stringify({
        token: deviceToken,
        application: 'completeTrip',
        platform: Platform.OS,
      }),
    });
  }
};

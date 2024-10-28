import { Dimensions, Platform } from 'react-native';
import { isTablet } from 'react-native-device-info'
import config from '../config';

export const screen = {
  width: Dimensions.get('window').width,
  height: Dimensions.get('window').height,
};
export const isIphone = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isIphoneX = Platform.OS === 'ios' && screen.height >= 812;
export const deviceMultiplier = isTablet() ? config.TABLET_MULTIPLIER : 1;

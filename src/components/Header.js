import React from 'react';
import {
  Pressable,
  StyleSheet, Text, View,
} from 'react-native';
import PropTypes from 'prop-types';
import {
  Colors, Devices, Typography,
} from '../styles';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useFontScale } from '../utils/fontScaling';
import config from '../config';
import { deviceMultiplier } from '../styles/devices';
import translator from '../models/translator';
import { useStore } from '../stores/RootStore';

const styles = StyleSheet.create({
  container: {
    minHeight: (72 * deviceMultiplier) + (Devices.isIphoneX ? 32 : 0),
    display: 'flex',
    flexDirection: 'row',
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 30 * deviceMultiplier,
    height: 30 * deviceMultiplier,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  title: {
    flex: 1,
    ...Typography.h3,
    color: Colors.primary1,
    textAlign: 'center',
  },
});

const Header = ({
  mode,
  title,
  children,
  onBackPress,
  backLabel
}) => {

  const store = useStore();
  const currentFontScale = useFontScale();

  return (
    <View style={styles.container}>

      <Text
        style={styles.title}
        maxFontSizeMultiplier={config.MAX_FONT_SCALE}
      >
        {title}
      </Text>

      <Pressable
        style={styles.backButton}
        onPress={onBackPress}
        accessibilityLabel={backLabel}
        accessibilityLanguage={store.preferences.language || 'en'}
      >
        <FontAwesomeIcon
          icon="chevron-left"
          size={20 * deviceMultiplier * Math.min(config.MAX_FONT_SCALE, currentFontScale)}
        />
      </Pressable>

    </View>
  );
};

Header.propTypes = {
  mode: PropTypes.oneOf(['light', 'dark']),
  title: PropTypes.string,
  onBackPress: PropTypes.func,
  backLabel:PropTypes.string,
};

Header.defaultProps = {
  mode: 'light',
  title: null,
  onBackPress: null,
  backLabel: translator.t('global.backLabelDefault'),
};

export default Header;

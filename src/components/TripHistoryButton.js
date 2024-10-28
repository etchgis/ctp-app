import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Colors, Typography } from '../styles';
import { useFontScale } from '../utils/fontScaling';
import config from '../config';
import translator from '../models/translator';

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#02597E',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 100,
  },
  label: {
    ...Typography.h5,
    color: Colors.white,
    fontWeight: 'bold',
    marginHorizontal: 10,
  },
  icon: {
    color: Colors.white,
    marginLeft: 'auto',
  },
});

const TripHistoryButton = ({
  onPress,
  onLayout,
}) => {

  const currentFontScale = useFontScale();

  const buttonStyle = {
    ...styles.button,
  };

  const handleOnLayout = (e) => {
    if (onLayout) {
      onLayout(e);
    }
  };

  return (
    <TouchableOpacity
      onLayout={handleOnLayout}
      style={buttonStyle}
      onPress={() => {
        onPress && onPress();
      }}
    >
      <Text
        style={styles.label}
        maxFontSizeMultiplier={config.MAX_FONT_SCALE}
      >{translator.t('components.tripHistory.title')}</Text>
      <FontAwesomeIcon
        style={styles.icon}
        icon="chevron-right"
        size={12 * Math.min(config.MAX_FONT_SCALE, currentFontScale)}
      />
    </TouchableOpacity>
  );
};

TripHistoryButton.propTypes = {
  onPress: PropTypes.func,
  onLayout: PropTypes.func,
};

TripHistoryButton.defaultProps = {
};

export default TripHistoryButton;

import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import PropTypes from 'prop-types';
import { Colors, Typography } from '../styles';
import config from '../config';
import { deviceMultiplier } from '../styles/devices';

const styles = StyleSheet.create({
  button: {
    // height: 40,
    minHeight: 40 * deviceMultiplier,
    marginBottom: 14,
    backgroundColor: Colors.primary1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary1,
    width: 300,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledStyle: {
    backgroundColor: Colors.primary2,
    borderColor: Colors.primary2,
  },
  label: {
    color: Colors.white,
    ...Typography.h3,
  },
});

const Button = ({
  buttonStyle,
  disabledButtonStyle,
  label,
  labelStyle,
  width,
  gradientStyle,
  onPress,
  disabled,
}) => {

  const bStyle = {
    ...styles.button,
    width,
    ...buttonStyle,
    ...(disabled ? styles.disabledStyle : {}),
    ...(disabled ? disabledButtonStyle : {}),
  };

  const lStyle = {
    ...styles.label,
    ...labelStyle,
  };

  return (
    <Pressable
      style={bStyle}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
    >
      <Text style={lStyle}
        adjustsFontSizeToFit
        maxFontSizeMultiplier={config.MAX_FONT_SCALE}
      >{label}</Text>
    </Pressable>
  );
};

Button.propTypes = {
  buttonStyle: PropTypes.object,
  disabledButtonStyle: PropTypes.object,
  label: PropTypes.string,
  labelStyle: PropTypes.object,
  width: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  onPress: PropTypes.func,
  disabled: PropTypes.bool,
};

Button.defaultProps = {
  buttonStyle: {},
  disabledButtonStyle: {},
  label: '',
  labelStyle: {},
  width: '100%',
  onPress: null,
  disabled: false,
};

export default Button;

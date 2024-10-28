import React from 'react';
import {
  Pressable,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Colors, Typography } from '../styles';
import config from '../config';
import { deviceMultiplier } from '../styles/devices';

const styles = StyleSheet.create({
  icon: {
    paddingHorizontal: 18 * deviceMultiplier,
    color: Colors.primary1,
  },
  input: {
    borderColor: Colors.primary1,
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 40 * deviceMultiplier,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  textInput: {
    flex: 1,
    height: '100%',
    paddingLeft: 0,
    paddingRight: 0,
  },
  label: {
    ...Typography.h5,
    marginBottom: 9,
  },
});

const Input = React.forwardRef(({
  leftIconName,
  leftIconProperties,
  rightIconName,
  rightIconProperties,
  placeholder = '',
  label,
  onFocus,
  onBlur,
  onChangeText,
  onSubmitEditing,
  onKeyPress,
  returnKeyType,
  secureTextEntry,
  keyboardType,
  inputStyle,
  textStyle,
  value,
  onLeftIconPress,
  onRightIconPress,
  selectTextOnFocus,
  disabled,
  autoComplete,
  textContentType,
}, ref) => {
  const leftIcon = (name) => {
    return (
      <Pressable
        onPress={onLeftIconPress}
      >
        <FontAwesomeIcon
          icon={name}
          style={styles.icon}
          size={16 * deviceMultiplier}
        />
      </Pressable>
    );
  };

  const rightIcon = (name) => {
    return (
      <Pressable
        onPress={onRightIconPress}
      >
        <FontAwesomeIcon
          icon={name}
          style={styles.icon}
          size={16 * deviceMultiplier}
        />
      </Pressable>
    );
  };

  const iStyle = {
    ...styles.input,
    ...inputStyle,
  };

  const tStyle = {
    ...styles.textInput,
    ...Typography.h6,
    ...textStyle,
  };
  if (!leftIconName) {
    tStyle.paddingLeft = 16;
  }
  if (!rightIconName) {
    tStyle.paddingRight = 16;
  }

  return (
    <View>
      {label
        && <Text style={{ ...styles.label }} maxFontSizeMultiplier={config.MAX_FONT_SCALE}>{label}</Text>}
      <View style={iStyle}>
        {leftIconName
          && leftIcon(leftIconName, leftIconProperties)}
        <TextInput
          ref={ref}
          style={tStyle}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={Colors.primary2}
          onFocus={onFocus}
          onBlur={onBlur}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          onKeyPress={onKeyPress}
          returnKeyType={returnKeyType}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={autoComplete}
          selectTextOnFocus
          editable={!disabled}
          textContentType={textContentType}
          maxFontSizeMultiplier={config.MAX_FONT_SCALE + 0.25}
        />
        {rightIconName
          && rightIcon(rightIconName, rightIconProperties)}
      </View>
    </View>

  );
});

Input.propTypes = {
  leftIconName: PropTypes.string,
  leftIconProperties: PropTypes.object,
  rightIconName: PropTypes.string,
  rightIconProperties: PropTypes.object,
  placeholder: PropTypes.string,
  label: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
  ]),
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  onChangeText: PropTypes.func,
  onSubmitEditing: PropTypes.func,
  onKeyPress: PropTypes.func,
  returnKeyType: PropTypes.string,
  secureTextEntry: PropTypes.bool,
  keyboardType: PropTypes.oneOf(['default', 'number-pad', 'decimal-pad', 'numeric', 'email-address', 'phone-pad']),
  inputStyle: PropTypes.object,
  textStyle: PropTypes.object,
  value: PropTypes.string,
  onLeftIconPress: PropTypes.func,
  onRightIconPress: PropTypes.func,
  selectTextOnFocus: PropTypes.bool,
  disabled: PropTypes.bool,
  autoComplete: PropTypes.string,
  textContentType: PropTypes.string,
};

Input.defaultProps = {
  leftIconName: null,
  leftIconProperties: null,
  rightIconName: null,
  rightIconProperties: null,
  placeholder: '',
  label: null,
  onFocus: null,
  onBlur: null,
  onChangeText: null,
  onSubmitEditing: null,
  onKeyPress: null,
  returnKeyType: 'done',
  secureTextEntry: false,
  keyboardType: 'default',
  inputStyle: {},
  textStyle: {},
  value: '',
  onLeftIconPress: null,
  onRightIconPress: null,
  selectTextOnFocus: false,
  disabled: false,
};

export default Input;

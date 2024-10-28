import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PropTypes from 'prop-types';
import { Colors, Typography } from '../styles';
import config from '../config';
import translator from '../models/translator';
import { useStore } from '../stores/RootStore';

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    flexDirection: 'row',
  },
  leftButton: {
    flex: 1,
    borderColor: Colors.primary1,
    borderWidth: 1,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: -0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightButton: {
    flex: 1,
    borderColor: Colors.primary1,
    borderWidth: 1,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: -0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...Typography.h4,
    color: Colors.primary1,
  },
});

const Toggle = ({
  toggled,
  onChange,
}) => {

  const store = useStore();
  const [value, setValue] = useState(toggled);

  const onLeftPress = () => {
    setValue(true);
    if (onChange) {
      onChange(true);
    }
  };

  const onRightPress = () => {
    setValue(false);
    if (onChange) {
      onChange(false);
    }
  };

  return (
    <View
      style={styles.container}
    >
      <TouchableOpacity
        style={{
          ...styles.leftButton,
          backgroundColor: value ? Colors.primary1 : Colors.white,
        }}
        onPress={onLeftPress}
        accessibilityLabel={translator.t('components.toggle.yes')}
        accessibilityLanguage={store.preferences.language || 'en'}
      >
        <Text
          style={{
            ...styles.buttonText,
            color: value ? Colors.white : Colors.primary1,
          }}
          maxFontSizeMultiplier={config.MAX_FONT_SCALE}
        >{translator.t('components.toggle.yes')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          ...styles.rightButton,
          backgroundColor: value ? Colors.white : Colors.primary1,
        }}
        onPress={onRightPress}
        accessibilityLabel={translator.t('components.toggle.no')}
        accessibilityLanguage={store.preferences.language || 'en'}
      >
        <Text
          style={{
            ...styles.buttonText,
            color: value ? Colors.primary1 : Colors.white,
          }}
          maxFontSizeMultiplier={config.MAX_FONT_SCALE}
        >{translator.t('components.toggle.no')}</Text>
      </TouchableOpacity>
    </View>
  );
};

Toggle.propTypes = {
  toggled: PropTypes.bool,
  onChange: PropTypes.func,
};

Toggle.defaultProps = {
  toggled: false,
};

export default Toggle;

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Typography } from '../styles';
import config from '../config';
import { useFontScale } from '../utils/fontScaling';
import { deviceMultiplier } from '../styles/devices';

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  button: {
    height: 40 * deviceMultiplier,
    borderWidth: 1,
    borderColor: Colors.primary1,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  left: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  right: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  selected: {
    backgroundColor: Colors.primary1,
  },
  label: {
    ...Typography.h4,
    color: Colors.primary1,
  },
  selectedLabel: {
    color: Colors.white,
  },
});

const RadioButtonGroup = ({
  style,
  items = [],
  value,
  onChange,
}) => {

  const currentFontScale = useFontScale();

  const [selectedValue, setSelectedValue] = useState(value);

  const buttonPress = (item) => {
    setSelectedValue(item.value);
    if (onChange) {
      onChange(item.value);
    }
  };

  const containerStyle = {
    ...styles.container,
    ...style,
  };

  const labelStyle = () => {
    return {
      ...styles.label,
      fontWeight: currentFontScale > 1.353 ? 'bold' : 'normal',
    };
  };

  return (
    <View
      style={containerStyle}
    >

      {items.map((item, i) => {
        return (
          <Pressable
            key={item.value}
            onPress={() => {
              buttonPress(item);
            }}
            style={{
              ...styles.button,
              ...(i === 0 ? styles.left : {}),
              ...(i === items.length - 1 ? styles.right : {}),
              ...(item.value === selectedValue ? styles.selected : {}),
              marginLeft: i === items.length - 1 ? -1 : 0,
              marginRight: i === 0 ? -1 : 0,
            }}
          >
            <Text
              style={{
                ...labelStyle(),
                ...(item.value === selectedValue ? styles.selectedLabel : {}),
              }}
              maxFontSizeMultiplier={config.MAX_FONT_SCALE - 0.5}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}

    </View>
  );
};

RadioButtonGroup.propTypes = {
  style: PropTypes.object,
  items: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]).isRequired,
  })),
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  onChange: PropTypes.func,
};

RadioButtonGroup.defaultProps = {
  style: {},
  value: undefined,
};

export default RadioButtonGroup;

import * as React from 'react';
import { View } from 'react-native';
import {
  useNavigationBuilder,
  StackRouter,
  createNavigatorFactory,
} from '@react-navigation/native';
import PropTypes from 'prop-types';

const MapStackNavigator = ({
  initialRouteName,
  children,
  screenOptions,
  contentStyle,
}) => {
  const {
    state, descriptors, NavigationContent,
  } = useNavigationBuilder(StackRouter, {
    children,
    screenOptions,
    initialRouteName,
  });

  return (
    <NavigationContent>
      <View style={[{ flex: 1 }, contentStyle]} pointerEvents="box-none">
        {state.routes.map((route, i) => (
          <View
            key={route.key}
            style={{
              flex: 1,
              display: i === state.index ? 'flex' : 'none',
            }}
            pointerEvents="box-none"
          >
            {descriptors[route.key].render()}
          </View>
        ))}
      </View>
    </NavigationContent>
  );
};

MapStackNavigator.propTypes = {
  initialRouteName: PropTypes.string,
  children: PropTypes.array,
  screenOptions: PropTypes.object,
  contentStyle: PropTypes.object,
};

MapStackNavigator.defaultProps = {
  initialRouteName: '',
  children: [],
  screenOptions: {},
  contentStyle: {},
};

const createMapStackNavigator = createNavigatorFactory(MapStackNavigator);

export default createMapStackNavigator;

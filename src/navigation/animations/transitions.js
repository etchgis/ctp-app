import { Easing } from 'react-native';

const spring = {
  animation: 'spring',
  config: {
    stiffness: 500,
    damping: 200,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 1,
    restSpeedThreshold: 1,
  },
};

const timing = {
  bounce: {
    animation: 'timing',
    config: {
      duration: 400,
      easing: Easing.bounce,
    },
  },
  ease: {
    animation: 'timing',
    config: {
      duration: 200,
      easing: Easing.ease,
    },
  },
  linear: {
    animation: 'timing',
    config: {
      duration: 300,
      easing: Easing.linear,
    },
  },
  step0: {
    animation: 'timing',
    config: {
      duration: 400,
      easing: Easing.step0,
    },
  },
  step1: {
    animation: 'timing',
    config: {
      duration: 400,
      easing: Easing.step1,
    },
  },
};

export {
  spring,
  timing,
};

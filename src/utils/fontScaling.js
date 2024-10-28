import { useEffect, useRef, useState } from 'react';
import { AppState, PixelRatio } from 'react-native';

export const useFontScale = () => {
  const appState = useRef(AppState.currentState);

  const [currentFontScale, setCurrentFontScale] = useState(PixelRatio.getFontScale());

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        setCurrentFontScale(PixelRatio.getFontScale());
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return currentFontScale;
};

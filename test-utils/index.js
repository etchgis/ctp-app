/* eslint-disable no-undef */
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import RootStore, { StoreProvider } from '../src/stores/RootStore';

const rootStore = new RootStore();

const navigation = {
  addListener: jest.fn(),
  navigate: jest.fn(),
  reset: jest.fn(),
  replace: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
};

const Providers = ({ children }) => {
  return (
    <StoreProvider store={rootStore}>
      {React.cloneElement(children, { navigation })}
    </StoreProvider>
  );
};

const customRender = (ui, options) => {
  render(ui, { wrapper: Providers, ...options });

  return {
    ...screen,
    errorText: {
      get(name) {
        return screen.queryByTestId(name);
      },
    },
  };
};

export * from '@testing-library/react-native';

export { customRender as render };

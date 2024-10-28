import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { render } from '../../../test-utils';
import React from 'react';
// import RootStore, { StoreProvider } from '../../stores/RootStore';
import { toBeOnTheScreen, toBeVisible } from '@testing-library/jest-native';
import Account from './Account';

jest.mock('@fortawesome/react-native-fontawesome', () => ({
  FontAwesomeIcon: '',
}));

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

expect.extend({ toBeOnTheScreen, toBeVisible });

describe('register.account', () => {

  // no first name
  // no last name
  // invalid email
  // already used email: TODO
  // invalid password
  // valid password
  // unchecked terms and conditions
  // valid form

  test('no first name', async () => {
    const component = render(<Account/>);
    const { getByPlaceholderText, errorText } = component;

    expect(errorText.get('first-name-error-message')).not.toBeOnTheScreen();

    fireEvent.changeText(getByPlaceholderText('First Name *'), 'j');

    await waitFor(() => {
      expect(errorText.get('first-name-error-message')).not.toBeOnTheScreen();
    });

    fireEvent.changeText(getByPlaceholderText('First Name *'), '');

    await waitFor(() => {
      expect(errorText.get('first-name-error-message')).toBeOnTheScreen();
      expect(errorText.get('first-name-error-message')).toBeDefined();
      expect(errorText.get('first-name-error-message').props.children).toBe('required');
    });

  });

  test('no last name', async () => {
    const component = render(<Account/>);
    const { getByPlaceholderText, errorText } = component;

    expect(errorText.get('last-name-error-message')).not.toBeOnTheScreen();

    fireEvent.changeText(getByPlaceholderText('Last Name *'), 'g');

    await waitFor(() => {
      expect(errorText.get('last-name-error-message')).not.toBeOnTheScreen();
    });

    fireEvent.changeText(getByPlaceholderText('Last Name *'), '');

    await waitFor(() => {
      expect(errorText.get('last-name-error-message')).toBeOnTheScreen();
      expect(errorText.get('last-name-error-message')).toBeDefined();
      expect(errorText.get('last-name-error-message').props.children).toBe('required');
    });

  });

  test('invalid email', async () => {
    const component = render(<Account/>);
    const { getByPlaceholderText, errorText } = component;

    expect(errorText.get('email-error-message')).not.toBeOnTheScreen();

    fireEvent.changeText(getByPlaceholderText('Email *'), 'j');

    await waitFor(() => {
      expect(errorText.get('email-error-message')).toBeOnTheScreen();
      expect(errorText.get('email-error-message')).toBeDefined();
      expect(errorText.get('email-error-message').props.children).toBe('invalid email');
    });

  });

  test('invalid password', async () => {
    const component = render(<Account/>);
    const { getByText, getByPlaceholderText } = component;

    const requirement1 = getByText('8 +');
    const requirement2 = getByText('A-Z');
    const requirement3 = getByText('a-z');
    const requirement4 = getByText('0-9');

    expect(requirement1.props).toHaveProperty('style.color', '#dc3545');
    expect(requirement2.props).toHaveProperty('style.color', '#dc3545');
    expect(requirement3.props).toHaveProperty('style.color', '#dc3545');
    expect(requirement4.props).toHaveProperty('style.color', '#dc3545');

    fireEvent.changeText(getByPlaceholderText('Password *'), 'T');

    expect(requirement1.props).toHaveProperty('style.color', '#dc3545');
    expect(requirement2.props).toHaveProperty('style.color', '#b8b8b8');
    expect(requirement3.props).toHaveProperty('style.color', '#dc3545');
    expect(requirement4.props).toHaveProperty('style.color', '#dc3545');

    fireEvent.changeText(getByPlaceholderText('Password *'), 'Te');

    expect(requirement1.props).toHaveProperty('style.color', '#dc3545');
    expect(requirement2.props).toHaveProperty('style.color', '#b8b8b8');
    expect(requirement3.props).toHaveProperty('style.color', '#b8b8b8');
    expect(requirement4.props).toHaveProperty('style.color', '#dc3545');

    fireEvent.changeText(getByPlaceholderText('Password *'), 'Test1');

    expect(requirement1.props).toHaveProperty('style.color', '#dc3545');
    expect(requirement2.props).toHaveProperty('style.color', '#b8b8b8');
    expect(requirement3.props).toHaveProperty('style.color', '#b8b8b8');
    expect(requirement4.props).toHaveProperty('style.color', '#b8b8b8');

    fireEvent.changeText(getByPlaceholderText('Password *'), 'testtest');

    expect(requirement1.props).toHaveProperty('style.color', '#b8b8b8');
    expect(requirement2.props).toHaveProperty('style.color', '#dc3545');
    expect(requirement3.props).toHaveProperty('style.color', '#b8b8b8');
    expect(requirement4.props).toHaveProperty('style.color', '#dc3545');

  });

  test('valid password', async () => {
    const component = render(<Account/>);
    const { getByText, getByPlaceholderText } = component;

    const requirement1 = getByText('8 +');
    const requirement2 = getByText('A-Z');
    const requirement3 = getByText('a-z');
    const requirement4 = getByText('0-9');

    expect(requirement1.props).toHaveProperty('style.color', '#dc3545');
    expect(requirement2.props).toHaveProperty('style.color', '#dc3545');
    expect(requirement3.props).toHaveProperty('style.color', '#dc3545');
    expect(requirement4.props).toHaveProperty('style.color', '#dc3545');

    fireEvent.changeText(getByPlaceholderText('Password *'), 'Test1234');

    expect(requirement1.props).toHaveProperty('style.color', '#b8b8b8');
    expect(requirement2.props).toHaveProperty('style.color', '#b8b8b8');
    expect(requirement3.props).toHaveProperty('style.color', '#b8b8b8');
    expect(requirement4.props).toHaveProperty('style.color', '#b8b8b8');

  });

  test('unchecked terms and conditions', async () => {
    const component = render(<Account/>);
    const { queryByTestId, queryAllByRole } = component;

    const buttonShow = queryByTestId('terms-and-conditions');
    const buttonClose = queryByTestId('terms-and-conditions-close');

    expect(buttonClose).not.toBeVisible();

    fireEvent.press(buttonShow);

    await waitFor(() => {
      expect(buttonClose).toBeVisible();
    });

    fireEvent.press(buttonClose);

    await waitFor(() => {
      expect(buttonClose).not.toBeVisible();
    });

    const checkboxes = queryAllByRole('checkbox');

    expect(checkboxes[0].children[0].props.value).toBe(false);
    expect(checkboxes[1].children[0].props.value).toBe(false);

  });

  test('valid form', async () => {
    const component = render(<Account/>);
    const { getByPlaceholderText, getByText, queryByTestId, queryAllByRole, errorText } = component;

    expect(errorText.get('first-name-error-message')).not.toBeOnTheScreen();

    const requirement1 = getByText('8 +');
    const requirement2 = getByText('A-Z');
    const requirement3 = getByText('a-z');
    const requirement4 = getByText('0-9');

    const buttonShow = queryByTestId('terms-and-conditions');
    const buttonClose = queryByTestId('terms-and-conditions-close');

    const checkboxes = queryAllByRole('checkbox');

    fireEvent.changeText(getByPlaceholderText('First Name *'), 'jesse');
    fireEvent.changeText(getByPlaceholderText('Last Name *'), 'glascock');
    fireEvent.changeText(getByPlaceholderText('Email *'), 'jesseglascock@gmail.com');
    fireEvent.changeText(getByPlaceholderText('Password *'), 'Test1234');
    fireEvent.press(buttonShow);

    await waitFor(() => {
      expect(buttonClose).toBeVisible();
    });

    fireEvent(checkboxes[1], 'onValueChange', true);

    await waitFor(() => {
      expect(buttonClose).not.toBeVisible();
      expect(errorText.get('first-name-error-message')).not.toBeOnTheScreen();
      expect(requirement1.props).toHaveProperty('style.color', '#b8b8b8');
      expect(requirement2.props).toHaveProperty('style.color', '#b8b8b8');
      expect(requirement3.props).toHaveProperty('style.color', '#b8b8b8');
      expect(requirement4.props).toHaveProperty('style.color', '#b8b8b8');
      expect(checkboxes[0].children[0].props.value).toBe(true);
      expect(checkboxes[1].children[0].props.value).toBe(true);
    });

  });

});

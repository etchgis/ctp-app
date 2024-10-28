/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import { useFocusEffect } from '@react-navigation/native';
import jwtDecode from 'jwt-decode';

export const useIsUserExpired = (store, navigation) => {
  useFocusEffect(
    React.useCallback(() => {
      if (store.authentication.loggedIn) {
        console.log('checking refresh token');
        const decoded = jwtDecode(store.authentication.user?.refreshToken);
        const expired = decoded.exp < Date.now() / 1000;
        console.log(`token is ${expired ? '' : 'NOT'} expired`);
        if (expired) {
          store.authentication.logout();
          store.mapManager.setCurrentMap('home');
          // store.mapManager.setCurrentIndoorMap('results');
          navigation.reset({
            index: 0,
            routes: [{ name: 'landing' }],
          });
        }
        console.log('checking user');
        // else {
        store.authentication.get(store.authentication.user?.accessToken)
          .then((success) => {
            if (success) {
              console.log('user exists: ', success);
            }
            else {
              console.log('user does not exist');
              store.authentication.logout();
              store.mapManager.setCurrentMap('home');
              // store.mapManager.setCurrentIndoorMap('results');
              navigation.reset({
                index: 0,
                routes: [{ name: 'landing' }],
              });
            }
          })
          .catch((e) => {
            console.log(e);
            // if (e.toLowerCase() === 'unauthorized') {
            console.log('user does not exist', e);
            store.authentication.logout();
            store.mapManager.setCurrentMap('home');
            // store.mapManager.setCurrentIndoorMap('results');
            navigation.reset({
              index: 0,
              routes: [{ name: 'landing' }],
            });
            // }
          });
        // }
      }
      console.log('user is not logged in: proceed with caution as a guest');
      console.log('control access with store.authentication.loggedIn');
    }, [])
  );
};

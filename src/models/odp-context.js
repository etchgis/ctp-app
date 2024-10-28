import React, { createContext, useCallback, useEffect, useRef } from 'react';
import { JOdpViewModule } from 'react-native-ctp-odp';
import config from '../config';
import { geolocation } from './geolocation';
import simulator from '../services/simulator';

export const OdpContext = createContext(null);

const JOdpViewModuleForwardRef = React.forwardRef(({ odpEventHandlers }, ref) => {
  return (
    <JOdpViewModule
      ref={ref}
      onOdpEvent={odpEventHandlers}
    />
  );
});

const JOdpViewModuleMemo = React.memo(JOdpViewModuleForwardRef);

export const OdpProvider = ({ children }) => {
  const odpRef = useRef(null);
  const navigationUpdateListeners = useRef([]);

  const onGotIndoorModuleRef = useCallback((ref) => {
    if (!odpRef.current) {
      odpRef.current = ref;
      console.log('ODP: set indoor module ref');
      odpRef.current?.startOdp(config.INDOOR.ODP_CREDENTIALS.key, config.INDOOR.ODP_CREDENTIALS.host);
    }
  }, []);

  const handleOdpReady = useCallback((event) => {
    console.log('ODP onReady', event);
  }, []);

  const handleOdpKeyValidation = useCallback((event) => {
    console.log('ODP onKeyValidation', event);
  }, []);

  const handleOdpFacilityUpdate = useCallback((event) => {
    console.log('ODP onFacilityUpdate', event);
  }, []);

  const handleOdpNavigationUpdate = useCallback((e) => {
    navigationUpdateListeners.current.forEach(listener => {
      listener(e);
    });
    if (e.floor >= 478 && e.floor <= 498) {
      geolocation.setLocation({
        lat: e.lat,
        lng: e.long,
      }, e.bearing, simulator.metersPerSec);
    }
    else {
      geolocation.resume();
    }
  });

  const addNavigationUpdateListener = (listener) => {
    navigationUpdateListeners.current.push(listener);
  };

  const removeNavigationUpdateListener = (listener) => {
    navigationUpdateListeners.current = navigationUpdateListeners.current.filter(
      l => l !== listener
    );
  };

  useEffect(() => {
    return () => {
      navigationUpdateListeners.current = [];
      if (odpRef.current) {
        odpRef.current.stopOdp();
        odpRef.current = null;
      }
    };
  }, []);

  return (
    <OdpContext.Provider value={{ odpRef, addNavigationUpdateListener, removeNavigationUpdateListener }}>
      {children}
      <JOdpViewModuleMemo
        ref={onGotIndoorModuleRef}
        odpEventHandlers={{
          onReady: handleOdpReady,
          onKeyValidation: handleOdpKeyValidation,
          onNavigationUpdate: handleOdpNavigationUpdate,
          onFacilityUpdate: handleOdpFacilityUpdate,
        }}
      />
    </OdpContext.Provider>
  );
};

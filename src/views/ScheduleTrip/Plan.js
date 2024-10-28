/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { Colors, Devices, Typography } from '../../styles';
import { useStore } from '../../stores/RootStore';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import Button from '../../components/Button';
import RadioButtonGroup from '../../components/RadioButtonGroup';
import config from '../../config';
import Input from '../../components/Input';
import CheckBox from '@react-native-community/checkbox';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import Popup from '../../components/Popup';
import { useIsFirstRender } from '../../utils/isFirstRender';
import moment from 'moment';
import { geolocation, useLocationEnabled } from '../../models/geolocation';
import Modal from '../../components/Modal';
import { useIsUserExpired } from '../../utils/isUserExpired';
import AddressSearch from '../../components/AddressSearch';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFontScale } from '../../utils/fontScaling';
import { deviceMultiplier } from '../../styles/devices';
import Voice from '@react-native-voice/voice';
import voice from '../../services/voice';
import { debounce } from 'lodash';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Dots } from '../../components/Waiters';
import assistant from '../../services/transport/assistant';
import LocationData from '../../models/location-data';
import { geocoder } from '../../services/transport';
import Tts from 'react-native-tts';
import RNSystemSounds from '@dashdoc/react-native-system-sounds';
import translator from '../../models/translator';
import { useFocusEffect } from '@react-navigation/native';

const ADDITIONAL_ANDROID_PADDING = Devices.isAndroid ? 10 : 0;

class CancellationToken {
  constructor() {
    this.isCancelled = false;
  }

  cancel() {
    this.isCancelled = true;
  }
}

function cancellablePromise(promise, cancellationToken) {
  return new Promise((resolve, reject) => {
    promise
      .then((result) => {
        if (cancellationToken.isCancelled) {
          reject({ isCancelled: true });
        } else {
          resolve(result);
        }
      })
      .catch((error) => {
        if (cancellationToken.isCancelled) {
          reject({ isCancelled: true });
        } else {
          reject(error);
        }
      });
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: 25,
    // paddingTop: 65,
  },
  stepOneContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: Devices.screen.width,
  },
  stepTwoContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: Devices.screen.width,
  },
  chatAssistantContainer: {
    position: 'absolute',
    right: 0,
    left: 0,
    height: Devices.screen.height,
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28 * deviceMultiplier,
    marginTop: 10 * deviceMultiplier,
  },
  headerBackButton: {
    position: 'absolute',
    left: 0,
  },
  headerLabel: {
    ...Typography.h4,
  },
  content: {
    flex: 1,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    // backgroundColor: Colors.danger,
    // flex: 1,
  },
  line: {
    borderTopColor: Colors.light,
    borderTopWidth: 1,
    marginTop: 23,
    marginBottom: 33,
  },
  checkBoxContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginVertical: 6,
  },
  // NOTE CheckBox size:  RELOAD to see changes
  checkBox: {
    marginLeft: Devices.isAndroid ? 0 : 10,
    marginRight: Devices.isAndroid ? 25 : 15,
    marginBottom: Devices.isAndroid ? 10 : 0,
    height: 20 * deviceMultiplier,
    width: 20 * deviceMultiplier,
    transform: [{
      scaleX: (Devices.isAndroid ? 1.5 : 1) * deviceMultiplier
    }, {
      scaleY: (Devices.isAndroid ? 1.5 : 1) * deviceMultiplier
    }],
  },
  checkBoxText: {
    color: Colors.dark,
    fontWeight: 'bold',
    ...Typography.h4,
  },
  dateTimeContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginBottom: 20,
  },
  formLabel: {
    ...Typography.h5,
    marginBottom: 9,
  },
  swapButton: {
    alignSelf: 'center',
    marginVertical: 13,
    backgroundColor: Colors.secondary2,
    padding: 6,
    borderRadius: 10,
  },
  favoriteTitle: {
    ...Typography.h3,
    marginBottom: 20,
    color: Colors.primary1,
  },
  favoriteSubtitle: {
    ...Typography.h5,
    marginBottom: 20,
  },
  favoriteAddress: {
    ...Typography.h4,
    fontWeight: 'bold',
  },
  favoriteAddressIcon: {
    marginRight: 17,
    marginLeft: 8,
  },
  favoriteFooter: {
    width: '100%',
    alignItems: 'center',
  },
  chatAssistantButton: {
    position: 'absolute',
    right: 0,
    backgroundColor: Colors.primary1,
    width: 40,
    height: 40,
    borderRadius: 20
  },
  chatAssistantButtonUser: {
    position: 'absolute',
    left: 9,
    top: 10,
    color: Colors.white
  },
  chatAssistantButtonWifi: {
    position: 'absolute',
    top: 10,
    right: 7,
    transform: [{ rotate: '90deg' }],
    color: Colors.white
  },
  chatAssistantIcon: {
    position: 'relative',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: Colors.primary1,
    alignSelf: 'center'
  },
  chatAssistantIconUser: {
    position: 'absolute',
    top: 35,
    left: 35,
    color: Colors.white
  },
  chatAssistantIconWifi: {
    position: 'absolute',
    top: 29,
    right: 26,
    transform: [{ rotate: '90deg' }],
    color: Colors.white
  },
  top: {
    borderBottomColor: Colors.light,
    borderBottomWidth: 1,
    paddingVertical: 30
  },
  chatTextBlock: {
    marginVertical: 5,
    flexDirection: 'row'
  },
  chatTextLeft: {
    width: '70%',
  },
  chatTextLeftSpacer: {
    width: '30%'
  },
  chatTextRight: {
    width: '70%'
  },
  chatTextRightSpacer: {
    width: '30%'
  },
  chatRequestText: {
    ...Typography.h3,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  chatResponseText: {
    ...Typography.h3,
    color: Colors.primary1,
    textAlign: 'left',
    fontWeight: 'bold',
  },
  chatWaiter: {
    flexDirection: 'row'
  }
});

const Plan = observer(({
  navigation,
}) => {

  const store = useStore();
  // const gl = useGeolocation();
  const locationEnabled = useLocationEnabled();
  // useIsUserExpired(store, navigation);
  const isFirstRender = useIsFirstRender();
  const profile = store.profile;

  const insets = useSafeAreaInsets();
  const currentFontScale = useFontScale();

  const [addressTarget, setAddressTarget] = useState(undefined);
  const [selectedFromAddress, setSelectedFromAddress] = useState(store.trip.request.origin);
  const [saveFromCheckbox, setSaveFromCheckbox] = useState(!!store.trip.request.origin?.id);
  const [selectedToAddress, setSelectedToAddress] = useState(store.trip.request.destination);
  const [saveToCheckbox, setSaveToCheckbox] = useState(!!store.trip.request.destination?.id);
  const [showAddressSearch, setShowAddressSearch] = useState(false);
  const [selectedWhenAction, setSelectedWhenAction] = useState(store.trip.request.whenAction);
  const [selectedDateTime, setSelectedDateTime] = useState(moment());
  const [selectedModes, setSelectedModes] =
    useState(
      store.trip.request.modes.length > 0 ?
        store.trip.request.modes :
        store.preferences.modes || []
    );
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [showNumberOfPeople, setShowNumberOfPeople] = useState(false);
  const [numberOfPeopleLabel, setNumberPeopleLabel] = useState('1');
  const [caretaker, setCaretaker] = useState('None');
  const [showCaretaker, setShowCaretaker] = useState(false);
  const [caretakerLabel, setCaretakerLabel] = useState('None');
  const [showSave, setShowSave] = useState(false);
  const [favoriteName, setFavoriteName] = useState('');
  const [favoriteAddress, setFavoriteAddress] = useState('');
  const [favoriteDirection, setFavoriteDirection] = useState('');
  const [dateTimeWidth, setDateTimeWidth] = useState(0);

  const [reverseAddress, setReverseAddress] = useState(null);

  const _stepViewValue = useSharedValue(0);
  const _chatViewValue = useSharedValue(0);

  const fromInputRef = useRef();
  const toInputRef = useRef();
  const favoriteInputRef = useRef();
  const numberOfPeopleInputRef = useRef();
  const caretakerInputRef = useRef();
  const chatScrollViewRef = useRef();

  const [conversationStatus, setConversationStatus] = useState('ended');
  const [currentChatState, setCurrentChatState] = useState({});
  const [userSpeech, setUserSpeech] = useState('');
  const [userTalking, setUserTalking] = useState(false);
  const [chatWaiting, setChatWaiting] = useState(false);
  const [userRequests, setUserRequests] = useState([]);
  const [chatResponses, setChatResponses] = useState([]);
  const [chatSpeech, setChatSpeech] = useState('');
  const [chatTalking, setChatTalking] = useState(false);
  const [inCommunityShuttleTimeframe, setInCommunityShuttleTimeframe] = useState(false);

  useEffect(() => {
    Voice.onSpeechStart = onSpeechStartHandler;
    Voice.onSpeechResults = onSpeechResultsHandler;
    Voice.onSpeechEnd = onSpeechEndHandler;

    // Voice.onSpeechPartialResults = onSpeechPartialResultsHandler;
    // Voice.onSpeechRecognized = onSpeechRecongnizedHandler;
    // Voice.onSpeechVolumeChanged = onSpeechVolumeChangedHandler;
    Voice.onSpeechError = onSpeechErrorHandler;

    return () => {
      Voice.destroy()
        .then(() => {
          if (Voice?._listeners?.length > 0) {
            Voice.removeAllListeners();
          }
        });
    };
  }, []);

  const onSpeechStartHandler = () => {
    console.log('USER START TALKING');
    setUserTalking(true);
  }

  const onSpeechResultsDebounced = async (e) => {
    Voice.stop();
    const text = e.value[0];
    setUserSpeech(text);
  }

  const onSpeechEndHandler = () => {
    setUserTalking(false);
    setChatWaiting(true);
  }

  const onSpeechErrorHandler = (e) => {
    console.log('SPEECH ERROR', e);
  }

  const onSpeechResultsHandler = useCallback(debounce(onSpeechResultsDebounced, 1000), []);

  const toggleConversation = async () => {
    if (conversationStatus === 'ended') {
      setConversationStatus('started');
      playStart();
      await Voice.start(`${store.preferences.language}-US`);
    }
    else {
      await Voice.stop();
      setConversationStatus('ended');
      resetConversation();
    }
  }

  useEffect(() => {
    if (!userTalking && chatWaiting && userSpeech.length > 0) {
      playStop();
      console.log('send chat');
      sendChat();
    }
  }, [userTalking, chatWaiting, userSpeech]);

  const cancellationTokenRef = useRef(null);

  const sendChat = () => {
    if (reverseAddress && reverseAddress.point && reverseAddress.title) {
      const rOrigin = {
        address: reverseAddress.title,
        lat: reverseAddress.point.lat,
        lng: reverseAddress.point.lng
      }
      setUserRequests([
        ...userRequests,
        userSpeech
      ]);
      // let shouldReset = true;
      // if (chatResponses.length > 0) {
      //   shouldReset = false;
      // }
      // store.authentication.fetchAccessToken()
      //   .then((accessToken) => {
      //     assistant.v2.chat(userSpeech, rOrigin, shouldReset, accessToken)
      //       .then(chatSuccess)
      //       .catch(chatError)
      //   })
      //   .catch((e) => {
      //     console.warn('fetch access token error', e);
      //   });
      store.authentication.fetchAccessToken()
        .then((accessToken) => {
          const cancellationToken = new CancellationToken();
          cancellationTokenRef.current = cancellationToken;

          const chatPromise = cancellablePromise(
            assistant.v2.chat(userSpeech, rOrigin, currentChatState, accessToken),
            cancellationToken
          );

          chatPromise
            .then(chatSuccess)
            .catch((error) => {
              if (error.isCancelled) {
                console.log('Chat request was cancelled');
              } else {
                chatError(error);
              }
            });
          // assistant.v2.chat(userSpeech, rOrigin, currentChatState, accessToken)
          //   .then(chatSuccess)
          //   .catch(chatError)
        })
        .catch((e) => {
          console.warn('fetch access token error', e);
        });
    }
    else {
      console.log('LOCATION NEEDED');
    }
  }

  const chatSuccess = (result) => {
    console.log('chatSuccess', result);
    setUserSpeech('');
    setChatWaiting(false);
    setCurrentChatState(result.response.state);
    if (!result.isFinalResponse) {
      setChatResponses([
        ...chatResponses,
        result
      ]);
      initiateChatResponse(result.response.state.assistantAnswer);
    }
    else {
      setChatResponses([
        ...chatResponses,
        {
          isFinalResponse: true,
          response: {
            state: {
              assistantAnswer: 'Thank you.  One second while I bring up your trip.'
            }
          }
        }
      ]);
      finalizeChat(result.response);
    }
  }

  const chatError = (response) => {
    console.log(response);
    setUserSpeech('');
    setChatWaiting(false);
    setChatResponses([
      ...chatResponses,
      {
        isFinalResponse: response.message ? false : response.error.message.isFinalResponse,
        response: {
          state: {
            assistantAnswer: 'I\'m sorry I was unable to process that.  Can you please try again?'
          }
        }
      }
    ]);
    // console.log(response.error.message.message);
    initiateChatResponse('I\'m sorry I was unable to process that.  Can you please try again?');
  }

  const initiateChatResponse = async (utterance) => {
    setChatTalking(true);
    setChatSpeech(utterance);
    await voice.speak(utterance);
  }

  const finalizeChat = async (chatResponse) => {
    await voice.speak('Thank you.  One second while I bring up your trip.');
    let tripRequest = chatResponse.request;
    tripRequest.whenTime = moment(chatResponse.plan.startTime).toDate()
    store.trip.setRequest(chatResponse.request);
    store.trip.selectPlan(chatResponse.plan);
    setTimeout(() => {
      setConversationStatus('ended');
      resetConversation();
      store.display.showSpinner();
      store.mapManager.setCurrentMap('selected');
      store.mapManager.setCurrentIndoorMap('selected');
      store.display.showSpinner(0.5);
      navigation.push('schedule.selected');
    }, 5000);
  }

  useEffect(() => {
    // Tts.addEventListener('tts-start', ttsStartHandler);
    // Tts.addEventListener('tts-progress', ttsProgressHandler);
    Tts.addEventListener('tts-finish', ttsFinishHandler);

    return () => {
      if (Tts.listenerCount > 0) {
        Tts.removeAllListeners();
      }
    };
  }, []);

  // const ttsStartHandler = (e) => {
  //   console.log('CHAT SPEAKING STARTED', e);
  // }

  // const ttsProgressHandler = (e) => {
  //   const idx = e.location;
  //   console.log('CHAT PROGRESS', idx);
  // }

  const ttsFinishHandler = (e) => {
    // console.log('CHAT SPEAKING ENDED', e);
    setChatTalking(false);
  }

  useEffect(() => {
    if (!chatTalking && chatSpeech.length > 0 && conversationStatus === 'started') {
      console.log('back to user chat');
      backToUser();
    }
  }, [chatTalking, chatSpeech, conversationStatus]);

  const backToUser = async () => {
    setChatSpeech('');
    playStart();
    await Voice.start(`${store.preferences.language}-US`);
  }

  const resetConversation = () => {
    if (cancellationTokenRef.current) {
      cancellationTokenRef.current.cancel();
    }
    playEnd();
    voice.stop();
    setUserSpeech('');
    setUserTalking(false);
    setChatWaiting(false);
    setUserRequests([]);
    setChatResponses([]);
    setChatSpeech('');
    setChatTalking(false);
    setCurrentChatState({});
  }

  useEffect(() => {
    if (isFirstRender) {
      // store.trip.create();
      store.trip.updateWhen(new Date());
      for (var i = 0; i < config.MODES.length; i++) {
        const mode = config.MODES[i].mode;
        if (store.preferences.modes.indexOf(mode) > -1) {
          store.trip.addMode(mode);
        }
      }
      if (store.trip.request.modes.indexOf('walk') === -1) {
        store.trip.addMode('walk');
      }
    }
  }, []);

  useEffect(() => {
    console.log('location enabled changed to', locationEnabled);
  }, [locationEnabled]);

  const geolocationWatchRef = useRef();
  const [currentLocation, setCurrentLocation] = useState(null);
  useFocusEffect(
    useCallback(() => {
      console.log('PLAN subscribing to geolocation and netinfo');
      geolocationWatchRef.current = geolocation.subscribe(handleGeolocationUpdate);
      return () => {
        console.log('PLAN unsubscribing from geolocation and netinfo');
        geolocationWatchRef.current && geolocationWatchRef.current.cancel();
      };
    }, [])
  );

  const handleGeolocationUpdate = useCallback((position, heading, speed) => {
    setCurrentLocation({ position, heading, speed });
    console.log('PLAN geolocation update', geolocation.accuracy);
  }, [geolocation.accuracy]);

  // useEffect(() => {
  //   let pt = gl.currentLocation.position;
  //   if (!pt) {
  //     const coordinates = LocationData.BuffaloCenter.features[0].geometry.coordinates;
  //     pt = { lng: coordinates[0], lat: coordinates[1] };
  //   }
  //   if (locationEnabled && pt && !reverseAddress) {
  //     // getAddress({ "lat": 42.943060, "lng": -78.813360 });
  //     getAddress(pt);
  //   }
  // }, [gl.currentLocation, locationEnabled]);

  const getAddress = (point) => {
    console.log('getAddress', point);
    return new Promise((resolve, reject) => {
      geocoder.reverse({ lng: point.lng, lat: point.lat })
        .then(result => {
          console.log('GOT REVERSE ADDRESS', result);
          let address = result.length ? result[0] : undefined;
          if (address && !address.alias) {
            let txt = address.title;
            if (address.description) {
              txt += `, ${address.description}`;
            }
            address.text = txt;
          }
          console.log('GOT ADDRESS', address);
          resolve(address);
        })
        .catch(e => {
          console.log('error reverse geocoding', e);
          reject(e);
        });
    });
  };

  const playStart = () => {
    Vibration.vibrate();
    RNSystemSounds.play(
      Platform.select({
        // android: RNSystemSounds.AndroidSoundIDs.TONE_CDMA_ABBR_ALERT,
        ios: RNSystemSounds.iOSSoundIDs.JBL_Ambiguous,
      })
    );
  }

  const playStop = () => {
    Vibration.vibrate();
    RNSystemSounds.play(
      Platform.select({
        // android: RNSystemSounds.AndroidSoundIDs.TONE_CDMA_ABBR_ALERT,
        ios: RNSystemSounds.iOSSoundIDs.JBL_NoMatch,
      })
    );
  }

  const playEnd = () => {
    Vibration.vibrate();
    RNSystemSounds.play(
      Platform.select({
        // android: RNSystemSounds.AndroidSoundIDs.TONE_CDMA_ABBR_ALERT,
        ios: RNSystemSounds.iOSSoundIDs.VCEnded,
      })
    );
  }

  const fromRefInputFocus = () => {
    setShowAddressSearch(true);
    fromInputRef.current.blur();
    setAddressTarget('from');
  };

  const toRefInputFocus = () => {
    setShowAddressSearch(true);
    toInputRef.current.blur();
    setAddressTarget('to');
  };

  const handleCancelAddressSearch = () => {
    setShowAddressSearch(false);
    setAddressTarget(undefined);
  };

  const handleAddressSearchSelect = async (result) => {
    let address = { ...result };
    console.log(currentLocation);
    if (address.title.toLowerCase() === 'current location') {
      // address = reverseAddress;
      console.log('GET ADDRESS', currentLocation && currentLocation.position);
      if (currentLocation && currentLocation.position) {
        address = await getAddress(currentLocation.position);
        if (!address) {
          address = {
            title: 'Current Location',
            alias: 'Current Location',
            point: currentLocation.position
          };
        }
        console.log('GOT ADDRESS', address);
      }
    }
    console.log('SELECTED ADDRESS', address);
    if (address.venueId) {
      const venue = config.INDOOR.VENUES.find(v => v.id === address.venueId);
      address.point =
        store.preferences.wheelchair ?
          venue.entrances.accessible.point :
          venue.entrances.standard.point;
    }
    if (addressTarget === 'from') {
      setSelectedFromAddress(address);
      setSaveFromCheckbox(!!address.id);
      store.trip.updateOrigin(address);
    }
    else {
      setSelectedToAddress(address);
      setSaveToCheckbox(!!address.id);
      store.trip.updateDestination(address);
    }
    setShowAddressSearch(false);
  };

  const handleSwapPress = () => {
    const fromAddress = selectedFromAddress,
      toAddress = selectedToAddress;

    setSelectedFromAddress(toAddress);
    setSaveFromCheckbox(!!toAddress?.id);
    store.trip.updateOrigin(toAddress);

    setSelectedToAddress(fromAddress);
    setSaveToCheckbox(!!fromAddress?.id);
    store.trip.updateDestination(fromAddress);
  };

  const favoriteCheckboxChange = (value, direction) => {
    setFavoriteDirection(direction);
    if (direction === 'from') {
      setSaveFromCheckbox(value);
      if (value) {
        setFavoriteAddress(selectedFromAddress);
      }
    }
    else if (direction === 'to') {
      setSaveToCheckbox(value);
      if (value) {
        setFavoriteAddress(selectedToAddress);
      }
    }
    setShowSave(true);
  };

  const saveFavorite = () => {
    const alias = favoriteName;
    if (favoriteDirection === 'from') {
      let favorite;
      favorite = { ...selectedFromAddress };
      favorite.alias = alias;
      favorite.id = store.favorites.addLocation(favorite);
      setSelectedFromAddress(favorite);
      setSaveFromCheckbox(true);
      store.trip.updateOrigin(favorite);
    }
    if (favoriteDirection === 'to') {
      let favorite;
      favorite = { ...selectedToAddress };
      favorite.alias = alias;
      favorite.id = store.favorites.addLocation(favorite);
      setSelectedToAddress(favorite);
      setSaveToCheckbox(true);
      store.trip.updateDestination(favorite);
    }
    setFavoriteDirection('');
    setShowSave(false);
    favoriteInputRef.current.blur();
  };

  const cancelSaveFavorite = () => {
    if (favoriteDirection === 'from') {
      setSaveFromCheckbox(false);
    }
    if (favoriteDirection === 'to') {
      setSaveToCheckbox(false);
    }
    setFavoriteName('');
    setFavoriteDirection('');
    setShowSave(false);
    favoriteInputRef.current.blur();
  };

  const whenActionChange = (value) => {
    setSelectedWhenAction(value);
    store.trip.updateWhenAction(value);
    if (value === 'asap') {
      setSelectedDateTime(moment());
      store.trip.updateWhen(moment().toDate());
    }
  };

  const dateChange = (event, value) => {
    const newDate = moment(value);
    let currentDate = moment(selectedDateTime);
    currentDate
      .year(newDate.year())
      .month(newDate.month())
      .date(newDate.date());
    setSelectedDateTime(currentDate);
    store.trip.updateWhen(currentDate.toDate());
  };

  const timeChange = (event, value) => {
    const newDate = moment(value);
    let currentDate = moment(selectedDateTime);
    currentDate
      .hour(newDate.hour())
      .minute(newDate.minute());
    setSelectedDateTime(currentDate);
    store.trip.updateWhen(currentDate.toDate());
  };

  const dateFocus = () => {
    DateTimePickerAndroid.open({
      value: selectedDateTime.toDate(),
      mode: 'date',
      onChange: onAndroidDateChange,
    });
    Keyboard.dismiss();
  };

  const onAndroidDateChange = (event, value) => {
    const newDate = moment(value);
    let currentDate = moment(selectedDateTime);
    currentDate
      .year(newDate.year())
      .month(newDate.month())
      .date(newDate.date());
    setSelectedDateTime(currentDate);
    store.trip.updateWhen(currentDate.toDate());
  };

  const timeFocus = () => {
    DateTimePickerAndroid.open({
      value: selectedDateTime.toDate(),
      mode: 'time',
      onChange: onAndroidTimeChange,
    });
    Keyboard.dismiss();
  };

  const onAndroidTimeChange = (event, value) => {
    const newDate = moment(value);
    let currentDate = moment(selectedDateTime);
    currentDate
      .hour(newDate.hour())
      .minute(newDate.minute());
    setSelectedDateTime(currentDate);
    store.trip.updateWhen(currentDate.toDate());
  };

  const modeChange = (value, checked) => {
    if (checked) {
      store.trip.addMode(value);
      setSelectedModes([...selectedModes, value]);
    }
    else {
      store.trip.removeMode(value);
      setSelectedModes(selectedModes.filter(m => m !== value));
    }
  };

  const numberOfPeopleInputRefFocus = () => {
    numberOfPeopleInputRef.current.blur();
    setShowNumberOfPeople(true);
  };

  const numberOfPeopleChange = (value) => {
    setNumberOfPeople(value);
    setNumberPeopleLabel(String(value));
  };

  const caretakerInputRefFocus = () => {
    caretakerInputRef.current.blur();
    setShowCaretaker(true);
  };

  const caretakerChange = (value) => {
    if (value === 'none') {
      setCaretaker(value);
      setCaretakerLabel('None');
    }
    else {
      const found = profile?.caretakers.find(c => c.email === value);
      setCaretaker(found.email);
      setCaretakerLabel(`${found.firstName} ${found.lastName}`);
    }
  };

  const modesArrayToCheckboxes = (mode, index) => {
    if (mode.id !== 'hail' || (mode.id === 'hail' && inCommunityShuttleTimeframe)) {
      return (
        <View
          key={`${mode.id}-${index}`}
          style={styles.checkBoxContainer}
        >
          <CheckBox
            value={selectedModes.indexOf(mode.mode) > -1}
            boxType="square"
            style={styles.checkBox}
            onValueChange={(value) => {
              modeChange(mode.mode, value);
            }}
            accessibilityLabel={translator.t('global.modes.checkLabel', { mode: translator.t(`global.modes.${mode.id}`) })}
            accessibilityLanguage={store.preferences.language || 'en'}
          />
          <Text
            style={{
              ...styles.checkBoxText,
              color: selectedModes.indexOf(mode.mode) > -1 ? Colors.primary1 : Colors.dark,
            }}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
          >
            {translator.t(`global.modes.${mode.id}`)}
          </Text>
        </View>
      );
    }
  };

  const stepOneViewStyle = useAnimatedStyle(() => ({
    ...styles.container,
    ...styles.stepOneContainer,
    paddingTop: insets.top + ADDITIONAL_ANDROID_PADDING,
    paddingBottom: insets.bottom + ADDITIONAL_ANDROID_PADDING,
    left: withTiming(_stepViewValue.value == 0 ? 0 : -Devices.screen.width),
    right: withTiming(_stepViewValue.value == 0 ? 0 : Devices.screen.width),
  }));

  const stepTwoViewStyle = useAnimatedStyle(() => ({
    ...styles.container,
    ...styles.stepTwoContainer,
    paddingTop: insets.top + ADDITIONAL_ANDROID_PADDING,
    paddingBottom: insets.bottom + ADDITIONAL_ANDROID_PADDING,
    left: withTiming(_stepViewValue.value == 0 ? Devices.screen.width : 0),
    right: withTiming(_stepViewValue.value == 0 ? -Devices.screen.width : 0),
  }));

  const chatAssistantViewStyle = useAnimatedStyle(() => ({
    ...styles.container,
    ...styles.chatAssistantContainer,
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    top: withTiming(_chatViewValue.value == 0 ? Devices.screen.height : 0),
    bottom: withTiming(_chatViewValue.value == 0 ? -Devices.screen.height : 0),
    opacity: withTiming(_chatViewValue.value),
  }));

  const submitPressed = () => {
    store.mapManager.setCurrentMap('results');
    store.mapManager.setCurrentIndoorMap('results');
    if (store.trip.request.whenAction === 'asap') {
      setSelectedDateTime(moment());
      store.trip.updateWhen(moment().toDate());
    }
    console.log('SUBMIT');
    navigation.push('schedule.results');
  };

  const dateTimeStyle = () => {
    return {
      height: 34 * currentFontScale,
    };
  };

  const dateTimeOnLayout = (e) => {
    if (dateTimeWidth === 0) {
      setDateTimeWidth(e.nativeEvent.layout.width);
    }
  };

  return (
    <>
      <Animated.View
        style={stepOneViewStyle}
      >

        <View style={styles.header}>
          <Pressable
            style={styles.headerBackButton}
            onPress={() => {
              if (navigation.canGoBack()) {
                store.mapManager.setCurrentMap('home');
                store.mapManager.setCurrentIndoorMap('results');
                navigation.pop();
              }
              else {
                store.mapManager.setCurrentMap('home');
                store.mapManager.setCurrentIndoorMap('results');
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'home' }],
                });
              }
            }}
            accessibilityLabel={translator.t('global.backLabelDefault')}
            accessibilityLanguage={store.preferences.language || 'en'}
          >
            <FontAwesomeIcon
              icon="chevron-left"
              size={18 * deviceMultiplier}
            />
          </Pressable>

          <Text
            style={styles.headerLabel}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
          >{translator.t('views.scheduleTrip.plan.header')}</Text>

          <TouchableOpacity
            style={styles.chatAssistantButton}
            onPress={() => {
              _chatViewValue.value = 1;
            }}
            accessibilityLabel={translator.t('views.scheduleTrip.plan.chatLabel')}
            accessibilityLanguage={store.preferences.language || 'en'}
          >
            <FontAwesomeIcon
              icon="user"
              size={20 * deviceMultiplier}
              style={styles.chatAssistantButtonUser}
            />
            <FontAwesomeIcon
              icon="wifi"
              size={12 * deviceMultiplier}
              style={styles.chatAssistantButtonWifi}
            />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>

          <Input
            ref={fromInputRef}
            leftIconName="magnifying-glass"
            label={translator.t('views.scheduleTrip.plan.fromInputLabel')}
            placeholder={translator.t('views.scheduleTrip.plan.fromInputPlaceholder')}
            value={selectedFromAddress && (selectedFromAddress?.alias || selectedFromAddress?.text)}
            onFocus={fromRefInputFocus}
            inputStyle={{
              marginBottom: 12,
            }}
          />
          {store.authentication.loggedIn &&
            <View
              style={styles.checkBoxContainer}
            >
              {!store.trip.request.origin?.id &&
                <CheckBox
                  boxType="square"
                  style={styles.checkBox}
                  disabled={!selectedFromAddress}
                  value={saveFromCheckbox}
                  onValueChange={(value) => {
                    favoriteCheckboxChange(value, 'from');
                  }}
                  accessibilityLabel={translator.t('views.scheduleTrip.plan.checkboxSave')}
                  accessibilityLanguage={store.preferences.language || 'en'}
                />
              }
              {store.trip.request.origin?.id &&
                <FontAwesomeIcon
                  style={styles.favoriteAddressIcon}
                  icon="star"
                  size={20 * deviceMultiplier}
                  color={Colors.primary1}
                />
              }
              <Text
                style={{
                  ...styles.checkBoxText,
                  color: !selectedFromAddress ? Colors.dark : Colors.primary1,
                }}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t(`views.scheduleTrip.plan.${store.trip.request.origin?.id ? 'savedAddress' : 'saveAddress'}`)}</Text>
            </View>
          }

          <TouchableOpacity
            style={styles.swapButton}
            onPress={handleSwapPress}
          >
            <FontAwesomeIcon
              icon="retweet"
              size={24 * deviceMultiplier}
              color={Colors.primary1}
            />
          </TouchableOpacity>

          <Input
            ref={toInputRef}
            leftIconName="magnifying-glass"
            label={translator.t('views.scheduleTrip.plan.toInputLabel')}
            placeholder={translator.t('views.scheduleTrip.plan.toInputPlaceholder')}
            value={selectedToAddress && (selectedToAddress?.alias || selectedToAddress?.text)}
            onFocus={toRefInputFocus}
            inputStyle={{
              marginBottom: 12,
            }}
          />
          {store.authentication.loggedIn &&
            <View
              style={styles.checkBoxContainer}
            >
              {!store.trip.request.destination?.id &&
                <CheckBox
                  boxType="square"
                  style={styles.checkBox}
                  disabled={!selectedToAddress}
                  value={saveToCheckbox}
                  onValueChange={(value) => {
                    favoriteCheckboxChange(value, 'to');
                  }}
                  accessibilityLabel={translator.t('views.scheduleTrip.plan.checkboxSave')}
                  accessibilityLanguage={store.preferences.language || 'en'}
                />
              }
              {store.trip.request.destination?.id &&
                <FontAwesomeIcon
                  style={styles.favoriteAddressIcon}
                  icon="star"
                  size={20 * deviceMultiplier}
                  color={Colors.primary1}
                />
              }
              <Text
                style={{
                  ...styles.checkBoxText,
                  color: !selectedToAddress ? Colors.dark : Colors.primary1,
                }}
                maxFontSizeMultiplier={config.MAX_FONT_SCALE}
              >{translator.t(`views.scheduleTrip.plan.${store.trip.request.destination?.id ? 'savedAddress' : 'saveAddress'}`)}</Text>
            </View>
          }

          <View style={styles.line} />

          <RadioButtonGroup
            style={{
              marginBottom: 30,
            }}
            items={config.WHEN_OPTIONS.map(option => {
              return {
                label: translator.t(`views.scheduleTrip.plan.when.${option.value}`),
                value: option.value,
              };
            })}
            value={selectedWhenAction}
            onChange={whenActionChange}
          />

          {selectedWhenAction !== 'asap' &&
            <>
              {Devices.isIphone &&
                <View style={styles.dateTimeContainer}>
                  <Text
                    style={styles.formLabel}
                    maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                  >{translator.t('views.scheduleTrip.plan.dateInputLabel')}</Text>
                  <View style={{
                    width: '100%',
                    alignItems: 'flex-start',
                  }}>
                    <DateTimePicker
                      value={selectedDateTime.toDate()}
                      mode="date"
                      accentColor={Colors.primary1}
                      style={{
                        ...dateTimeStyle(),
                        // width: currentFontScale <= 2.143 ? (135 * currentFontScale) : '100%',
                      }}
                      onChange={dateChange}
                    />
                  </View>
                </View>
              }
              {Devices.isAndroid &&
                <Input
                  rightIconName="calendar"
                  label={translator.t('views.scheduleTrip.plan.dateInputLabel')}
                  placeholder="MM/DD/YYYY"
                  value={selectedDateTime.format('MMM D, YYYY')}
                  onFocus={dateFocus}
                  inputStyle={{
                    marginBottom: 12,
                  }}
                />
              }

              {Devices.isIphone &&
                <View style={styles.dateTimeContainer}>
                  <Text
                    style={styles.formLabel}
                    maxFontSizeMultiplier={config.MAX_FONT_SCALE}
                  >{translator.t('views.scheduleTrip.plan.timeInputLabel')}</Text>
                  <View style={{
                    width: '100%',
                    alignItems: 'flex-start',
                  }}>
                    <DateTimePicker
                      value={selectedDateTime.toDate()}
                      onLayout={dateTimeOnLayout}
                      mode="time"
                      style={{
                        ...dateTimeStyle(),
                        // width: currentFontScale <= 2.143 ? (100 * currentFontScale) : '100%',
                      }}
                      onChange={timeChange}
                    />
                  </View>

                </View>
              }
              {Devices.isAndroid &&
                <Input
                  // ref={toInputRef}
                  rightIconName="clock"
                  label={translator.t('views.scheduleTrip.plan.timeInputLabel')}
                  placeholder="0:00"
                  value={selectedDateTime.format('h:mm A')}
                  onFocus={timeFocus}
                  inputStyle={{
                    marginBottom: 12,
                  }}
                />
              }
            </>
          }

        </ScrollView>

        <View
          style={styles.footer}>

          <Button
            label={translator.t('global.nextLabel')}
            onPress={() => {
              if (selectedDateTime.isAfter(moment().subtract(5, 'minute'))) {
                if (selectedFromAddress && selectedToAddress) {
                  const hdsStart = moment().hour(config.HDS_HOURS.start[0]).minute(config.HDS_HOURS.start[1]).second(0),
                    hdsEnd = moment().hour(config.HDS_HOURS.end[0]).minute(config.HDS_HOURS.end[1]).second(0);
                  const inTimeframe = selectedDateTime.isAfter(hdsStart) && selectedDateTime.isBefore(hdsEnd);
                  setInCommunityShuttleTimeframe(inTimeframe);
                  if (!inTimeframe) {
                    modeChange('hail', false);
                  }
                  else {
                    modeChange('hail', store.preferences.modes.indexOf('hail') > -1);
                  }
                  _stepViewValue.value = 1;
                }
                else {
                  Alert.alert(
                    translator.t('views.scheduleTrip.plan.alerts.noOrigin.title'),
                    translator.t('views.scheduleTrip.plan.alerts.noOrigin.message'),
                    [
                      {
                        text: translator.t('views.scheduleTrip.plan.alerts.noOrigin.buttons.ok'),
                        style: 'cancel',
                      },
                    ],
                  );
                }
              }
              else {
                Alert.alert(
                  translator.t('views.scheduleTrip.plan.alerts.inPast.title'),
                  translator.t('views.scheduleTrip.plan.alerts.inPast.message'),
                  [
                    {
                      text: translator.t('views.scheduleTrip.plan.alerts.noOrigin.buttons.ok'),
                      style: 'cancel',
                    },
                  ],
                );
              }
            }}
          />

          <Button
            label={translator.t('global.cancelLabel')}
            buttonStyle={{
              backgroundColor: Colors.white,
              borderColor: Colors.white,
              marginBottom: 0
            }}
            labelStyle={{
              color: Colors.primary1,
            }}
            onPress={() => {
              if (navigation.canGoBack()) {
                store.mapManager.setCurrentMap('home');
                store.mapManager.setCurrentIndoorMap('results');
                navigation.pop();
              }
              else {
                store.mapManager.setCurrentMap('home');
                store.mapManager.setCurrentIndoorMap('results');
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'home' }],
                });
              }
            }}
          />

        </View>

      </Animated.View>

      <Animated.View
        style={stepTwoViewStyle}
      >

        <View style={styles.header}>
          <Pressable
            style={styles.headerBackButton}
            onPress={() => {
              _stepViewValue.value = 0;
            }}
            accessibilityLabel={translator.t('global.backLabelDefault')}
            accessibilityLanguage={store.preferences.language || 'en'}
          >
            <FontAwesomeIcon
              icon="chevron-left"
              size={18 * deviceMultiplier} />
          </Pressable>

          <Text
            style={styles.headerLabel}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
          >{translator.t('views.scheduleTrip.plan.header')}</Text>
        </View>

        <ScrollView
          style={styles.content}
        >

          <Text
            style={styles.formLabel}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
          >{translator.t('views.scheduleTrip.plan.modes')}</Text>

          {config.MODES
            .filter(m => m.mode !== 'walk' && m.mode !== 'indoor')
            .map(modesArrayToCheckboxes)
          }

          <View style={styles.line} />

          {/* {store.authentication.loggedIn &&
            <>

              <Text style={styles.formLabel}>How Many People Are Riding</Text>

              <Input
                ref={numberOfPeopleInputRef}
                rightIconName="chevron-down"
                value={numberOfPeopleLabel}
                onFocus={numberOfPeopleInputRefFocus}
              />

              <Text style={styles.formLabel}>Select a Caretaker</Text>

              <Input
                ref={caretakerInputRef}
                rightIconName="chevron-down"
                value={caretakerLabel}
                onFocus={caretakerInputRefFocus}
              />

            </>
          } */}

        </ScrollView>

        <View
          style={styles.footer}
        >

          <Button
            label={translator.t('global.submitLabel')}
            onPress={submitPressed}
          />

          <Button
            label={translator.t('global.cancelLabel')}
            buttonStyle={{
              backgroundColor: Colors.white,
              borderColor: Colors.white,
              marginBottom: 0
            }}
            labelStyle={{
              color: Colors.primary1,
            }}
            onPress={() => {
              store.mapManager.setCurrentMap('home');
              store.mapManager.setCurrentIndoorMap('results');
              navigation.pop();
            }}
          />

        </View>

      </Animated.View>

      <Animated.View
        style={chatAssistantViewStyle}
      >

        <View style={styles.header}>
          <Pressable
            style={styles.headerBackButton}
            onPress={() => {
              resetConversation();
              _chatViewValue.value = 0;
            }}
          >
            <FontAwesomeIcon
              icon="chevron-left"
              size={18 * deviceMultiplier} />
          </Pressable>

          <Text
            style={styles.headerLabel}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
          >{translator.t('views.scheduleTrip.plan.header')}</Text>
        </View>

        <View
          style={styles.top}
        >

          <TouchableOpacity
            style={{
              ...styles.chatAssistantIcon,
              backgroundColor: conversationStatus === 'started' ? Colors.success : Colors.primary1
            }}
            onPress={toggleConversation}
          >
            <FontAwesomeIcon
              icon="user"
              size={75}
              style={styles.chatAssistantIconUser}
            />
            <FontAwesomeIcon
              icon="wifi"
              size={50}
              style={styles.chatAssistantIconWifi}
            />
          </TouchableOpacity>

        </View>

        <ScrollView
          ref={chatScrollViewRef}
          contentContainerStyle={{
            paddingBottom: 100
          }}
          onContentSizeChange={() => {
            chatScrollViewRef.current.scrollToEnd();
          }}
        >
          {userRequests.map((c, i) => {
            return (
              <View
                key={i}
              >

                <View style={styles.chatTextBlock}>
                  <View style={styles.chatTextLeftSpacer} />
                  <View style={styles.chatTextRight}>
                    <Text
                      style={styles.chatRequestText}
                    >{userRequests[i]}</Text>
                  </View>
                </View>

                {(i === userRequests.length - 1 && chatWaiting) ||
                  <View style={styles.chatTextBlock}>
                    <View style={styles.chatTextLeft}>
                      <Text
                        style={styles.chatResponseText}
                      >{chatResponses[i]?.response.state.assistantAnswer}</Text>
                    </View>
                    <View style={styles.chatTextRightSpacer} />
                  </View>
                }

              </View>
            );
          })}
          {chatWaiting &&
            <Dots
              size={8}
            />
          }
        </ScrollView>

      </Animated.View>

      <AddressSearch
        location={currentLocation?.position}
        show={showAddressSearch}
        onAddressSelect={handleAddressSearchSelect}
        onCancelPress={handleCancelAddressSearch}
        savedAddresses={store.favorites.locations}
        homeAddress={store.profile.address}
      />

      <Modal
        show={showSave}
        height={390}
      >
        <Text
          style={styles.favoriteTitle}
          maxFontSizeMultiplier={config.MAX_FONT_SCALE}
        >{translator.t('views.scheduleTrip.plan.favoritePopupTitle')}</Text>
        <Text
          style={styles.favoriteSubtitle}
          maxFontSizeMultiplier={config.MAX_FONT_SCALE}
        >{translator.t('views.scheduleTrip.plan.favoritePopupSubTitle')}</Text>
        <Text
          style={{
            ...styles.favoriteAddress,
            marginBottom: favoriteAddress.description ? 0 : 20,
          }}
          maxFontSizeMultiplier={config.MAX_FONT_SCALE}
        >{favoriteAddress?.title}</Text>
        {favoriteAddress.description &&
          <Text
            style={{
              ...styles.favoriteAddress,
              marginBottom: 20,
            }}
            maxFontSizeMultiplier={config.MAX_FONT_SCALE}
          >{favoriteAddress.description}</Text>
        }
        <Input
          ref={favoriteInputRef}
          placeholder={translator.t('views.scheduleTrip.plan.favoriteInputPlaceholder')}
          label={translator.t('views.scheduleTrip.plan.favoriteInputLabel')}
          value={favoriteName}
          onChangeText={(value) => {
            setFavoriteName(value);
          }}
          inputStyle={{
            marginBottom: 40,
            width: '100%',
          }}
        />
        <View style={styles.favoriteFooter}>
          <Button
            label={translator.t('global.saveLabel')}
            width={150}
            onPress={saveFavorite}
            disabled={favoriteName.length === 0}
          />
          <Button
            label={translator.t('global.cancelLabel')}
            width={150}
            buttonStyle={{
              backgroundColor: Colors.white,
              borderColor: Colors.white,
            }}
            labelStyle={{
              color: Colors.primary1,
            }}
            onPress={cancelSaveFavorite}
          />
        </View>
      </Modal >

      <Popup
        title="How Many People"
        titleStyle={{
          marginBottom: 50,
        }}
        label={numberOfPeopleLabel}
        labelStyle={{
          marginBottom: 0,
        }}
        show={showNumberOfPeople}
        onClosePress={() => {
          setShowNumberOfPeople(false);
        }}
      >
        <Picker
          style={{
            width: '100%',
          }}
          selectedValue={numberOfPeople}
          onValueChange={numberOfPeopleChange}
        >
          <Picker.Item label="1" value={1} />
          <Picker.Item label="2" value={2} />
          <Picker.Item label="3" value={3} />
          <Picker.Item label="4" value={4} />
        </Picker>
      </Popup>

      <Popup
        title="Select a Caretaker"
        titleStyle={{
          marginBottom: 50,
        }}
        label={caretakerLabel}
        labelStyle={{
          marginBottom: 0,
        }}
        show={showCaretaker}
        onClosePress={() => {
          setShowCaretaker(false);
        }}
      >
        <Picker
          style={{
            width: '100%',
          }}
          selectedValue={caretaker}
          onValueChange={caretakerChange}
        >
          <Picker.Item label="None" value="none" />
          {profile?.caretakers.map((c, i) => {
            const name = `${c.firstName} ${c.lastName}`;
            return (
              <Picker.Item
                key={i}
                label={name}
                value={c.email}
              />
            );
          })}
        </Picker>
      </Popup>

    </>
  );
});

Plan.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    push: PropTypes.func,
    addListener: PropTypes.func,
  }),
};

export default Plan;

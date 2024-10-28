/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { Colors, Devices, Typography } from '../../styles';
import Header from '../../components/Header';
import { useStore } from '../../stores/RootStore';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import translator from '../../models/translator';

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: 25,
    paddingTop: 65,
  },
  content: {
    flex: 1,
  },
  card: {
    borderWidth: 1,
    borderColor: Colors.dark,
    borderRadius: 8,
    marginBottom: 17,
    position: 'relative',
  },
  cardTop: {
    paddingHorizontal: 24,
    paddingTop: 15,
    paddingBottom: 12,
  },
  cardBottom: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardButton: {
    backgroundColor: Colors.primary1,
    borderColor: Colors.primary1,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cardButtonLabel: {
    ...Typography.h4,
    color: Colors.white,
  },
  name: {
    ...Typography.h2,
    marginBottom: 7,
    fontWeight: 'bold',
  },
  phone: {
    ...Typography.h4,
    marginBottom: 4,
    opacity: 0.7,
  },
  email: {
    ...Typography.h4,
    marginBottom: 4,
    opacity: 0.7,
  },
  status: {
    ...Typography.h5,
    marginBottom: 10,
    color: Colors.primary1,
    fontWeight: 'bold',
  },
  deleteButton: {
    position: 'absolute',
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    top: 10,
    right: 10,
  },
  scheduleButton: {
    position: 'absolute',
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    bottom: 10,
    right: 10,
  },
  addContainer: {
    position: 'absolute',
    right: 0,
    left: 0,
    height: Devices.screen.height,
    backgroundColor: Colors.white,
  },
  addKeyboardView: {
    position: 'relative',
    display: 'flex',
    flex: 1,
    paddingTop: Devices.isIphoneX ? 100 : 80,
    paddingHorizontal: 25,
  },
  fieldContainer: {
    position: 'relative',
  },
  error: {
    ...Typography.h6,
    position: 'absolute',
    top: -7,
    left: 14,
    color: Colors.danger,
    fontWeight: 'bold',
    backgroundColor: Colors.white,
    zIndex: 10,
    paddingHorizontal: 4,
  },
  closeButton: {
    position: 'absolute',
    top: Devices.isIphone ? 65 : 45,
    right: 25,
    color: Colors.primary1,
    marginBottom: 43,
    zIndex: 10,
  },
  closeButtonIcon: {
    color: Colors.primary1,
  },
  addButton: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    marginBottom: 19,
  },
  addButtonIcon: {
    color: Colors.primary1,
    marginRight: 10,
  },
  addButtonLabel: {
    ...Typography.h5,
    color: Colors.primary1,
    fontWeight: 'bold',
  },
  title: {
    ...Typography.h2,
    color: Colors.primary1,
    marginBottom: 150,
  },
  saveButton: {
    marginBottom: 80,
  },
  deleteTitle: {
    ...Typography.h3,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  deleteDependentName: {
    ...Typography.h3,
    marginBottom: 5,
  },
  deleteDependentEmail: {
    ...Typography.h3,
    marginBottom: 20,
  },
  deleteFooter: {
    width: '100%',
    alignItems: 'center',
  },
});

const Dependents = observer(({
  navigation,
}) => {
  const store = useStore();

  const [dependents, setDependents] = useState(store.traveler.dependents || []);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [selectedDependent, setSelectedDependent] = useState(null);

  useEffect(() => {
    fetchDependents();
  }, []);

  const fetchDependents = () => {
    store.authentication.fetchAccessToken()
      .then((accessToken) => {
        store.traveler.getDependents(accessToken)
          .then(results => {
            setDependents(results);
          })
          .catch((e) => {
            console.log('get dependents error', e);
          });
      })
      .catch((e) => {
        console.log('fetch access token error', e);
      });
  };

  const handleDeleteDependentPress = (dependent) => {
    setSelectedDependent(dependent);
    setShowConfirmDelete(true);
  };

  const confirmDeletePress = () => {
    setShowConfirmDelete(false);
    store.display.showSpinner();
    store.authentication.fetchAccessToken()
      .then((accessToken) => {
        store.traveler.deleteDependent(selectedDependent.id, accessToken)
          .then(() => {
            setTimeout(() => {
              setDependents(store.traveler.dependents);
              store.display.hideSpinner();
              setSelectedDependent(null);
            }, 750);
          })
          .catch((e) => {
            setTimeout(() => {
              store.display.hideSpinner();
              setSelectedDependent(null);
            }, 750);
            console.log('delete dependent error', e);
          });
      })
      .catch((e) => {
        setTimeout(() => {
          store.display.hideSpinner();
          setSelectedDependent(null);
        }, 750);
        console.log('fetch access token error', e);
      });
  };

  const cancelDeletePress = () => {
    setSelectedDependent(null);
    setShowConfirmDelete(false);
  };

  const handleAcceptPress = (caregiver) => {
    updateDependentStatus(caregiver.id, 'approved');
  };

  const handleDeclinePress = (caregiver) => {
    updateDependentStatus(caregiver.id, 'denied');
  };

  const updateDependentStatus = (caregiverId, status) => {
    store.authentication.fetchAccessToken()
      .then((accessToken) => {
        const userId = store.authentication.user?.id;
        store.traveler.updateDependentStatus(caregiverId, userId, status, accessToken)
          .then(result => {
            if (result.status === status) {
              fetchDependents();
            }
          })
          .catch((e) => {
            console.log('update dependent status error', e);
          });
      })
      .catch((e) => {
        console.log('fetch access token error', e);
      });
  };

  const handleDependentSchedulePress = (dependent) => {
    store.traveler.setSelectedDependent(dependent);
    navigation.push('schedule.dependents');
  };

  return (
    <>

      <View
        style={styles.mainContainer}
      >
        <Header
          title={translator.t('views.account.dependents.header')}
          onBackPress={() => {
            navigation.pop();
          }}
          backLabel={translator.t('global.backLabel', { to: translator.t('views.account.menu.header') })}
        />
        <View style={styles.content}>

          <ScrollView
            style={{
              marginBottom: 60,
            }}
            contentContainerStyle={{
              paddingBottom: 100,
            }}
          >

            {dependents.map((d, i) => {
              return (
                <View
                  key={i}
                  style={styles.card}>
                  <View style={styles.cardTop}>
                    {d.status === 'approved' &&
                      <FontAwesomeIcon
                        style={styles.status}
                        icon="check-circle"
                        size={18}
                      />
                    }
                    <Text style={styles.name}>{d?.firstName}{' '}{d?.lastName}</Text>
                    <Text style={styles.email}>{d?.email}</Text>
                  </View>
                  {d.status === 'received' &&
                    <View
                      style={styles.cardBottom}
                    >
                      <TouchableOpacity
                        style={styles.cardButton}
                        onPress={() => {
                          handleAcceptPress(d);
                        }}
                      >
                        <Text
                          style={styles.cardButtonLabel}
                        >{translator.t('views.account.dependents.accept')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{
                          ...styles.cardButton,
                          backgroundColor: Colors.white,
                        }}
                        onPress={() => {
                          handleDeclinePress(d);
                        }}
                      >
                        <Text
                          style={{
                            ...styles.cardButtonLabel,
                            color: Colors.primary1,
                          }}>{translator.t('views.account.dependents.decline')}</Text>
                      </TouchableOpacity>
                    </View>
                  }
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                      handleDeleteDependentPress(d);
                    }}
                    accessibilityLabel={translator.t('views.account.dependents.delete')}
                    accessibilityLanguage={store.preferences.language || 'en'}
                  >
                    <FontAwesomeIcon
                      icon="trash"
                      size={20}
                      color={Colors.danger}
                    />
                  </TouchableOpacity>
                  {d.status === 'approved' &&
                    <TouchableOpacity
                      style={styles.scheduleButton}
                      onPress={() => {
                        handleDependentSchedulePress(d);
                      }}
                    >
                      <FontAwesomeIcon
                        icon="calendar-day"
                        size={20}
                        color={Colors.primary1}
                      />
                    </TouchableOpacity>
                  }
                </View>
              );
            })
            }

          </ScrollView>

        </View>

      </View>

      <Modal
        show={showConfirmDelete}
        height={270}
      >
        <Text
          style={styles.deleteTitle}
        >{translator.t('views.account.dependents.deleteConfirm')}</Text>
        <Text
          style={styles.deleteDependentName}
        >{selectedDependent?.name}</Text>
        <Text
          style={styles.deleteDependentEmail}
        >{selectedDependent?.email}</Text>
        <View style={styles.deleteFooter}>
          <Button
            label={translator.t('global.deleteLabel')}
            width={150}
            onPress={confirmDeletePress}
          />
          <Button
            label={translator.t('global.cancelLabel')}
            width={150}
            buttonStyle={{
              backgroundColor: Colors.white,
              borderColor: Colors.white,
              marginBottom: 0,
            }}
            labelStyle={{
              color: Colors.primary1,
            }}
            onPress={cancelDeletePress}
          />
        </View>
      </Modal>

    </>
  );
});

Dependents.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    push: PropTypes.func,
    pop: PropTypes.func,
  }).isRequired,
};

export default Dependents;

/**
 * Keeps app in sync with live service state, such as bus locations.
 * @module stream
 */

import { AppState } from 'react-native';

import config from '../config';
// import usermanager from './usermanager';

const ConnectionState = {
  disconnected: 0,
  connecting: 1,
  connectedAnonymously: 2,
  loggedIn: 3,
  loginFailed: 4,
  reconnecting: 5,
};

const stream = {
  state: ConnectionState.disconnected,

  subscriptions: {}, // things that the socket will receive.
  listeners: [], // in-app consumers of the stream.

  /**
   * Only call this one time at the beginning of the app.
   */
  startup: (store) => {
    if (stream.store) {return;}
    stream.store = store;
    // stream._startConnections();
    stream.appStateListener = AppState.addEventListener('change', stream._handleAppStateChange);
    // stream.userWatcher = usermanager.subscribe((eventType) => {
    //   if (eventType === usermanager.EventType.login) {
    //     stream.login();
    //   } else if (eventType === usermanager.EventType.logout) {
    //     stream._stopConnections();
    //   }
    // });
  },

  /**
   * Called when stream is no longer needed.
   */
  shutdown: () => {
    stream._stopConnections();
    stream.appStateListener.remove();
  },

  _startConnections: () => {
    // the connection cannot be opened until the user is logged into an organization.
    const orgDomain = config.subdomain;
    if (!orgDomain) {return;}

    if (orgDomain !== 'lickingcounty') {return;} // TEMP

    console.log('startConnections called.');

    // don't connect when in background.
    if (AppState.currentState !== 'active') {return;}

    const INITIAL_WS_RECONNECT_MS = 250;
    let reconnectDelay = INITIAL_WS_RECONNECT_MS;

    let connectWS;

    function retryConnect() {
      if (stream.state === ConnectionState.reconnecting) {return;}
      stream.state = ConnectionState.reconnecting;
      // use an exponentially growing wait time for reconnect
      console.log('scheduling retry...');
      setTimeout(connectWS, Math.min(10000, reconnectDelay += reconnectDelay));
    }

    connectWS = () => {
      if (stream.ws) {return;} // an existing socket is not closed.

      const url = config.SERVICES.streamsocket.replace(/{org}/g, orgDomain);
      console.log(`attempting connection to ${url}...`);
      const ws = new WebSocket(url);
      stream.ws = ws;
      stream.state = ConnectionState.connecting;

      const KEEPALIVE_MS = 50000; // every 50 seconds, in case an LB/proxy drops after 60 seconds
      const KEEPALIVE_RESPOND_MS = 5000;
      let keepaliveTimer = null;

      function sendKeepalive() {
        // this gets sent every KEEPALIVE_MS after we last heard from the server.
        // send a ping message, and if we don't get a pong (or other response), then
        // close the socket after the KEEPALIVE_RESPOND_MS.
        if (ws.readyState === WebSocket.OPEN) {
          ws.send('{"action":"ping"}');
          keepaliveTimer = setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.close();
            }
          }, KEEPALIVE_RESPOND_MS);
        }
      }

      function gotCommunication() {
        clearTimeout(keepaliveTimer);
        keepaliveTimer = setTimeout(sendKeepalive, KEEPALIVE_MS);
      }

      ws.onopen = () => {
        console.log('Websocket connected to server.');

        // connection opened
        reconnectDelay = INITIAL_WS_RECONNECT_MS;

        gotCommunication();

        stream.state = ConnectionState.connectedAnonymously;
        stream.login();
      };

      ws.onmessage = (e) => {
        // console.log(`got web socket message ${e.data}`);
        gotCommunication();
        const msg = JSON.parse(e.data);
        if (msg.action === 'pong') {
          return;
        }
        if (msg.action === 'identify') { // login response
          if (msg.success) {
            console.log('stream login successful');
            stream.state = ConnectionState.loggedIn;
            stream.updateSubscriptions();
          } else {
            console.log('STREAM LOGIN FAILED');
            stream.state = ConnectionState.loginFailed;
          }
          return;
        }
        stream._applyMessage(msg);
      };

      ws.onclose = (e) => {
        clearTimeout(keepaliveTimer);
        if (ws !== stream.ws) {return;} // prevent race condition, like purposeful close
        stream.ws = null;
        console.log(`Websocket was closed, trying to reconnect (code: ${e.code}, reason: ${e.reason})`);
        retryConnect();
      };

      ws.onerror = (err) => {
        clearTimeout(keepaliveTimer); // just in case .onclose doesn't fire
        if (stream.ws !== ws) {return;} // connection is no longer relevant

        // an error occurred, try to reconnect.
        console.log(`Socket encountered error (${err.message}`);
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        } else {
          retryConnect();
        }
      };
    };

    connectWS();
  },

  _stopConnections: () => {
    if (stream.ws) {
      const socketToClose = stream.ws;
      stream.ws = null; // so it does not get reopened automatically.
      console.log('stopping connections, websocket closing.');
      socketToClose.close();
    }
  },

  _sendToWebsocket(content) {
    // TODO: cache if ws is closed? ws is closed when connection is lost and is
    // closed (and set to null) when going to background.
    // console.log('sending to websocket...');
    if (stream.ws && stream.ws.readyState === WebSocket.OPEN) {
      stream.ws.send(content);
    } else {
      console.log('waiting to send since connection is closed.');
    }
  },

  _handleAppStateChange: (newState) => {
    if (newState === 'active') {
      console.log('app is being activated.');
      // this message can arrive when the app first starts.
      // we don't want to open multiple connections, or close connections
      // if we don't have to.
      if (!stream.ws) {
        stream._startConnections();
      }
    } else {
      console.log('app is being deactivated.');
      // close connections after a while in the background.
      setTimeout(() => {
        if (AppState.currentState !== 'active') {
          stream._stopConnections();
        }
      }, 30000);
    }
  },

  /**
   * Topics:
   *  - shuttles
   *  - poolmember
   * Messages:
   *  - cache: server sends messages to update a particular topic with `cache` messages
   *  - shuttles / status: information for a shared trip
   *  - poolmembers / update: individual user information for a given commute id (NOT a trip)
   *  - chat: chat messages for a group
   * @param {*} msg
   */
  _applyMessage(msg) {
    if (msg.topic) {
      const { topic } = msg;
      stream.listeners.forEach((listener) => {
        if (!listener.topics || listener.topics.indexOf(topic) !== -1) {
          listener.callback(msg, topic);
        }
      });
    }
  },

  /**
   * Authenticate with the server.
   */
  async login() {
    if (stream.state === ConnectionState.loggedIn || stream.state === ConnectionState.loginFailed) {
      return;
    }
    console.log('login with stream');

    const accessToken = await stream.store.authentication.fetchAccessToken();
    if (!accessToken) {
      return;
    }

    const profile = stream.store.authentication.user?.profile;
    // console.log(`user profile: ${JSON.stringify(profile)}`);
    if (!accessToken || !profile?.deviceToken) {
      console.log(`Trying to auth with stream, but token (${accessToken}) or device (${profile?.deviceToken}) is not yet ready.`);
      return;
    }

    if (stream.state === ConnectionState.disconnected) {
      // connection could not be opened until the login was made and org is known, so now it can
      // happen and it will initiate this function again.
      stream._startConnections();
    } else if (stream.state === ConnectionState.connectedAnonymously) {
      // TODO: send device info to registration service, only send JWT to stream.
      stream._sendToWebsocket(JSON.stringify({
        action: 'identify',
        // userId: stream.store.authentication.user.id,
        token: accessToken,
        deviceToken: profile.deviceToken,
        firstName: profile.firstName,
        lastName: profile.lastName,
      }));
      // retry after a wait.
      setTimeout(stream.login, 5000);
    }
  },

  /**
   * Tell the server what we're interested in receiving info on.
   */
  updateSubscriptions() {
    console.log('update subscriptions');
    stream._sendToWebsocket(JSON.stringify({
      action: 'setSubscriptions',
      subscriptions: stream.subscriptions,
    }));
  },

  sendMessage(topic, action, msg) {
    // console.log(`send message: ${action} for ${topic}`);
    const payload = {
      topic,
      action,
      ts: new Date().getTime(),
      ...msg,
    };
    // stringify the payload first, in case applying it alters content before send.
    const content = JSON.stringify(payload);
    stream._applyMessage(payload);
    stream._sendToWebsocket(content);
  },

  /**
   * Clear all subscriptions for the given topic.
   * Don't pass anything to unsubscribe from all topics.
   */
  clearSubscription(topic) {
    if (topic) {
      delete stream.subscriptions[topic];
    } else {
      stream.subscriptions = {};
    }
    stream.updateSubscriptions();
  },

  /**
   * Returns the list of subscriptions for a given topic.
   */
  getSubscriptions(topic) {
    const subscriptions = stream.subscriptions[topic] || [];
    stream.subscriptions[topic] = subscriptions;
    return subscriptions;
  },

  /**
   * Set the subscriptions for the topic to a list of
   * queries or a single query object.
   */
  setSubscriptions(topic, queryParams) {
    let paramsList = queryParams;
    if (!queryParams.length) {
      paramsList = [queryParams];
    }
    stream.subscriptions[topic] = paramsList;
    stream.updateSubscriptions();
  },

  addSubscription(topic, queryParams) {
    const subscriptions = stream.getSubscriptions(topic);
    subscriptions.push(queryParams);
  },

  /**
   * Listen to one or more topics, or all.
   * It returns a listener object which allows you to .remove() it.
   * @param {string[]} topics - optional, defaults to all.
   * @param {Function} callback
   */
  addListener(topics, callback) {
    let topicsList = topics;
    let withCallback = callback;
    if (!callback) {
      withCallback = topicsList;
      topicsList = null;
    }

    if (topicsList && topicsList.substring) {
      topicsList = [topicsList];
    }

    const listener = {
      callback: withCallback,
      topicsList,
      remove: () => {
        const index = stream.listeners.indexOf(listener);
        stream.listeners.splice(index, 1);
      },
    };

    stream.listeners.push(listener);
    return listener;
  },

};

export default stream;

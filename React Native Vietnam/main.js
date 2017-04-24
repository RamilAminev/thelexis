'use strict';

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  TextInput,
  ListView,
} from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome';

import io from 'socket.io-client';

const socket = io.connect('https://react-native-webrtc.herokuapp.com', {transports: ['websocket']});

import {
  RTCPeerConnection,
  RTCMediaStream,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  MediaStreamTrack,
  getUserMedia,
} from 'react-native-webrtc';

let container;

const configuration = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};

const pcPeers = {};
let localStream;

function getLocalStream(callback) {
  MediaStreamTrack.getSources(sourceInfos => {
    // console.log(sourceInfos);
    // let videoSourceId;
    // for (const i = 0; i < sourceInfos.length; i++) {
    //   const sourceInfo = sourceInfos[i];
    //   if(sourceInfo.kind == "audio") {
    //     videoSourceId = sourceInfo.id;
    //   }
    // }
    getUserMedia({
      audio: true,
      video: false,
      // video: {
      //   mandatory: {
      //     minWidth: 500, // Provide your own width, height and frame rate here
      //     minHeight: 300,
      //     minFrameRate: 30
      //   },
      //   facingMode: (isFront ? "user" : "environment"),
      //   optional: [{ sourceId: sourceInfos.id }]
      // }
    }, function (stream) {
      console.log('dddd', stream);
      callback(stream);
    }, logError);
  });
}

getLocalStream((stream) => localstream));

function join(roomID) {
  socket.emit('join', roomID, function(socketIds){
    console.log('join', socketIds);
    for (const i in socketIds) {
      const socketId = socketIds[i];
      createPC(socketId, true);
    }
  });
}

function createPC(socketId, isOffer) {
  const pc = new RTCPeerConnection(configuration);
  pcPeers[socketId] = pc;

  pc.onicecandidate = function (event) {
    console.log('onicecandidate', event.candidate);
    if (event.candidate) {
      socket.emit('exchange', {'to': socketId, 'candidate': event.candidate });
    }
  };

  function createOffer() {
    pc.createOffer(function(desc) {
      console.log('createOffer', desc);
      pc.setLocalDescription(desc, function () {
        console.log('setLocalDescription', pc.localDescription);
        socket.emit('exchange', {'to': socketId, 'sdp': pc.localDescription });
      }, logError);
    }, logError);
  }

  pc.onnegotiationneeded = function () {
    console.log('onnegotiationneeded');
    if (isOffer) {
      createOffer();
    }
  }

  pc.oniceconnectionstatechange = function(event) {
    console.log('oniceconnectionstatechange', event.target.iceConnectionState);
    if (event.target.iceConnectionState === 'completed') {
      setTimeout(() => {
        getStats();
      }, 1000);
    }
  };

  pc.onsignalingstatechange = function(event) {
    console.log('onsignalingstatechange', event.target.signalingState);
  };

  pc.onaddstream = function (event) {
    console.log('onaddstream', event.stream);
    container.setState({info: 'One lawyer join!'});
  };

  pc.onremovestream = function (event) {
    console.log('onremovestream', event.stream);
  };

  console.log('add stream localStream', localStream);
  pc.addStream(localStream);
  // getLocalStream((stream) => pc.addStream(stream));
  return pc;
}

function exchange(data) {
  const fromId = data.from;
  let pc;
  if (fromId in pcPeers) {
    pc = pcPeers[fromId];
  } else {
    pc = createPC(fromId, false);
  }

  if (data.sdp) {
    console.log('exchange sdp', data);
    pc.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {
      if (pc.remoteDescription.type == "offer")
        pc.createAnswer(function(desc) {
          console.log('createAnswer', desc);
          pc.setLocalDescription(desc, function () {
            console.log('setLocalDescription', pc.localDescription);
            socket.emit('exchange', {'to': fromId, 'sdp': pc.localDescription });
          }, logError);
        }, logError);
    }, logError);
  } else {
    console.log('exchange candidate', data);
    pc.addIceCandidate(new RTCIceCandidate(data.candidate));
  }
}

function leave(socketId) {
  console.log('leave', socketId);
  const pc = pcPeers[socketId];
  if (pc) {
    // const viewIndex = pc.viewIndex;
    pc.close();
  }
  delete pcPeers[socketId];

  const remoteList = container.state.remoteList;
  delete remoteList[socketId]
  container.setState({ remoteList: remoteList });
  container.setState({info: 'One peer leave!'});
}

socket.on('exchange', exchange);
socket.on('leave', leave);

socket.on('connect', function(data) {
  console.log('connect');
  getLocalStream(function(stream) {
    localStream = stream;
    // container.setState({selfViewSrc: stream.toURL()});
    container.setState({status: 'ready', info: 'I will solve your problems!'});
  });
  // container.setState({status: 'ready', info: 'I will solve your problems!'});
});

function logError(error) {
  console.log("logError", error);
}

function mapHash(hash, func) {
  const array = [];
  for (const key in hash) {
    const obj = hash[key];
    array.push(func(obj, key));
  }
  return array;
}

function getStats() {
  const pc = pcPeers[Object.keys(pcPeers)[0]];
  if (!pc) return;
  if (pc.getRemoteStreams()[0] && pc.getRemoteStreams()[0].getAudioTracks()[0]) {
    const track = pc.getRemoteStreams()[0].getAudioTracks()[0];
    console.log('track', track);
    pc.getStats(track, function(report) {
      console.log('getStats report', report);
    }, logError);
  }
}

const vietnam = React.createClass({
  getInitialState: function() {
    container = this;
    this.ds = new ListView.DataSource({rowHasChanged: (r1, r2) => true});
    return {
      info: 'Initializing',
      status: 'init',
      roomID: 'veryrandomkey',
      isFront: true,
      selfViewSrc: null,
      textRoomConnected: false,
      textRoomData: [],
      textRoomValue: '',
    };
  },
  // componentDidMount: function() {
  //   container = this;
  // },
  _press(event) {
    // this.refs.roomID.blur();
    this.setState({status: 'connect', info: 'Connecting'});
    join(this.state.roomID);
  },
  receiveTextData(data) {
    const textRoomData = this.state.textRoomData.slice();
    textRoomData.push(data);
    this.setState({textRoomData, textRoomValue: ''});
  },
  _textRoomPress() {
    if (!this.state.textRoomValue) {
      return
    }
    const textRoomData = this.state.textRoomData.slice();
    textRoomData.push({user: 'Me', message: this.state.textRoomValue});
    for (const key in pcPeers) {
      const pc = pcPeers[key];
      pc.textDataChannel.send(this.state.textRoomValue);
    }
    this.setState({textRoomData, textRoomValue: ''});
  },
  _renderTextRoom() {
    return (
      <View style={styles.listViewContainer}>
        <ListView
          dataSource={this.ds.cloneWithRows(this.state.textRoomData)}
          renderRow={rowData => <Text>{`${rowData.user}: ${rowData.message}`}</Text>}
          />
        <TextInput
          style={{width: 200, height: 30, borderColor: 'gray', borderWidth: 1}}
          onChangeText={value => this.setState({textRoomValue: value})}
          value={this.state.textRoomValue}
        />
        <TouchableHighlight
          onPress={this._textRoomPress}>
          <Text>Send</Text>
        </TouchableHighlight>
      </View>
    );
  },
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>
          {'Saul Goodman!\nVietnam lawyer consulting!\nDon\'t want to go to jail?\n Better Call Saul!'}
        </Text>
        <View style={styles.vietnam}>
          {this.state.textRoomConnected ?
            <View style={styles.vietnam}>
              <Icon name="phone" size={100} color="#ffff00" />
              <Icon name="address-card-o" size={100} color="#ffff00" />
            </View> :
            <Icon name="star" size={200} color="#ffff00" />
          }
        </View>
        <Text style={styles.welcome}>
          {this.state.info}
        </Text>
        {/* {this.state.textRoomConnected && this._renderTextRoom()} */}
        {/* <View style={{flexDirection: 'row'}}>
          <Text>
            {this.state.isFront ? "Use front camera" : "Use back camera"}
          </Text>
          <TouchableHighlight
            style={{borderWidth: 1, borderColor: 'black'}}
            onPress={this._switchVideoType}>
            <Text>Switch camera</Text>
          </TouchableHighlight>
        </View> */}
        { this.state.status == 'ready' ?
          (<View style={styles.talkBtn}>
            {/* <TextInput
              ref='roomID'
              autoCorrect={false}
              style={{width: 200, height: 40, borderColor: 'gray', borderWidth: 1}}
              onChangeText={(text) => this.setState({roomID: text})}
              value={this.state.roomID}
            /> */}
            <TouchableHighlight
              onPress={this._press}>
              <Text style={styles.talkBtnText}>Talk with layour</Text>
            </TouchableHighlight>
          </View>) : null
        }
        {/* <RTCView streamURL={this.state.selfViewSrc} style={styles.selfView}/> */}
        {/* {
          mapHash(this.state.remoteList, (remote, index) => (<RTCView key={index} streamURL={remote} style={styles.remoteView}/>))
        } */}
      </View>
    );
  }
});

const styles = StyleSheet.create({
  selfView: {
    width: 200,
    height: 150,
  },
  remoteView: {
    width: 0,
    height: 0,
    // width: 200,
    // height: 150,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#ffd',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  listViewContainer: {
    height: 150,
  },
  talkBtn: {
    backgroundColor: '#da251d',
    height: 40,
    borderRadius: 5,
    padding: 5,
    justifyContent: 'center'
  },
  talkBtnText: {
    color: '#fff',
    fontSize: 20,
    textAlign: 'center',
  },
  vietnam: {
    padding: 20,
    backgroundColor: '#da251d',
    justifyContent: 'space-around',
    flexDirection: 'row',
  }
});

AppRegistry.registerComponent('vietnam', () => vietnam);

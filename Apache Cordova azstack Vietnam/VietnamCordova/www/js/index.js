/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function() {
        this.receivedEvent('deviceready');
    },

    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);

        var currentMsgId = Math.floor(Date.now() / 1000);

        var callId = null;

        azstack.onInviteVideoCall = function(packet){
            // console.log(packet);
            callId = packet.callId;
        }
        const testAcceptVideoCall = function(){
            azstack.getUserInfoByUsernameAndRequestToServerWithCallBack('caller', function(user){
                azstack.azAcceptVideoCall(user[0].userId, callId, 'localVideo', 'remoteVideo', true);
            });
        }
        const testRejectVideoCall = function(){
            azstack.getUserInfoByUsernameAndRequestToServerWithCallBack('caller', function(user){
                azstack.azRejectVideoCall(user[0].userId, callId);
            });
        }
        const testStopVideoCall = function(){
            azstack.getUserInfoByUsernameAndRequestToServerWithCallBack('caller', function(user){
                azstack.azStopVideoCall(user[0].userId, callId);
            });
        }
        const toggleVideo = function(){
            azstack.azWebRTC.toggleVideoState();
        }
        const toggleAudio = function(){
            azstack.azWebRTC.toggleAudioState();
        }

        //az delegate --------------------------------------------- -->
        //server test
        var azAppID = "26870527d2ac628002dda81be54217cf";
        var publicKey = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAq9s407QkMiZkXF0juCGj ti6iWUDzqEmP+Urs3+g2zOf+rbIAZVZItS5a4BZlv3Dux3Xnmhrz240OZMBO1cNc poEQNij1duZlpJY8BJiptlrj3C+K/PSp0ijllnckwvYYpApm3RxC8ITvpmY3IZTr RKloC/XoRe39p68ARtxXKKW5I/YYxFucY91b6AEOUNaqMFEdLzpO/Dgccaxoc+N1 SMfZOKue7aH0ZQIksLN7OQGVoiuf9wR2iSz3+FA+mMzRIP+lDxI4JE42Vvn1sYmM CY1GkkWUSzdQsfgnAIvnbepM2E4/95yMdRPP/k2Qdq9ja/mwEMTfA0yPUZ7Liywo ZwIDAQAB';
        var azStackUserId = 'answerer';
        var fullname = 'Answerer';
        var userCredentials = '';
        var namespace = '';


        azstack.logLevel = 'DEBUG';

        azstack.onAuthenticationCompleted = function (code, authenticatedUser, msg) {
            azstack.log('INFO', 'onAuthenticationCompleted code: ' + code + ', msg: ' + msg + ', authenticatedUser');
            azstack.log('INFO', authenticatedUser);

    //					azstack.log('INFO', '+++test log+++');

            //get list all conversations: call 1 lan duy nhat sau khi authen thanh cong;
            // ham azstack.onListModifiedConversationReceived
            // se duoc goi nhieu lan neu co nhieu msg (phan trang)
    //                    azstack.azGetListModifiedConversations(0);

            //get list modified messages: call 1 lan duy nhat sau khi authen thanh cong;
            // ham azstack.onListModifiedMessagesReceived
            // se duoc goi nhieu lan neu co nhieu msg (phan trang)
    //                    azstack.azGetListModifiedMessages(0, 1, 36206);

            //get list unread messages: call 1 lan duy nhat sau khi authen thanh cong;
            // ham azstack.onListUnreadMessagesReceived
            // se duoc goi nhieu lan neu co nhieu msg (phan trang)
    //                    azstack.azGetListUnreadMessages(1, 36206);
        }
        //authentication --------------------------------------------------- <---

        //bat dau` xac thuc
        azstack.connect(azAppID, publicKey, azStackUserId, userCredentials, fullname, namespace);//ket noi den AZStack server
    }
};

app.initialize();

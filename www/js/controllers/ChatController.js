app.controller('CoChatController', function ($scope, $stateParams, io, Poller ,$ionicPopup, $sanitize, $timeout,
                                             $ionicSideMenuDelegate, $ionicScrollDelegate, Users, Engage, Send, $ionicActionSheet, SendTo,
                                             $q, $log) {

  $scope.userlist =[];
  $scope.loginname = $stateParams.username;
  $scope.totalbadge = 0;
  // Grab the last active, or the first user
  $scope.activeUser = $scope.userlist[Users.getLastActiveIndex()];

  $scope.msgdate = new Date();

  $scope.target = 'all';

  $scope.data = { "matches" : [], "search" : '' };

  //Add colors
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];
  var agentid;

  // Called to select the given project
  $scope.selectUser = function (index) {
    $scope.activeUser = $scope.userlist[index];
    resetBadge(index);
    updateTotalBadge();
    Users.setLastActiveIndex(index);
  };

  $scope.deleteUser = function(index) {
    $scope.userlist.splice(index, 1);
    $scope.activeUser = $scope.userlist[0];
    updateTotalBadge();
  }

  $scope.toggleUser = function () {
    $ionicSideMenuDelegate.toggleLeft();
  };

  var poll = function() {
    Poller.poll($scope.loginname).then(function(resp) {
      if(resp.data.status.code == '0000' && resp.data.body.result && Array.isArray(resp.data.body.result) && resp.data.body.result.length > 0) {
        resp.data.body.result.forEach(function(message) {
          chatprocess(message);
        });
      }
      $timeout(poll, 1000);
    });
  };
  poll();

  var chatprocess = function(message) {
    agentid = message.chatId;
    var type = message.messageType;
    var from = message.from;
    var sender = message.sender;
    var senderType = message.senderType;
    var senderName = message.senderName;
    var senderText = message.text;
    var receiver = message.receiver;

    if (type == 'Command' && message.command) {
      switch (message.command) {
        case "userRequestChat" :
          var robotname = message.data;
          if (message.senderType == 'User') {

          } else {
            if (!userExist(senderName)) {
              var confirmPopup = $ionicPopup.confirm({
                title: 'Engagement',
                template: 'Do you want to start another engagement with ' + senderName + '?'
              });
              confirmPopup.then(function (res) {
                if (res) {
                  $scope.userlist.push({username: senderName, messages: [], badge: 0});
                  if($scope.userlist.length>0) {
                    $scope.activeUser = $scope.userlist[$scope.userlist.length-1];
                  }
                  addMessageToList(senderName, robotname, true, senderText, true);
                  Engage.acceptEngage(senderName, agentid);
                } else {
                  console.log('Engagement end');
                  Engage.rejectEngage(senderName, agentid);
                }
              });
              $timeout(function() {
                confirmPopup.close(); //close the popup after 30 seconds for some reason
                Engage.rejectEngage(senderName, agentid);
              }, 30000);
            } else {
              addMessageToList(senderName, robotname, true, senderText, false)
            }
          }
          break;
        case "userAcceptChat" :
          break;
        case "userDeclineChat" :
          break;
      }
    } else if(message.body.response) {
      //get message txt from body response message field
      var msgbody = message.body.response.message;
      if(msgbody['@from']) {
        var from = msgbody['@from'];
      } else {
        var from = message.props.robotid;
      }

      if(msgbody['@robotname']) {
        var name = msgbody['@robotname'];
      } else {
        var name = message.props.robotname;
      }
      if(from && from.indexOf('ntelagent-conversation')>-1) {
        addMessageToList(senderName, name, true, senderText, true);
      } else {
        addMessageToList(senderName, name, true, senderText, false);
      }
    } else {
      //var xml =  message.message;
      //var xml =  xml.replace(/(\r\n|\n|\r)/gm,"");
      //var json = x2js.xml_str2json(xml);
      if(message.body instanceof String || typeof message.body === "string") {
        var text = message.body;
        addMessageToList(senderName, senderName, true, text, false);
      }
    }
  }

  $scope.sendMessage = function () {
    if(!$scope.activeUser) {
      return;
    }
    addMessageToList($scope.loginname, $scope.loginname, true,  $scope.data.search, false);
    if(agentid) {
      Send.sendMessage($scope.loginname, agentid, $scope.data.search);
    }
    $scope.data.search = '';
  }

  $scope.setLiSelect = function(index) {
    var value = $scope.data.matches[index];
    $scope.data.search = value;
    $scope.data.matches = [];
  }

  $scope.search = function() {
    var m = $scope.statesdata.filter(function(state){
      if($scope.data.search && state) {
        if(state.toLowerCase().indexOf($scope.data.search.toLowerCase()) !== -1 )
          return true;
      }
    })
    $scope.data.matches = m;
  }



  $scope.sendTextMessage = function(text) {
    if(!$scope.activeUser) {
      return;
    }
    addMessageToList($scope.loginname, $scope.loginname, true,  text, false);
    if(agentid) {
      Send.sendMessage($scope.loginname, agentid, text);
    }
  }

  // Display message by adding it to the message list
  function addMessageToList(username, robotname, style_type, message, robot) {
    username = $sanitize(username)
    var color = style_type ? getUsernameColor(username) : null
    if($scope.loginname == username) { //if message come form user $scope
      var curuser = $scope.activeUser.username;
      var msg = {audio:false,content:$sanitize(message),style:style_type,username:$scope.loginname,color:color};
      updateMsg(msg, curuser);
    } else if(robot) {
      var curuser = $scope.activeUser.username;
      var msg = {audio:false,content:$sanitize(message),style:style_type,username:robotname,color:color};
      updateMsg(msg, curuser);
    } else {
      if($scope.userlist[Users.getLastActiveIndex()].username !== username) {
        updateBadge(username);
        updateTotalBadge();
      }
      var msg = {audio:false,content:$sanitize(message),style:style_type,username:username,color:color};
      updateMsg(msg, username);
    }
    $ionicScrollDelegate.scrollBottom();
  }

  function addAudioToList(username, style_type, filename) {
    username = $sanitize(username)
    //removeChatTyping(username)
    var color = style_type ? getUsernameColor(username) : null
    var url = 'http://192.168.254.155:3000/audio/' + filename;
    var msg = {audio: true, style: style_type, url: url, username: username, color: color};
    updateMsg(msg, username);
    updateTotalBadge();
    $ionicScrollDelegate.scrollBottom();
  }


  var userExist = function(username) {
    var bool = false;
    $scope.userlist.forEach(function(obj){
      if(obj.username == username) {
        bool = true;
      }
    });
    return bool;
  };
  //Generate color for the same user.
  function getUsernameColor(username) {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }

  var updateMsg = function(msg, username) {
    $scope.userlist.forEach(function(obj, index){
      if(obj.username == username) {
        $scope.userlist[index].messages.push(msg);
      }
    })
  };
  var resetBadge = function(idx) {
    $scope.userlist.forEach(function(obj, index){
      if(idx == index) {
        $scope.userlist[index].badge = 0;
      }
    });
  };
  var updateBadge = function(username) {
    $scope.userlist.forEach(function(obj, index){
      if(obj.username == username) {
        ++$scope.userlist[index].badge;
      }
    })
  };

  var updateTotalBadge = function() {
    $scope.totalbadge = 0;
    $scope.userlist.forEach(function(obj){
      if(obj.badge > 0) {
        $scope.totalbadge += obj.badge;
      }
    })
  }

  $scope.onMessageHold = function(e, itemIndex, message) {
    console.log('message: ' + JSON.stringify(message, null, 2));
    $ionicActionSheet.show({
      buttons: [{
        text: 'Copy Text'
      }, {
        text: 'Delete Message'
      }],
      buttonClicked: function(index) {
        switch (index) {
          case 0: // Copy Text
            //cordova.plugins.clipboard.copy(message.text);

            break;
          case 1: // Delete
            // no server side secrets here :~)
            break;
        }

        return true;
      }
    });
  };

  $scope.onSelectHold = function () {
    if($scope.activeUser) {
      $ionicActionSheet.show({
        buttons: [{
          text: 'Send To Engine'
        }, {
          text: 'Send To Customer'
        }, {
          text: 'Send To Both'
        }],
        buttonClicked: function(index) {
          switch (index) {
            case 0: // Send Msg to Engine
              SendTo.sendTo(agentid,false, true, $scope.loginname);
              $scope.target = 'engine only';
              break;
            case 1: // Send Msg to Customer
              SendTo.sendTo(agentid,true, false, $scope.loginname);
              $scope.target = 'customer only';
              break;
            case 2: //Send Msg to both
              SendTo.sendTo(agentid,true, true, $scope.loginname);
              $scope.target = 'all';
              break;
          }
          return true;
        }
      });
    }
  }

  //load first user history when startup
  $timeout(function() {
    $scope.selectUser(0);
  }, 300);
  //$scope.statesdata = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Dakota', 'North Carolina', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'];

  $scope.statesdata = ['No Dail Tone', 'Can Call Out', 'Transmission', 'Yes',
    'No', 'MLT', 'Slow Dial Tone','No Dial Tone At Times','Can\'t Break Dial Tone',
    'Only has one phone/ all calls (OH1P/AC)',
    'Some Phones (SP)'];
})


app.controller('CoChatController', function ($scope, $stateParams, Poller ,$ionicPopup, $sanitize, $timeout,
                                             $ionicSideMenuDelegate, $ionicScrollDelegate, Users, Engage, Send, $ionicActionSheet, SendTo,
                                             $q, $log, $ionicPopover, $state, Login, AutoSuggest) {

  $scope.userlist =[];
  $scope.loginname = $stateParams.username;
  $scope.totalbadge = 0;
  // Grab the last active, or the first user
  $scope.activeUser = $scope.userlist[Users.getLastActiveIndex()];
  $scope.target = 'all';
  $scope.data = { "matches" : [], "search" : '' };

  //Add colors
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];
  var agentids = {};

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
          chatProcess(message);
        });
      }
      $timeout(poll, 1000);
    });
  };
  poll();

  var chatProcess = function(message) {

    var type = message.messageType;
    var from = message.from;
    //var sender = message.sender;
    //var senderType = message.senderType;
    var senderName = message.senderName;
    var senderText = message.text;
    //var receiver = message.receiver;
    if(senderName) {
      agentids[senderName] = message.chatId;
    }

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
                  Engage.acceptEngage(senderName, agentids[senderName]);
                } else {
                  console.log('Engagement end');
                  Engage.rejectEngage(senderName, agentids[senderName]);
                }
              });
              $timeout(function() {
                confirmPopup.close(); //close the popup after 30 seconds for some reason
                Engage.rejectEngage(senderName, agentids[senderName]);
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
    if(agentids[$scope.activeUser.username]) {
      Send.sendMessage($scope.loginname, agentids[$scope.activeUser.username], $scope.data.search);
      var shaObj = new jsSHA("SHA-1", "TEXT");
      shaObj.update($scope.data.search);
      var hash = shaObj.getHash("HEX");
      var phrase = $scope.data.search.trim();
      AutoSuggest.updateRecentPhrase(hash, phrase, $scope.loginname);
    }
    $scope.data.search = '';
  }


  $scope.sendReply = function(index) {
    if(!$scope.activeUser) {
      return;
    }
    var reply = $scope.popularReplies[index];
    addMessageToList($scope.loginname, $scope.loginname, true,  reply, false);
    if(agentids[$scope.activeUser.username]) {
      Send.sendMessage($scope.loginname, agentids[$scope.activeUser.username], reply);
    }
  }

  $scope.setLiSelect = function(index) {
    var value = $scope.data.matches[index];
    $scope.data.search = value;
    $scope.data.matches = [];
  }

  $scope.search = function() {
    if($scope.data.search.endsWith(' ')) {
      AutoSuggest.getPhrase($scope.data.search.trim()).then(function(resp){
        var data = resp.data.response;
        if(data.status.code.value === '0000') {
          var result = data.body.phrases.phrase;
          var m = [];
          if(angular.isArray(result)) {
            result.forEach(function(obj) {
              if(m.indexOf(obj.content) == -1) {
                m.push(obj.content);
              }
            })
          } else {
            m.push(result.content);
          }
          $scope.data.matches = m;
        }
      });
    } else {
      var m = $scope.statesdata.filter(function(state){
        if($scope.data.search && state) {
          if(state.toLowerCase().indexOf($scope.data.search.toLowerCase()) !== -1 )
            return true;
        }
      })
      $scope.data.matches = m;
    }
  }



  $scope.sendTextMessage = function(text) {
    if(!$scope.activeUser) {
      return;
    }
    addMessageToList($scope.loginname, $scope.loginname, true,  text, false);
    if(agentids[$scope.activeUser.username]) {
      Send.sendMessage($scope.loginname, agentids[$scope.activeUser.username], text);
      var shaObj = new jsSHA("SHA-1", "TEXT");
      shaObj.update($scope.data.search);
      var hash = shaObj.getHash("HEX");
      var phrase = $scope.data.search.trim();
      AutoSuggest.updateRecentPhrase(hash, phrase, $scope.loginname);
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
        titleText: 'Who To Send',
        buttonClicked: function(index) {
          switch (index) {
            case 0: // Send Msg to Engine
              SendTo.sendTo(agentids[$scope.activeUser.username],false, true, $scope.loginname);
              $scope.target = 'engine only';
              break;
            case 1: // Send Msg to Customer
              SendTo.sendTo(agentids[$scope.activeUser.username],true, false, $scope.loginname);
              $scope.target = 'customer only';
              break;
            case 2: //Send Msg to both
              SendTo.sendTo(agentids[$scope.activeUser.username],true, true, $scope.loginname);
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

  $scope.statesdata = ['Dial', 'Tone', 'Can', 'Call', 'Out', 'Transmission', 'Yes',
    'No', 'MLT', 'Slow',   'At','Times','Can\'t', 'Break', 'caller', 'my', 'phone','only','some','all','not','one', 'have', 'please', 'select', 'block'];

  $ionicPopover.fromTemplateUrl('templates/popover.html', {
    scope: $scope,
  }).then(function(popover) {
    $scope.popover = popover;
  });

  $scope.logoff = function(){
    Login.offline($scope.loginname).then(function() {
      console.log('login success');
      $state.go('login');
      $scope.popover.hide();
    }, function() {
      console.log('login error');
    })
  }

  var getPopularReplies = function() {
    $scope.popularReplies = [];
    AutoSuggest.getRecentPhrase($scope.loginname).then(function(resp) {
      if(resp.data.status.code.value === '0000') {
        $scope.popularReplies = resp.data.body.phrases;
      }
    })
  }

  $scope.$watch(function () {
        return $ionicSideMenuDelegate.getOpenRatio();
      },
      function (ratio) {
        if (ratio === -1) {
          getPopularReplies();
        }
      });

})


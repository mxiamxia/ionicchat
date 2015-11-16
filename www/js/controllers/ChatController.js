app.controller('CoChatController', function ($scope, $stateParams, io, $ionicPopup, $sanitize, $timeout,
                                             $ionicSideMenuDelegate, $ionicScrollDelegate, Users) {

  //$scope.userlist = [{
  //  username: "Jason",
  //  messages: [{audio: false, content: "test1", style: true, username:"Jason",color: '#e21400'}, {
  //    audio: false,
  //    content: "test2",
  //    username:"Jason",
  //    style: true,
  //    color: '#e21400'
  //  }],
  //  badge: 5
  //},
  //  {
  //    username: "Mike",
  //    messages: [{audio: false, content: "mike1", style: true, username:"Mike", color: '#e21400'}, {
  //      audio: false,
  //      content: "mike2",
  //      username:"Mike",
  //      style: true,
  //      color: '#e21400'
  //    }],
  //    badge: 0
  //  }];

  $scope.userlist =[];

  // Load or initialize projects
  $scope.users = Users.all();

  $scope.loginname = $stateParams.username;

  $scope.totalbadge = 0;

  // Grab the last active, or the first project
  $scope.activeUser = $scope.userlist[Users.getLastActiveIndex()];

  // Called to select the given project
  $scope.selectUser = function (index) {
    $scope.activeUser = $scope.userlist[index];
    resetBadge(index);
    updateTotalBadge();
    Users.setLastActiveIndex(index);
  };

  $scope.toggleUser = function () {
    $ionicSideMenuDelegate.toggleLeft();
  };

//})

  //.controller('ChatController',function($scope,$stateParams,io,$sanitize,$ionicScrollDelegate,$timeout) {

  var typing = false;
  var lastTypingTime;
  var TYPING_TIMER_LENGTH = 400;

  //Add colors
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

  io.on('connect', function () {

    connected = true;

    //Add user
    io.emit('add user', $scope.loginname);

    // On login display welcome message
    io.on('login', function (data) {
      //Set the value of connected flag
      $scope.connected = true
      $scope.number_message = message_string(data.numUsers)

    });

    // Whenever the server emits 'new message', update the chat body
    io.on('new message', function (data) {
      if (data.message && data.username) {
        if (!userExist(data.username)) {
          var confirmPopup = $ionicPopup.confirm({
            title: 'Engagement',
            template: 'Do you want to start another engagement?'
          });
          confirmPopup.then(function (res) {
            if (res) {
              $scope.userlist.push({username: data.username, messages: [], badge: 0});
              if($scope.userlist.length == 1) {
                $scope.activeUser = $scope.userlist[0];
              }
              addMessageToList(data.username, true, data.message)
              console.log('You are sure');
            } else {
              console.log('Engagement end');
            }
          });
        } else {
          addMessageToList(data.username, true, data.message)
        }
      }
    });
    io.on('new audio', function (data) {
      console.log('target client received audio data' + data.username);
      if(!userExist(data.username)) {
        $scope.userlist.push({username:data.username,messages:[],badge:0});
      }
      var fileName = data.fileName;
      addAudioToList(data.username, true, fileName)
    });

    // Whenever the server emits 'user joined', log it in the chat body
    io.on('user joined', function (data) {
      addMessageToList("", false, data.username + " joined")
      addMessageToList("", false, message_string(data.numUsers))
    });

    // Whenever the server emits 'user left', log it in the chat body
    io.on('user left', function (data) {
      if ($scope.userlist[data.username]) {
        delete $scope.userlist[data.username];
      }
      addMessageToList("", false, data.username + " left")
      addMessageToList("", false, message_string(data.numUsers))
    });

    //Whenever the server emits 'typing', show the typing message
    io.on('typing', function (data) {
      //addChatTyping(data);
    });

    // Whenever the server emits 'stop typing', kill the typing message
    io.on('stop typing', function (data) {
      //removeChatTyping(data.username);
    });
  })

  //function called when user hits the send button

  $scope.sendMessage = function () {
    io.emit('new message',this.txt);
    addMessageToList($scope.loginname, true, this.txt);
    io.emit('stop typing');
    this.txt = '';
  }

  //function called on Input Change
  $scope.updateTyping = function () {
    sendUpdateTyping()
  }

  // Display message by adding it to the message list
  function addMessageToList(username, style_type, message) {
    username = $sanitize(username)
    var color = style_type ? getUsernameColor(username) : null
    if($scope.loginname == username) { //if message come form user self
      var curuser = $scope.activeUser.username;
      var msg = {audio:false,content:$sanitize(message),style:style_type,username:$scope.loginname,color:color};
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

  // Updates the typing event
  function sendUpdateTyping() {
    if (connected) {
      if (!typing) {
        typing = true;
        io.emit('typing');
      }
    }
    lastTypingTime = (new Date()).getTime();
    $timeout(function () {
      var typingTimer = (new Date()).getTime();
      var timeDiff = typingTimer - lastTypingTime;
      if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
        io.emit('stop typing');
        typing = false;
      }
    }, TYPING_TIMER_LENGTH)
  }

  // Return message string depending on the number of users
  function message_string(number_of_users) {
    return number_of_users === 1 ? "there's 1 participant" : "there are " + number_of_users + " participants"
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

  //load first user history when startup
  $timeout(function() {
    $scope.selectUser(0);
  }, 300);
});


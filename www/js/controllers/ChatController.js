app.controller('CoChatController', function ($scope, $stateParams, io, Poller ,$ionicPopup, $sanitize, $timeout,
                                             $ionicSideMenuDelegate, $ionicScrollDelegate, Users, Engage, Send, $ionicActionSheet, SendTo,
                                             $q, $log) {

  $scope.userlist =[];

  // Load or initialize projects
  $scope.users = Users.all();

  $scope.loginname = $stateParams.username;

  $scope.totalbadge = 0;

  // Grab the last active, or the first user
  $scope.activeUser = $scope.userlist[Users.getLastActiveIndex()];

  var agentid;
  $scope.msgdate = new Date();

  $scope.target = 'all';


  //Add colors
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

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
    addMessageToList($scope.loginname, $scope.loginname, true,  this.txt, false);
    if(agentid) {
      Send.sendMessage($scope.loginname, agentid, this.txt);
    }
    this.txt = '';
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


  $scope.selected = undefined;
  $scope.states = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Dakota', 'North Carolina', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'];
  // Any function returning a promise object can be used to load values asynchronously
  $scope.getLocation = function(val) {
    return $http.get('//maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: val,
        sensor: false
      }
    }).then(function(response){
      return response.data.results.map(function(item){
        return item.formatted_address;
      });
    });
  };

  $scope.statesWithFlags = [{'name':'Alabama','flag':'5/5c/Flag_of_Alabama.svg/45px-Flag_of_Alabama.svg.png'},{'name':'Alaska','flag':'e/e6/Flag_of_Alaska.svg/43px-Flag_of_Alaska.svg.png'},{'name':'Arizona','flag':'9/9d/Flag_of_Arizona.svg/45px-Flag_of_Arizona.svg.png'},{'name':'Arkansas','flag':'9/9d/Flag_of_Arkansas.svg/45px-Flag_of_Arkansas.svg.png'},{'name':'California','flag':'0/01/Flag_of_California.svg/45px-Flag_of_California.svg.png'},{'name':'Colorado','flag':'4/46/Flag_of_Colorado.svg/45px-Flag_of_Colorado.svg.png'},{'name':'Connecticut','flag':'9/96/Flag_of_Connecticut.svg/39px-Flag_of_Connecticut.svg.png'},{'name':'Delaware','flag':'c/c6/Flag_of_Delaware.svg/45px-Flag_of_Delaware.svg.png'},{'name':'Florida','flag':'f/f7/Flag_of_Florida.svg/45px-Flag_of_Florida.svg.png'},{'name':'Georgia','flag':'5/54/Flag_of_Georgia_%28U.S._state%29.svg/46px-Flag_of_Georgia_%28U.S._state%29.svg.png'},{'name':'Hawaii','flag':'e/ef/Flag_of_Hawaii.svg/46px-Flag_of_Hawaii.svg.png'},{'name':'Idaho','flag':'a/a4/Flag_of_Idaho.svg/38px-Flag_of_Idaho.svg.png'},{'name':'Illinois','flag':'0/01/Flag_of_Illinois.svg/46px-Flag_of_Illinois.svg.png'},{'name':'Indiana','flag':'a/ac/Flag_of_Indiana.svg/45px-Flag_of_Indiana.svg.png'},{'name':'Iowa','flag':'a/aa/Flag_of_Iowa.svg/44px-Flag_of_Iowa.svg.png'},{'name':'Kansas','flag':'d/da/Flag_of_Kansas.svg/46px-Flag_of_Kansas.svg.png'},{'name':'Kentucky','flag':'8/8d/Flag_of_Kentucky.svg/46px-Flag_of_Kentucky.svg.png'},{'name':'Louisiana','flag':'e/e0/Flag_of_Louisiana.svg/46px-Flag_of_Louisiana.svg.png'},{'name':'Maine','flag':'3/35/Flag_of_Maine.svg/45px-Flag_of_Maine.svg.png'},{'name':'Maryland','flag':'a/a0/Flag_of_Maryland.svg/45px-Flag_of_Maryland.svg.png'},{'name':'Massachusetts','flag':'f/f2/Flag_of_Massachusetts.svg/46px-Flag_of_Massachusetts.svg.png'},{'name':'Michigan','flag':'b/b5/Flag_of_Michigan.svg/45px-Flag_of_Michigan.svg.png'},{'name':'Minnesota','flag':'b/b9/Flag_of_Minnesota.svg/46px-Flag_of_Minnesota.svg.png'},{'name':'Mississippi','flag':'4/42/Flag_of_Mississippi.svg/45px-Flag_of_Mississippi.svg.png'},{'name':'Missouri','flag':'5/5a/Flag_of_Missouri.svg/46px-Flag_of_Missouri.svg.png'},{'name':'Montana','flag':'c/cb/Flag_of_Montana.svg/45px-Flag_of_Montana.svg.png'},{'name':'Nebraska','flag':'4/4d/Flag_of_Nebraska.svg/46px-Flag_of_Nebraska.svg.png'},{'name':'Nevada','flag':'f/f1/Flag_of_Nevada.svg/45px-Flag_of_Nevada.svg.png'},{'name':'New Hampshire','flag':'2/28/Flag_of_New_Hampshire.svg/45px-Flag_of_New_Hampshire.svg.png'},{'name':'New Jersey','flag':'9/92/Flag_of_New_Jersey.svg/45px-Flag_of_New_Jersey.svg.png'},{'name':'New Mexico','flag':'c/c3/Flag_of_New_Mexico.svg/45px-Flag_of_New_Mexico.svg.png'},{'name':'New York','flag':'1/1a/Flag_of_New_York.svg/46px-Flag_of_New_York.svg.png'},{'name':'North Carolina','flag':'b/bb/Flag_of_North_Carolina.svg/45px-Flag_of_North_Carolina.svg.png'},{'name':'North Dakota','flag':'e/ee/Flag_of_North_Dakota.svg/38px-Flag_of_North_Dakota.svg.png'},{'name':'Ohio','flag':'4/4c/Flag_of_Ohio.svg/46px-Flag_of_Ohio.svg.png'},{'name':'Oklahoma','flag':'6/6e/Flag_of_Oklahoma.svg/45px-Flag_of_Oklahoma.svg.png'},{'name':'Oregon','flag':'b/b9/Flag_of_Oregon.svg/46px-Flag_of_Oregon.svg.png'},{'name':'Pennsylvania','flag':'f/f7/Flag_of_Pennsylvania.svg/45px-Flag_of_Pennsylvania.svg.png'},{'name':'Rhode Island','flag':'f/f3/Flag_of_Rhode_Island.svg/32px-Flag_of_Rhode_Island.svg.png'},{'name':'South Carolina','flag':'6/69/Flag_of_South_Carolina.svg/45px-Flag_of_South_Carolina.svg.png'},{'name':'South Dakota','flag':'1/1a/Flag_of_South_Dakota.svg/46px-Flag_of_South_Dakota.svg.png'},{'name':'Tennessee','flag':'9/9e/Flag_of_Tennessee.svg/46px-Flag_of_Tennessee.svg.png'},{'name':'Texas','flag':'f/f7/Flag_of_Texas.svg/45px-Flag_of_Texas.svg.png'},{'name':'Utah','flag':'f/f6/Flag_of_Utah.svg/45px-Flag_of_Utah.svg.png'},{'name':'Vermont','flag':'4/49/Flag_of_Vermont.svg/46px-Flag_of_Vermont.svg.png'},{'name':'Virginia','flag':'4/47/Flag_of_Virginia.svg/44px-Flag_of_Virginia.svg.png'},{'name':'Washington','flag':'5/54/Flag_of_Washington.svg/46px-Flag_of_Washington.svg.png'},{'name':'West Virginia','flag':'2/22/Flag_of_West_Virginia.svg/46px-Flag_of_West_Virginia.svg.png'},{'name':'Wisconsin','flag':'2/22/Flag_of_Wisconsin.svg/45px-Flag_of_Wisconsin.svg.png'},{'name':'Wyoming','flag':'b/bc/Flag_of_Wyoming.svg/43px-Flag_of_Wyoming.svg.png'}];


  $scope.selectAutoMatch = function() {
    var match = matches.match;
    console.log(match);
  }
})


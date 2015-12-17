/**
 * Created by mxia on 11/19/2015.
 */
angular.module('co.engage.services', [])

  .factory('Login', function ($http, HTTP_URL) {
    return {
      login: function (userid, password) {
        var input = {
          "header": {
            "action": "security",
            "ip": "$!ip",
            "requestId": "$!requestId",
            "requestTime": new Date().getTime()
          },
          "body": {
            "parameters": {
              "action": "security",
              "method": "login",
              "userId": userid,
              "password": password,
              "agentType": "User"
            },
            "method": "login"
          },
          "status": {}
        };
        var req = {
          method: 'POST',
          url: HTTP_URL,
          data: input,
          withCredentials: true
        };
        return $http(req);
      },

      online : function () {
        var input = {
          "header": {
            "action": "chat",
            "ip": "$!ip",
            "requestId": "$!requestId",
            "requestTime": new Date().getTime()
          },
          "body": {
            "parameters": {
              "action": "chat",
              "method": "online",
              "reonline": false,
              "agentType": "User"
            },
            "method": "online"
          },
          "status": {

          }

        };
        var req = {
          method: 'POST',
          url: HTTP_URL,
          data: input,
          withCredentials: true
        };
        return $http(req);
      },

     offline : function(unsername) {
       var input = {
         "header": {
           "action": "chat",
           "ip": "$!ip",
           "requestId": "$!requestId",
           "requestTime": new Date().getTime()
         },
         "body": {
           "parameters": {
             "action": "chat",
             "method": "offline",
             "agentId": unsername,
             "agentType": "User"
           },
           "method": "offline"
         },
         "status": {

         }
       }
       var req = {
         method: 'POST',
         url: HTTP_URL,
         data: input,
         withCredentials: true
       };
       return $http(req);
     }
    }
  })

  .factory('Poller', function($http, HTTP_URL) {
    return {
      poll : function (username) {
        var input = {
          "header": {
            "action": "chat",
            "ip": "$!ip",
            "requestId": "$!requestId",
            "requestTime": new Date().getTime()
          },
          "body": {
            "parameters": {
              "action": "chat",
              "userId": username,
              "method": "openConnection",
              "agentType": "User"
            },
            "method": "openConnection"
          },
          "status": {}
        };
        var req = {
          method: 'POST',
          url: HTTP_URL,
          data: input,
          withCredentials: true
        };
        return $http(req);
      }
    }
  })
  .factory('Engage', function($http, HTTP_URL) {
    return {
      acceptEngage : function (username, chatid) {
        var input = {
          "header": {
            "action": "chat",
            "ip": "$!ip",
            "requestId": "$!requestId",
            "requestTime": new Date().getTime()
          },
          "body": {
            "parameters": {
              "action": "chat",
              "method": "acceptChat",
              "chatId": chatid,
              "to": username,
              "toAgentType": "Robot",
              "agentType": "User"
            },
            "method": "acceptChat"
          },
          "status": {

          }
        };
        var req = {
          method: 'POST',
          url: HTTP_URL,
          data: input,
          withCredentials: true
        };
        return $http(req);
      },

      rejectEngage : function (username, chatid) {
        var input = {
          "header": {
            "action": "chat",
            "ip": "$!ip",
            "requestId": "$!requestId",
            "requestTime": new Date().getTime()
          },
          "body": {
            "parameters": {
              "action": "chat",
              "method": "declineChat",
              "chatId": chatid,
              "to": username,
              "toAgentType": "Robot",
              "agentType": "User"
            },
            "method": "declineChat"
          },
          "status": {
          }
        }
        var req = {
          method: 'POST',
          url: HTTP_URL,
          data: input,
          withCredentials: true
        };
        return $http(req);
      }
    }
  })

.factory('Send', function($http, HTTP_URL) {
  return {
    sendMessage : function (username, chatid, text) {
      var input = {
        "header": {
          "action": "chat",
          "ip": "$!ip",
          "requestId": "$!requestId",
          "requestTime": new Date().getTime()
        },
        "body": {
          "parameters": {
            "action": "chat",
            "method": "sendMessage",
            "chatId": chatid,
            "message": {
              "text": text
            },
            "to": username,
            "toAgentType": "Robot",
            "agentType": "User"
          },
          "method": "sendMessage"
        },
        "status": {

        }
      }
      var req = {
        method: 'POST',
        url: HTTP_URL,
        data: input,
        withCredentials: true
      };
      return $http(req);
    }
  }
})

.factory('SendTo', function($http, HTTP_URL) {
    return {
      sendTo : function(agentid, tocustomer, torobot, username) {
        var input = {
          "header": {
            "action": "chat",
            "ip": "$!ip",
            "requestId": "$!requestId",
            "requestTime": new Date().getTime()
          },
          "body": {
            "parameters": {
              "action": "chat",
              "method": "switchSendDir",
              "chatId": agentid,
              "transmitToCustomer": tocustomer,
              "transmitToRobot": torobot,
              "to": username,
              "toAgentType": "Robot",
              "agentType": "User"
            },
            "method": "switchSendDir"
          }
        };
        var req = {
          method: 'POST',
          url: HTTP_URL,
          data: input
        };
        return $http(req);
      }
    }
  })

//http://192.168.254.122:8080/co-termnet-synonym/request?request=tran&mode=complete&src=typecode&type=all
  .factory('AutoSuggest', function($http) {
    return {
      getPhrase: function(input) {
        var req = {
          method: 'GET',
          url: 'http://192.168.254.122:8080/co-termnet-synonym/request',
          params: {
            request : input,
            mode : 'complete',
            src: 'feature',
            type: 'all'
          }
        }
        return $http(req);
      },
//http://192.168.254.122:8080/co-termnet-synonym/method=lruList&name=mxia
      getRecentPhrase: function(name) {
        var req = {
          method: 'GET',
          url: 'http://192.168.254.122:8080/co-termnet-synonym/request',
          params: {
            method : 'lruList',
            name : name
          }
        }
        return $http(req);
      },
      updateRecentPhrase: function(hash, value, name) {
        var req = {
          method: 'GET',
          url: 'http://192.168.254.122:8080/co-termnet-synonym/request',
          params: {
            method : 'lruUpdate',
            request : hash,
            phrase : value,
            name : name
          }
        }
        return $http(req);
      }
    }
  })

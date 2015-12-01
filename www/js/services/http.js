/**
 * Created by mxia on 11/19/2015.
 */
angular.module('co.engage.services', [])

  .factory('Login', function ($http) {
    return {
      login: function (userid, password) {
        var input = {
          "header": {
            "action": "security",
            "ip": "$!ip",
            "requestId": "$!requestId",
            "requestTime": 1447873818805
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
          url: 'http://192.168.254.155:8080/co-cyberlive/HttpService',
          //headers: {
          //  'Content-Type': undefined
          //},
          data: input
        };

        return $http(req);

        //$http(req).then(function (resp) {
        //      if(resp.data.status.code == '0000') {
        //        $state.go('chat',{username:userid})
        //      } else {
        //        console.log('login fail');
        //      }
        //      return resp.data;
        //    }, function (err) {
        //      console.log('login error');
        //      return err.data;
        //    });
      }
    }

  })

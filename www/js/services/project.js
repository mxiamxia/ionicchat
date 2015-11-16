/**
 * Created by mxia on 11/9/2015.
 */
app.factory('Users', function() {
  return {
    all: function() {
      var userString = window.localStorage['users'];
      if(userString) {
        return angular.fromJson(userString);
      }
      return [];
    },
    save: function(users) {
      window.localStorage['users'] = angular.toJson(users);
    },
    getLastActiveIndex: function() {
      return parseInt(window.localStorage['lastActiveUser']) || 0;
    },
    setLastActiveIndex: function(index) {
      window.localStorage['lastActiveUser'] = index;
    }
  }
});


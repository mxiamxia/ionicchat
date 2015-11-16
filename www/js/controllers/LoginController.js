app.controller('LoginController',function($state,$sanitize) {
	var self=this;
  self.data = {};

  self.loginApp = function() {
    var username=$sanitize(self.data.username);
    var password = self.data.password;
    if(username && password)
    {
      $state.go('chat',{username:username})
    }
    console.log("LOGIN user: " + username + " - PW: " + password);
  }

});

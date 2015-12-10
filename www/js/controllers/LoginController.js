app.controller('LoginController',function($state,$sanitize, Login) {
	var self=this;
  self.data = {};

  self.loginerror = false;
  self.errdetail;


  self.loginApp = function() {
    var username=$sanitize(self.data.username);
    var password = self.data.password;
    if(username && password)
    {
      Login.offline(username).then(function() {
        Login.login(username, password).then(function (resp) {
          if(resp.data.status.code == '0000') {
            $state.go('chat',{username:username})
            Login.online();
          } else {
            console.log('login fail');
            self.loginerror = true;
            self.errdetail = 'Please verify your user name and password';
          }
        }, function (err) {
          console.log('login error');
          self.loginerror = true;
          self.errdetail = 'Fail to connect to remote server';
        });
      }, function(error){
        console.log('login error');
        self.loginerror = true;
        self.errdetail = 'Fail to connect to remote server';
      })
    }
    console.log("LOGIN user: " + username + " - PW: " + password);
  }

});

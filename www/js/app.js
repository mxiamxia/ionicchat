// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var app = angular.module('co-engage', ['ionic', 'ngCordova', 'ngSanitize', 'btford.socket-io', 'co.engage.services'])

.run(function($ionicPlatform, $cordovaTouchID, $state) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
    $cordovaTouchID.checkSupport().then(function() {
      //2
      $cordovaTouchID.authenticate("Please authenticate with your fingerprint!").then(function() {
        // 3
        alert("You are a trusty mate! Come in and find out...")
          $state.go('chat',{username:'mxia'});

      }, function (error) { // 4
        // Hopefully, there will be a better callback code in future releases
        if (error == "Fallback authentication mechanism selected.") {
          // User selected to enter a password
        } else {
          alert("Sorry, we are not able to grant access.");
        }
      });
    }, function (error) { // 5
      alert(error); // TouchID not supported
      $state.go('chat',{username:'mxia'});
    });

  });
})

.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('login', {
        url: "/login",
        templateUrl: "templates/login.html"
      })
      .state('chat', {
        url: "/chat/:username",
        templateUrl: 'templates/chat.html',
        controller: 'CoChatController'
        //views: {
        //  'menuContent': {
        //    controller: 'CoChatController'
        //  }
        //}
      });

    $urlRouterProvider.otherwise('/login');
  })

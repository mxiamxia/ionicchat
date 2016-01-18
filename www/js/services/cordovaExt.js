app.factory('cordovaProximity', ['$q', function ($q) {

  var watchID;
  return {
    proximitysensorWatchStart: function () {
      var q = $q.defer();
      if (angular.isUndefined(navigator.proximity) || !angular.isFunction(navigator.proximity.enableSensor)) {
        console.log('Device do not support watchAcceleration');
      }
      navigator.proximity.enableSensor();

      // Start watch timer to get proximity sensor value
      var frequency = 100;
      watchID = window.setInterval(function () {
        navigator.proximity.getProximityState(function (val) { // on success
          console.log('interval state===' + val);
          q.resolve(val);
        });
      }, frequency);

      q.promise.clearWatch = function (id) {
        window.clearInterval(id);
      };

      q.promise.watchID = watchID;

      return q.promise;
    },
    proximitysensorWatchStop: function (id) {
      window.clearInterval(id || watchID);
      navigator.proximity.disableSensor();
    }
  }
}]);

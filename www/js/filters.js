angular.module('co.engage.filter', [])
  .filter('nl2br', ['$filter',
    function() {
      return function(data) {
        if (!data) return data;
        var html = data.replace(/(\r\n|\n|\\n|\r)/gm, '<br/>');
        return html;
      };
    }
  ])

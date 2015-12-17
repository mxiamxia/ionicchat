app.directive('ngEnter', function() {
    return function(scope, element, attrs) {
        element.bind("keydown keypress", function(event) {
            if(event.which === 13) {
                scope.$apply(function(){
                    scope.$eval(attrs.ngEnter);
                });

                event.preventDefault();
            }
        });
    };
})

    .directive('dynamicUrl', function() {
        return {
            restrict: 'A',
            link: function postLink(scope, element, attr) {
                element.attr('src', attr.dynamicUrlSrc);
            }
        };
    })
    .directive('htmlBindCompile', function ($compile) {
        var postLink = function(scope, element, attrs) {
            attrs.$observe('htmlBindCompile', function(data) {
                var html;
                if(data.indexOf('\\n') > 0) {
                    var lines = data.split('\\n');
                    html= lines[0] + '<br/>';
                    lines = lines.slice(1)
                    lines.forEach(function(item) {
                        if(item.charAt(0)>=0 && item.charAt(0)<=9) {
                            var text;
                            if(item.length>4) {
                                text = item.substring(5);
                            } else {
                                text = item;
                            }
                            html = html.concat('<a ng-click=\"sendTextMessage(\''+text.trim()+'\')\">'+item+'</a><br/>');
                        } else {
                            html = html.concat(item + '<br/>');
                        }
                    })

                } else {
                    html = data.replace(/(\r\n|\n|\\n|\r)/gm, '<br/>');
                }
                element.html(html);
                $compile(element.contents())(scope);
            });
        }
        return {
            link: postLink,
            restrict: 'AE'
        };
    })
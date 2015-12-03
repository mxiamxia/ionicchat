app.factory('io',function(socketFactory){
	//Create socket and connect to http://chat.socket.io
 	//var myIoSocket = io.connect('http://chat.socket.io');
	var myIoSocket = io.connect('http://192.168.254.155:3000');   //http://192.168.254.155:3000
  	mySocket = socketFactory({
    	ioSocket: myIoSocket
  	});
	return mySocket;
})


/*************************/
/*** INTERESTING STUFF ***/
/*************************/
var channels = {};
var sockets = {};

var Data = {}


const msgSockets = (fn)=>{
	Object.entries(sockets).map(([id, targetSocket])=>{
		fn(id, targetSocket)
	})
}



module.exports = (server)=>{

	var io  = require('socket.io').listen(server);


	io.sockets.on('connection', (Socket)=>{
		sockets[Socket.id] = Socket;
		Data[Socket.id] = {};

		console.log("["+ Socket.id + "] connection accepted");
		Socket.on('disconnect', function () {
			//console.log("["+ Data[Socket.id].name + "] disconnected");
			msgSockets((id, socket)=>{
				if(id !== Socket.id){
					socket.emit('removePeer', {'peer_id': Socket.id});
					Socket.emit('removePeer', {'peer_id': id});
				}
			});
			delete sockets[Socket.id];
			delete Data[Socket.id];
		});

		Socket.on('update', function(data){
			Data[Socket.id] = data;
			msgSockets((id, socket)=>{
				socket.emit('update', {'peer_id': Socket.id, data})
			});
		})

		Socket.on('join', function (data) {
			//console.log("["+ Data[Socket.id].name + "] join ", Data);

			Data[Socket.id] = data;

			msgSockets((id, socket)=>{
				socket.emit('addPeer', {'peer_id': Socket.id, 'should_create_offer': false, data })
				Socket.emit('addPeer', {'peer_id': id, 'should_create_offer': true, data : Data[id] })
			});
		});

		// Socket.on('leave', function(){
		// 	//console.log("["+ Data[Socket.id].name + "] leave ");
		// 	msgSockets((id, socket)=>{
		// 		socket.emit('removePeer', {'peer_id': Socket.id});
		// 		Socket.emit('removePeer', {'peer_id': id});
		// 	});

		// 	delete sockets[Socket.id];
		// 	delete Data[Socket.id];
		// });

		Socket.on('relayICECandidate', function({peer_id, ice_candidate}) {
			//console.log("["+ Data[Socket.id].name + "] relaying ICE candidate to [" + Data[peer_id].name + "] ")//, ice_candidate);
			msgSockets((id, socket)=>{
				socket.emit('iceCandidate', {'peer_id': Socket.id, 'ice_candidate': ice_candidate});
			})
		});

		Socket.on('relaySessionDescription', function({peer_id, session_description}) {
			//console.log("["+ Data[Socket.id].name + "] relaying session description to [" + Data[peer_id].name + "] ")//, session_description);
			msgSockets((id, socket)=>{
				socket.emit('sessionDescription', {'peer_id': Socket.id, 'session_description': session_description});
			})
		});
	});



}


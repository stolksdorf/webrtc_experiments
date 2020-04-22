let Peers = [];
module.exports = (server)=>{
	const {sockets}  = require('socket.io').listen(server);
	sockets.on('connection', (Socket)=>{
		Peers.push(Socket);
		const broadcast = (data)=>{
			Peers.filter((peer)=>peer.id!=Socket.id)
			.map((peer)=>{
				peer.emit('msg', { id : Socket.id, ...data});
			})
		};
		const msgTarget = (targetId, data)=>{
			const target = Peers.find((peer)=>peer.id == targetId)
			if(target) target.emit('msg', { id : Socket.id, ...data});
		};
		Socket.on('disconnect', ()=>{
			Peers = Peers.filter((peer)=>peer.id !== Socket.id)
			broadcast({ type : 'removePeer' });
		});
		Socket.on('msg', (data)=>{
			data.target
			? msgTarget(data.target, data)
			: broadcast(data);
		});
	});
};
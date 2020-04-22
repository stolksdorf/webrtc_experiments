const ICE_SERVERS = [
	{url:"stun:stun.l.google.com:19302"}
];

const { Queue, Emitter } = require('./utils.js');

const emitter = Emitter();
let server;
let Peers = [];
let lastUpdate={};


const getPeer = (id)=>Peers.find((peer)=>peer.id==id);
const createPeer = (id)=>{
	const peer = {id};

	peer.ready = false;
	peer.connected = false;

	peer.rtc = new RTCPeerConnection(
		{"iceServers": ICE_SERVERS},
		{"optional": [{ "DtlsSrtpKeyAgreement": true }]}
	);
	peer.channel = peer.rtc.createDataChannel('data', {negotiated: true, id: 0});

	peer.channel.onopen = (evt)=>{
		peer.channel.send(JSON.stringify(lastUpdate));
	};
	peer.channel.onmessage = ({data})=>{
		emitter.emit('data', {id, data : JSON.parse(data)})
	};
	peer.rtc.onicecandidate = (event)=>{
		if (!event.candidate) return;

		server.emit('msg', {
			target : id,
			type: 'new-ice-candidate',
			data : event.candidate
		});
	};
	peer.rtc.onaddstream = (event)=>{
		peer.stream = event.stream;
		emitter.emit('stream', peer)
	};

	Peers.push(peer);
	emitter.emit('add', peer);
	return peer;
};

const removePeer = (id)=>{
	const peer = getPeer(id);
	if(!peer) return;
	if(peer.channel) peer.channel.close();
	if(peer.rtc) peer.rtc.close();

	console.log(id, '❌');

	Peers = Peers.filter((peer)=>peer.id!==id);
	emitter.emit('remove', peer)
};

/*****************/


const addConnection = async (id, stream)=>{
	console.log('== A1. Adding Peer', id);
	const peer = createPeer(id);
	await peer.rtc.addStream(stream);

	const desc = await peer.rtc.createOffer();
	await peer.rtc.setLocalDescription(desc);

	console.log('== A2. Sending Offer', id);
	server.emit('msg', {
		target : id,
		type : 'offer',
		desc
	});
};


const handleOffer = async (id, desc, stream)=>{
	console.log('== B1. Handling Offer', id);

	const peer = createPeer(id);
	await peer.rtc.addStream(stream);
	await peer.rtc.setRemoteDescription(desc)

	const answer = await peer.rtc.createAnswer();
	await peer.rtc.setLocalDescription(answer);

	console.log('== B2. Sending Answer', id);

	peer.ready = true;

	server.emit('msg', {
		target : id,
		type   : 'answer',
		desc    : peer.rtc.localDescription
	});
};

const handleAnswer = async (id, desc, stream)=>{
	console.log('== A3. Handling Answer', id);
	const peer = getPeer(id);
	await peer.rtc.addStream(stream);
	await peer.rtc.setRemoteDescription(desc);
	peer.ready = true;

	console.log('== A4. Finished Peer connection', id);

	PeerQueue.next();
	emitter.emit('update', peer);
};

const handleIceCandidate = async (id, data)=>{
	try{
		const peer = getPeer(id);
		if(!peer) return;

		//Only log the first ICE candidate, since there will be many
		if(!peer.connected) console.log('== C1. Handling ICE Candidate', id);

		await peer.rtc.addIceCandidate(new RTCIceCandidate(data))

		if(!peer.connected){
			console.log('== C2. Added!', id);
			console.log(id, '✅');
		}
		peer.connected = true;
	}catch(err){
		console.error('=== Add ICE candidate error ===');
		console.error(id, err);
	}
};

const PeerQueue = Queue(addConnection);

module.exports = {
	getPeers : ()=>Peers,
	emitter,
	update : (data)=>{
		lastUpdate = {...lastUpdate, ...data};
		Peers.map((peer)=>peer.channel.send(JSON.stringify(lastUpdate)));
	},
	connect : (server_url, stream, initialData={})=>{
		lastUpdate = initialData;
		return new Promise((resolve, reject)=>{
			server = io(server_url);

			server.on('connect', ()=>{
				resolve({ id : server.id });
				//Request server to send you a list of currently connected Peers
				server.emit('getPeers');
			});

			server.on('msg', ({id, type, ...data})=>{
				if(type == 'removePeer') removePeer(id);
				if(type == 'offer') handleOffer(id, data.desc, stream);
				if(type == 'answer') handleAnswer(id, data.desc, stream);
				if(type == 'new-ice-candidate') handleIceCandidate(id, data.data)
			});

			server.on('peers', (peers)=>{
				console.log('Adding peers to queue', peers);
				peers.map((peer)=>PeerQueue.add(peer, stream));
			});
		})
	}
}
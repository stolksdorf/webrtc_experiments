//https://media.prod.mdn.mozit.cloud/attachments/2016/01/27/12365/b5bcd9ecac08ae0bc89b6a3e08cfe93c/WebRTC%20-%20ICE%20Candidate%20Exchange.svg
//https://media.prod.mdn.mozit.cloud/attachments/2016/01/27/12363/9d667775214ae0422fae606050f60c1e/WebRTC%20-%20Signaling%20Diagram.svg


function Emitter(){
	let fns = {};
	return {
		on : (evt,fn)=>fns[evt]=(fns[evt]||[]).concat(fn),
		off : (evt,fn)=>fns[evt]=(fns[evt]||[]).filter((_fn)=>_fn!==fn),
		emit : (evt, ...data)=>{
			(fns[evt]||[]).map((fn)=>fn(...data));
			(fns['*']||[]).map((fn)=>fn(evt, ...data));
		},
	}
};
const emitter = Emitter();

const ICE_SERVERS = [
	{url:"stun:stun.l.google.com:19302"}
];


let server;
let Peers = [];

const getPeer = (id)=>{
	let peer = Peers.find((peer)=>peer.id==id);
	if(!peer){
		peer = createPeer(id);
		Peers.push(peer);
		emitter.emit('add', peer)
	}
	return peer;
};

let lastUpdate={};


const createPeer = (id)=>{
	const peer = {id};

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
		if (!event.candidate) return ;
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
	return peer;
}

const removePeer = (id)=>{
	const peer = Peers.find((peer)=>peer.id==id);
	if(!peer) return;
	if(peer.channel) peer.channel.close();
	if(peer.rtc) peer.rtc.close();

	Peers = Peers.filter((peer)=>peer.id!==id);
	emitter.emit('remove', peer)
}


const addPeer = async (id, stream)=>{
	const peer = getPeer(id);
	await peer.rtc.addStream(stream);

	const desc = await peer.rtc.createOffer();
	await peer.rtc.setLocalDescription(desc)
	server.emit('msg', {
		target : id,
		type : 'offer',
		desc
	});
};

const handleOffer = async (id, desc, stream)=>{
	const peer = getPeer(id);

	await peer.rtc.addStream(stream);
	await peer.rtc.setRemoteDescription(desc)

	const answer = await peer.rtc.createAnswer();
	await peer.rtc.setLocalDescription(answer)
	server.emit('msg', {
		target : id,
		type   : 'answer',
		desc    : peer.rtc.localDescription
	});
};

const handleAnswer = async (id, desc, stream)=>{
	const peer = getPeer(id);
	await peer.rtc.addStream(stream);
	await peer.rtc.setRemoteDescription(desc);
	emitter.emit('update', peer);
};

const handleIceCandidate = (id, data)=>{
	const peer = getPeer(id);
	peer.rtc.addIceCandidate(new RTCIceCandidate(data));
};

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
				server.emit('msg', { type : 'addPeer' });
			});

			server.on('msg', ({id, type, ...data})=>{
				if(type == 'addPeer') addPeer(id, stream);
				if(type == 'removePeer') removePeer(id);
				if(type == 'offer') handleOffer(id, data.desc, stream);
				if(type == 'answer') handleAnswer(id, data.desc, stream);
				if(type == 'new-ice-candidate') handleIceCandidate(id, data.data)
			});
		})
	}
}
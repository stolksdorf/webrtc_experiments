//https://media.prod.mdn.mozit.cloud/attachments/2016/01/27/12365/b5bcd9ecac08ae0bc89b6a3e08cfe93c/WebRTC%20-%20ICE%20Candidate%20Exchange.svg
//https://media.prod.mdn.mozit.cloud/attachments/2016/01/27/12363/9d667775214ae0422fae606050f60c1e/WebRTC%20-%20Signaling%20Diagram.svg


//TODO: potentially add a queue?
/*
*/

const makeQueue = (func)=>{
	let queue = [];
	let isRunning = false;

	const next = ()=>{
		isRunning = true;
		func(...queue.shift());
	}
	return {
		queue,
		add: (...args)=>{
			queue.push(args);
			if(!isRunning) next();
		},
		finish : ()=>{
			isRunning = false;
			if(queue.length !== 0) next();
		}
	}
}


const wait = async (n,val)=>new Promise((r)=>setTimeout(()=>r(val), n));

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

const getPeer = (id)=>Peers.find((peer)=>peer.id==id);

let lastUpdate={};



// let queueRunning = false;
// let OfferQueue = [];
// let currentOffer;


// const addToQueue = ({id, desc, stream})=>{
// 	OfferQueue.push({id, desc, stream});
// 	if(!currentOffer){
// 		queueRunning = true;
// 		executeOffer(OfferQueue[0]);
// 	}
// };
// const removeFromQueue = (id)=>{
// 	OfferQueue = OfferQueue.filter((offer)=>offer.id!==id);
// 	if(id == currentOffer){
// 		currentOffer = null;
// 		console.log('COMPLETED', id)
// 		if(OfferQueue.length !== 0){
// 			console.log(OfferQueue[0])
// 			executeOffer(OfferQueue[0]);
// 		}
// 	}
// };


const executeOffer = async (id, desc, stream)=>{
	console.log('== B1. Handling Offer', id);

	const peer = createPeer(id);
	await peer.rtc.addStream(stream);
	await peer.rtc.setRemoteDescription(desc)

	const answer = await peer.rtc.createAnswer();
	await peer.rtc.setLocalDescription(answer);

	console.log('== B2. Sending Answer', id);

	peer.ready = true;

	//OfferQueue.finish()

	server.emit('msg', {
		target : id,
		type   : 'answer',
		desc    : peer.rtc.localDescription
	});
};






const peerReady = {};


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
}



const removePeer = (id)=>{
	const peer = getPeer(id);
	if(!peer) return;
	if(peer.channel) peer.channel.close();
	if(peer.rtc) peer.rtc.close();

	console.log(id, '❌');

	Peers = Peers.filter((peer)=>peer.id!==id);
	emitter.emit('remove', peer)
}


const addPeer = async (id, stream)=>{
	console.log('== A1. Adding Peer', id);
	const peer = createPeer(id);
	await peer.rtc.addStream(stream);

	const desc = await peer.rtc.createOffer();
	await peer.rtc.setLocalDescription(desc);

	//await wait(4000)

	console.log('== A2. Sending Offer', id);
	server.emit('msg', {
		target : id,
		type : 'offer',
		desc
	});
};

const handleAnswer = async (id, desc, stream)=>{
	console.log('== A3. Handling Answer', id);
	const peer = getPeer(id);
	await peer.rtc.addStream(stream);
	await peer.rtc.setRemoteDescription(desc);

	//peerReady[id] = true;

	peer.ready = true;
	//PeerQueue.finish();

	emitter.emit('update', peer);
};




// //TODO: Potentially make a queue of offers to satisfy
// const handleOffer = async (id, desc, stream)=>{

// 	addToQueue({id, desc, stream});


// 	// console.log('== B1. Handling Offer', id);
// 	// //peerReady[id] = true;
// 	// const peer = getPeer(id);

// 	// //Make a queue of peers to be created by offer
// 	// //After we a successful ICE candidate, we can start on the next queue.




// 	// await peer.rtc.addStream(stream);
// 	// await peer.rtc.setRemoteDescription(desc)

// 	// const answer = await peer.rtc.createAnswer();
// 	// await peer.rtc.setLocalDescription(answer);

// 	// //await wait(4000);


// 	// console.log('== B2. Sending Answer', id);



// 	// server.emit('msg', {
// 	// 	target : id,
// 	// 	type   : 'answer',
// 	// 	desc    : peer.rtc.localDescription
// 	// });
// };





const handleIceCandidate = async (id, data)=>{

	try{
		const peer = getPeer(id);
		if(!peer){
			console.log('PEER NOT CREATED YET', id)
			return
		}


		if(!peer.connected) console.log('== C1. Handling ICE Candidate', id);

		await peer.rtc.addIceCandidate(new RTCIceCandidate(data))
			// .then((res)=>{
			// 	console.log('SUCCESS', res)

			// })
			// .catch((err)=>{
			// 	console.log('ERROR', err)
			// })

		if(!peer.connected){
			console.log('== C2. Added!', id);
			console.log(id, '✅');
			PeerQueue.finish();
			OfferQueue.finish();
		}
		peer.connected = true;
		//peerReady[id] = true;

		//removeFromQueue(id);
	}catch(err){
		console.error('=== Add ICE candidate error ===');
		console.error(id)

		console.error(err);

		console.log('You should try a retry here?')
	}

};




const OfferQueue = makeQueue(executeOffer);
const PeerQueue = makeQueue(addPeer);



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
				if(type == 'addPeer') PeerQueue.add(id, stream);
				if(type == 'removePeer') removePeer(id);
				if(type == 'offer') OfferQueue.add(id, data.desc, stream);
				if(type == 'answer') handleAnswer(id, data.desc, stream);
				if(type == 'new-ice-candidate') handleIceCandidate(id, data.data)
			});
		})
	}
}

var ICE_SERVERS = [
	{url:"stun:stun.l.google.com:19302"}
];

var server = null;   /* our socket.io connection to our webserver */

let Peers = {};


function start(server_url, userData) {
	console.log("Connecting to signaling server", server_url);
	server = io(server_url);
	//server = io();

	server.on('connect', async function() {
		console.log("Connected to signaling server");
		await initLocalMedia();
		server.emit('join', userData);
	});
	server.on('disconnect', function() {
		console.log("Disconnected from signaling server");
		Object.values(Peers).map((peer)=>{
			peer.rtc.close()
			peer.element.remove()
		})
		Peers = {};
	});


	server.on('update', function({peer_id, data}) {
		Peers[peer_id].data = data;
		res.onUpdate({peer_id, data});
	});


	server.on('removePeer', function({peer_id}) {
		Peers[peer_id].element.remove();
		Peers[peer_id].rtc.close();
		delete Peers[peer_id];
		res.onRemovePeep(peer_id);
	});

	server.on('addPeer', function({peer_id, should_create_offer, data}) {
		if(Peers[peer_id]) return;

		Peers[peer_id] = { data };


		Peers[peer_id].rtc = new RTCPeerConnection(
			{"iceServers": ICE_SERVERS},
			{"optional": [{"DtlsSrtpKeyAgreement": true}]}
		);


		Peers[peer_id].rtc.onicecandidate = function(event) {
			if (event.candidate) {
				server.emit('relayICECandidate', {
					'peer_id': peer_id,
					'ice_candidate': {
						'sdpMLineIndex': event.candidate.sdpMLineIndex,
						'candidate': event.candidate.candidate
					}
				});
			}
		}
		Peers[peer_id].rtc.onaddstream = function(event) {
			console.log("onAddStream", event);
			Peers[peer_id].element  = createAudioElement(event.stream, false, peer_id);
		}

		/* Add our local stream */
		Peers[peer_id].rtc.addStream(LocalMediaStream);

		if (should_create_offer) {
			console.log("Creating RTC offer to ", peer_id);
			Peers[peer_id].rtc.createOffer(
				function (local_description) {
					Peers[peer_id].rtc.setLocalDescription(local_description,
						function() {
							server.emit('relaySessionDescription',
								{'peer_id': peer_id, 'session_description': local_description});
						},
						function() { alert("Offer setLocalDescription failed!"); }
					);
				},
				function (error) {
					console.log("Error sending offer: ", error);
				});
		}

		res.onAddPeep(peer_id);
	});

	server.on('sessionDescription', function(config) {
		console.log('Remote description received: ', config);
		var peer_id = config.peer_id;
		var peer = Peers[peer_id].rtc;
		var remote_description = config.session_description;

		var desc = new RTCSessionDescription(remote_description);
		var stuff = peer.setRemoteDescription(desc,
			function() {
				if (remote_description.type == "offer") {
					peer.createAnswer(
						function(local_description) {
							peer.setLocalDescription(local_description,
								function() {
									server.emit('relaySessionDescription',
										{'peer_id': peer_id, 'session_description': local_description});
								},
								function() { Alert("Answer setLocalDescription failed!"); }
							);
						},
						function(error) {
							console.log("Error creating answer: ", error);
							console.log(peer);
						});
				}
			},
			function(error) {
				console.log("setRemoteDescription error: ", error);
			}
		);
		console.log("Description Object: ", desc);
	});

	server.on('iceCandidate', function(config) {
		var peer = Peers[config.peer_id];
		var ice_candidate = config.ice_candidate;
		peer.rtc.addIceCandidate(new RTCIceCandidate(ice_candidate));
	});


}



const createAudioElement = (stream, isMuted=false, id='me')=>{
	const audio = document.createElement('audio');
	audio.muted = isMuted;
	audio.autoplay = 'autoplay';
	audio.srcObject = stream;
	audio.controls = true;
	audio.id = `${id}-audio`

	document.body.appendChild(audio);
	return audio;
}


let LocalMediaStream, LocalMediaElement;

const initLocalMedia = async ()=>{
	if(LocalMediaElement) return;
	return new Promise((resolve, reject)=>{
		navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
		navigator.getUserMedia({"audio":true, "video":false},
			(stream)=>{
				LocalMediaElement = createAudioElement(stream, true);
				LocalMediaStream = stream;
				resolve();
			},
			()=>{
				alert('This will not work unless you accept');
				reject();
			}
		);
	});
}



let res = {
	start,
	Peers,
	update : (data)=>{
		server.emit('update', data)
	},
	onUpdate : ()=>{},
	onAddPeep : ()=>{},
	onRemovePeep : ()=>{}
}


module.exports = res;
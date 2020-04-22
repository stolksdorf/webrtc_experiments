require('./video.less');
const React = require('react');

const RTC = require('../rtc.js');


RTC.emitter.on('add', (peer)=>{ addVideo(peer.id); });
RTC.emitter.on('remove', (peer)=>{ removeVideo(peer.id); });
RTC.emitter.on('stream', (peer)=>{ addStream(peer.id, peer.stream); });

const addVideo = (id, mute=false)=>{
	const vid = document.createElement('video');
	vid.id = id;
	vid.muted = mute;
	vid.controls = true;
	vid.autoplay = true;
	document.getElementById('vids').appendChild(vid);
}

const removeVideo = (id)=>{
	const vid = document.getElementById(id);
	if(vid) vid.outerHTML = "";
}

const addStream = (id, stream)=>{
	const vid = document.getElementById(id);
	if(vid) vid.srcObject = stream;
}


const init = async (server_url, video=true)=>{
	addVideo('me', true);

	const stream = await navigator.mediaDevices.getUserMedia({audio:true, video});
	addStream('me', stream);
	const {id} = await RTC.connect(server_url, stream);
	document.title = id;
}


function VideoChat({root_url, ...props}){
	//React.useEffect(()=>{ init(root_url, false); }, [])


	return <div className='VideoChat'>
		<button onClick={()=>init(root_url, false)}>Audio Only</button>
		<button onClick={()=>init(root_url, true)}>Video</button>
		<div id='vids'>

		</div>
	</div>
}


module.exports = VideoChat;
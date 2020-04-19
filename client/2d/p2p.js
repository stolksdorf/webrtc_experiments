const RTC = require('../rtc.js');

const clamp = (val, min, max)=>{
	if(val<min) return min;
	if(val>max) return max;
	return val;
};

const $peers = {};

const Faces = require('./faces');


const distance = (x1,y1,x2,y2)=> Math.sqrt( Math.pow((x1-x2), 2) + Math.pow((y1-y2), 2) );

// RTC.emitter.on('*', (evt, data)=>
// });


RTC.emitter.on('add', (peer)=>{
	const icon = document.createElement('img');
	icon.id = `${peer.id}-icon`;

	const info = document.createElement('div');
	info.id = `${peer.id}-info`;
	info.innerHTML = `
		<div class='profile'>
			<img /><span></span>
			<small></small>
		</div>
		<div class='info'>
			<audio id="${peer.id}-stream" controls autoplay></audio>
			<progress value="0" max="100"> foo </progress>
		</div>`

	document.getElementById('map').appendChild(icon);
	document.getElementById('peeps').appendChild(info);

	$peers[peer.id] = {
		icon,
		info,
		audio : document.getElementById(`${peer.id}-stream`),
		level : info.querySelector('progress'),
		mode : 'talk'
	};
})
RTC.emitter.on('stream', (peer)=>{
	//const audio = document.getElementById(`${peer.id}-stream`);
	$peers[peer.id].audio.srcObject = peer.stream;
})

RTC.emitter.on('data', ({id, data})=>{
	$peers[id].x = data.x;
	$peers[id].y = data.y;
	$peers[id].mode = data.mode;

	const {icon, info, audio} = $peers[id];
	icon.style.top = `${data.y}px`;
	icon.style.left = `${data.x}px`;
	icon.src = Faces[data.icon];

	info.querySelector('img').src = Faces[data.icon];
	info.querySelector('span').innerHTML = data.name;
	info.querySelector('small').innerHTML = data.mode;

	updateVolume(id);
});

RTC.emitter.on('remove', ({id})=>{
	const {icon, info} = $peers[id];
	icon.outerHTML = "";
	info.outerHTML = "";
});


const isOnStage = (x,y)=>{
	return y > 0 && y < 80 && x > 150 && x < 350;
};
const isInPit = (x,y)=>{
	return y > 400 && x < 100;
}


const volume = {
	whisper : 35,
	talk : 80,
	shout : 140
}

const updateVolume = (peerId)=>{
	const { audio, x, y, level, mode} = $peers[peerId];
	let val;

	if(isOnStage(x,y)){
		val = 1;
	}else if(isInPit(last.x, last.y)){
		val = isInPit(x, y) ? 1 : 0;
	}else{
		const dist = distance(x,y,last.x,last.y);
		val = clamp((1.5 - dist/volume[mode]), 0.05, 1);
	}
	audio.volume = val;
	level.value = val * 100;
};

let last = {
	x    : 250,
	y    : 250,
	mode : 'talk'
}

module.exports = {
	connect : RTC.connect,
	update : (x, y, mode)=>{
		last = {x, y, mode}
		RTC.update({x, y, mode});
		Object.keys($peers).map(updateVolume);
	}
};

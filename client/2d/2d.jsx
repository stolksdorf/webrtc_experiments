const React = require('react');
require('./2d.less');

const P2P = require('./p2p.js');
const Faces = require('./faces');
const Startup = require('./startup.jsx');

const useLocalState = (init, key)=>{
	if(!key) throw `Must set a 'key' for local state hook`;
	const [val, setVal] = React.useState(init);
	React.useEffect(()=>{
		console.log(key, window.localStorage.getItem(key))
		try { setVal(JSON.parse(window.localStorage.getItem(key))); } catch (err){}
	}, []);
	return [val, (newVal)=>{
		try{ window.localStorage.setItem(key, JSON.stringify(newVal)); } catch (err){}
		setVal(newVal);
	}];
};

const clamp = (val, min, max)=>{
	if(val<min) return min;
	if(val>max) return max;
	return val;
};

const useForceUpdate = ()=>{
	const [value, set] = React.useState(true);
	return ()=>set(!value);
};

let count = 0;

let audioRefs = {};
let Peers = [];

const MAP_WIDTH = 500, MAP_HEIGHT = 500;

let posX = 250, posY = 250, _mode = 1;

const MODE = ['whisper', 'talk', 'shout'];

function Main({ root_url, ...props}){
	const [icon, setIcon] = React.useState('');
	const [name, setName] = React.useState('');
	const [mode, setMode] = React.useState(1);


	const [connected, setConnected] = React.useState(false);

	const connect = async (userData)=>{
		console.log(userData)
		const stream = await navigator.mediaDevices.getUserMedia({"audio":true, "video":false})
		setConnected(true);

		const info = await P2P.connect(root_url, stream, {
			...userData,
			x : posX,
			y : posY,
			mode : MODE[_mode]
		});
		document.title = info.id;
		setName(userData.name);
		setIcon(userData.icon);
	};

	React.useEffect(()=>{

		document.onkeydown = function(evt) {
			if(evt.keyCode == 65) posX = clamp(posX - 15, 25, MAP_WIDTH - 25);
			if(evt.keyCode == 87) posY = clamp(posY - 15, 25, MAP_HEIGHT - 25);
			if(evt.keyCode == 68) posX = clamp(posX + 15, 25, MAP_WIDTH - 25);
			if(evt.keyCode == 83) posY = clamp(posY + 15, 25, MAP_HEIGHT - 25);

			const temp = document.getElementById('me')
			temp.style.top = `${posY}px`;
			temp.style.left = `${posX}px`;
			P2P.update(posX, posY, MODE[_mode]);

		};

	}, [])

	return <div className='Main' >
		{!connected && <Startup onConnect={connect} />}

		<div id='map' style={{width : MAP_WIDTH, height : MAP_HEIGHT}}>
			<div id='stage'>stage</div>
			<div id='pit'>pit</div>
			<img id='me' src={Faces[icon]} className={MODE[mode]}/>
		</div>

		<label>
			<input type="range" step="1" min="0" max="2" value={mode} onChange={((evt)=>{
				setMode(evt.target.value);
				_mode = evt.target.value;
				P2P.update(posX, posY, MODE[evt.target.value]);
			})}></input>
			{MODE[mode]}
		</label>

		<div id='peeps'>


		</div>

	</div>
}


module.exports = Main;

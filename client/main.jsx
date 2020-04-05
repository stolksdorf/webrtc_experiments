const React = require('react');
require('./main.less');


const RTC = require('./rtc_connect.js');

const clamp = (val, min, max)=>{
	if(val<min) return min;
	if(val>max) return max;
	return val;
};


const useLocalState = (init, key)=>{
	if(!key) throw `Must set a 'key' for local state hook`;
	const [val, setVal] = React.useState(init);
	React.useEffect(()=>{
		try { setVal(JSON.parse(window.localStorage.getItem(key))); } catch (err){}
	}, []);
	return [val, (newVal)=>{
		try{ window.localStorage.setItem(key, JSON.stringify(newVal)); } catch (err){}
		setVal(newVal);
	}];
};

const dist = (x1,y1,x2,y2)=> Math.sqrt( Math.pow((x1-x2), 2) + Math.pow((y1-y2), 2) );


let posX = 250, posY = 250;

let audioRefs = {};


function Main({ root_url, ...props}){

	const [name, setName] = useLocalState('yo', 'name');
	const [icon, setIcon] = React.useState('https://png.pngtree.com/svg/20170827/people_106508.png');

	const [peers, setPeers] = React.useState([]);


	const adjustVolume = (peerId)=>{
		console.log(peerId);
		console.log(RTC.Peers[peerId]);


		const {x, y} = RTC.Peers[peerId].data;
		console.log(x,y);
		console.log(dist(x,y,posX,posY))
		console.log('---------')

		const audio = document.getElementById(`${peerId}-audio`)

		if(audio) audio.volume = (500 - dist(x,y,posX,posY))/800;

	}


	RTC.onUpdate = ()=>{
		console.log(RTC.Peers)

		setPeers(Object.values(RTC.Peers));


		Object.entries(audioRefs).map(([id, audio])=>{
			if(audio && !audio.srcObject) audio.srcObject = RTC.Peers[id].stream;
		});

		// const avatar = document.getElementById(`${peer_id}-icon`);

		// avatar.style.top = `${data.y}px`;
		// avatar.style.left = `${data.x}px`;
		// //avatar.src = data.icon;

		// adjustVolume(peer_id);
	}

	RTC.onAddPeep = (id)=>{
		// const peep = document.createElement('img');
		// peep.id = `${id}-icon`;
		// peep.src = 'https://png.pngtree.com/svg/20170827/people_106508.png';

		// document.getElementById('map').appendChild(peep)
		setPeers(Object.values(RTC.Peers));
	}

	RTC.onRemovePeep = (id)=>{
		//document.getElementById(`${id}-icon`).remove();
		setPeers(Object.values(RTC.Peers));
	}


	React.useEffect(()=>{

		navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
		navigator.getUserMedia({"audio":true, "video":false},
			(stream)=>{
				RTC.start(root_url, {
					name : window.localStorage.getItem('name'),
					icon : 'https://png.pngtree.com/svg/20170827/people_106508.png',
					x : posX,
					y : posY
				}, stream);
			},
			()=>{
				alert('This will not work unless you accept');
				reject();
			}
		);



		document.onkeydown = function(evt) {
			if(evt.keyCode == 37) posX = clamp(posX - 5, 25, 500 - 25);
			if(evt.keyCode == 38) posY = clamp(posY - 5, 25, 500 - 25);
			if(evt.keyCode == 39) posX = clamp(posX + 5, 25, 500 - 25);
			if(evt.keyCode == 40) posY = clamp(posY + 5, 25, 500 - 25);

			// const temp = document.getElementById('me-icon')
			// temp.style.top = `${posY}px`;
			// temp.style.left = `${posX}px`;

			// Object.keys(RTC.Peers).map((id)=>{
			// 	adjustVolume(id);
			// })

			RTC.update({
				name,
				icon,
				x : posX,
				y : posY
			})

		};

	}, [])


	return <div className='Main' >

		<input type='text' value={name} onChange={(evt)=>setName(evt.target.value)} />

		<div id='map'>
			{peers.map((peer)=>{
				return <img
					key={peer.id}
					src={peer.data.icon}
					style={{
						top : `${peer.data.y}px`,
						left : `${peer.data.x}px`
					}}
				/>
			})}


		</div>


		<div id='peeps'>
			{peers.map((peer)=>{
				return <div key={peer.id}>
					{peer.id}
					<audio
						ref={audio => { audioRefs[peer.id] = audio }}
						autoPlay='autoplay'
						key={peer.id}
						controls={true}
						muted={peer.id == RTC.id}
					/>
				</div>
			})}
		</div>
	</div>
}


module.exports = Main;
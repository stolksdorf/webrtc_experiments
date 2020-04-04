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

function Main({ root_url, ...props}){

	const [name, setName] = useLocalState('yo', 'name');
	const [icon, setIcon] = useLocalState('blue', 'icon');


	const adjustVolume = (peerId)=>{
		const {x, y} = RTC.Peers[peerId].data;
		console.log(x,y);
		console.log(dist(x,y,posX,posY))
		console.log('---------')

		const audio = document.getElementById(`${peerId}-audio`)

		if(audio) audio.volume = (500 - dist(x,y,posX,posY))/800;

	}


	RTC.onUpdate = ({peer_id, data})=>{
		console.log('onUpdate', data)

		const avatar = document.getElementById(`${peer_id}-icon`);

		avatar.style.top = `${data.y}px`;
		avatar.style.left = `${data.x}px`;
		//avatar.src = data.icon;

		adjustVolume(peer_id);
	}

	RTC.onAddPeep = (id)=>{
		const peep = document.createElement('img');
		peep.id = `${id}-icon`;
		peep.src = 'https://png.pngtree.com/svg/20170827/people_106508.png';

		document.getElementById('map').appendChild(peep)
	}

	RTC.onRemovePeep = (id)=>{
		document.getElementById(`${id}-icon`).remove();
	}


	React.useEffect(()=>{

		RTC.start(root_url, {
			name : window.localStorage.getItem('name'),
			icon : window.localStorage.getItem('icon'),
			x : posX,
			y : posY
		});

		document.onkeydown = function(evt) {
			if(evt.keyCode == 37) posX = clamp(posX - 5, 25, 500 - 25);
			if(evt.keyCode == 38) posY = clamp(posY - 5, 25, 500 - 25);
			if(evt.keyCode == 39) posX = clamp(posX + 5, 25, 500 - 25);
			if(evt.keyCode == 40) posY = clamp(posY + 5, 25, 500 - 25);

			const temp = document.getElementById('me-icon')
			temp.style.top = `${posY}px`;
			temp.style.left = `${posX}px`;

			Object.keys(RTC.Peers).map((id)=>{
				adjustVolume(id);
			})

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

			<img
				id='me-icon'
				src='https://png.pngtree.com/svg/20170827/people_106508.png'
				width='50px'
				height='50px'
			/>

		</div>


		<div id='peeps'>

		</div>
	</div>
}


module.exports = Main;
const React = require('react');
require('./startup.less');


const useLocalState = (init, key)=>{
	if(!key) throw `Must set a 'key' for local state hook`;
	const [val, setVal] = React.useState(init);
	React.useEffect(()=>{
		try {
			const temp = window.localStorage.getItem(key);
			if(temp !== null) setVal(JSON.parse(temp));
		} catch (err){}
	}, []);
	return [val, (newVal)=>{
		window.localStorage.setItem(key, JSON.stringify(newVal));
		setVal(newVal);
	}];
};

const Faces = require('./faces');


function Startup({ onConnect, ...props}){
	const [name, setName] = useLocalState('', 'name');
	const [autoconnect, setAutoconnect] = React.useState(false, 'autoconnect');
	//const [autoconnect, setAutoconnect] = useLocalState(false, 'autoconnect');

	const [icon, setIcon] = useLocalState(Object.keys(Faces)[0], 'icon');

	React.useEffect(()=>{
		if(autoconnect) onConnect({name, icon})
	}, [autoconnect])

	return <div className='Startup'>
		<div className='contents'>


			<label>
				Autoconnect:
				<input type='checkbox' checked={autoconnect} onChange={()=>setAutoconnect(!autoconnect)} />
			</label>
			<div className='faces'>
				{Object.entries(Faces).map(([id, src])=>{
					return <img
						className={id==icon ? 'selected' : ''}
						src={src}
						onClick={()=>setIcon(id)}
						key={id} />
				})}
			</div>
			<input type='text' value={name} onChange={(evt)=>setName(evt.target.value)} placeholder='Name' />
			<button onClick={()=>onConnect({name, icon})}>Connect</button>
		</div>
	</div>
}


module.exports = Startup;
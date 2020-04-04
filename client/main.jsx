const React = require('react');



const RTC = require('./rtc_connect.js');




function Main({ root_url, ...props}){

	const foo = ()=>{

	};


	React.useEffect(()=>{
		RTC(root_url);
	}, [])
	return <div className='Main'>
		Main Ready.
		<button onClick={foo}>foo</button>
	</div>
}


module.exports = Main;
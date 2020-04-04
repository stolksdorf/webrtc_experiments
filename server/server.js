var http = require('http');

const express = require('express');
const handler  = express();
var server = http.createServer(handler)
handler.use(express.static(__dirname + '/../build'));

const renderMain = require('./renderPage.js');

const SignalServer = require('./signal.server.js');



//const root_url = `http://localhost:8000`
//const root_url = `https://stolksdorf.ngrok.io`


handler.get('/', (req, res)=>{
	const props = {
		title : 'ssr',
		root_url : (req.headers.host.startsWith('localhost')
			? `http://${req.headers.host}`
			: `https://${req.headers.host}`
		)
	}

	//return res.send(true);
	return res.send(renderMain(props));
});


SignalServer(server);


server.listen(8000, ()=>{
	console.log('_____________________________');
	console.log(`server running on port: 8000 🔔`);
});

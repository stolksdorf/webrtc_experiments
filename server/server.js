var http = require('http');

const express = require('express');
const handler  = express();
var server = http.createServer(handler)
handler.use(express.static(__dirname + '/../build'));

const render = require('./renderPage.js');

const SignalServer = require('./signal.server.js');



//const root_url = `http://localhost:8000`
//const root_url = `https://stolksdorf.ngrok.io`

handler.get('/', (req, res)=>{
	return res.send(`<html><body>
		<a href='/2d'>2d Audio Chat</a>
		<a href='/video'>video Chat</a>
	</body></html>`)
})


handler.get('/2d', (req, res)=>{
	const props = {
		root_url : (req.headers.host.startsWith('localhost')
			? `http://${req.headers.host}`
			: `https://${req.headers.host}`
		)
	}
	return res.send(render('2d', props));
});

handler.get('/video', (req, res)=>{
	const props = {
		root_url : (req.headers.host.startsWith('localhost')
			? `http://${req.headers.host}`
			: `https://${req.headers.host}`
		)
	}
	return res.send(render('video', props));
});


SignalServer(server);


server.listen(8000, ()=>{
	console.log('_____________________________');
	console.log(`server running on port: 8000 🔔`);
});

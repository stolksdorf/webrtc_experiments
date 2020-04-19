module.exports = (proj='2d', props)=>{
	return `<!DOCTYPE html>
<!-- Doctype HTML5 -->
<html lang='en'>
	<head>
		<meta charset='utf-8'>
		<meta name='viewport' content='width=device-width, initial-scale=1'>
		<link href='/${proj}/bundle.css' rel='stylesheet'></link>

		<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
		<script src="https://cdn.socket.io/socket.io-1.4.5.js"></script>
	</head>
	<body>
		<main>${require(`../build/${proj}/ssr.js`)(props)}</main>
	</body>
	<script src='/${proj}/bundle.js'></script>
	<script>start_app(${JSON.stringify(props)})</script>
</html>`;

}
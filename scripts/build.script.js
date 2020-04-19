const fs = require('fs-extra');

const { pack, watchFile, livereload } = require('vitreum');
const isDev = !!process.argv.find(arg=>arg=='--dev');


const lessTransform = require('vitreum/transforms/less.js');
const assetTransform = require('vitreum/transforms/asset.js');

const transforms = {
	'.less' : lessTransform,
	'*': assetTransform('./build')
};

const build = (proj)=>{
	return async ({ bundle, ssr })=>{
		await fs.outputFile(`./build/${proj}/bundle.css`, await lessTransform.generate());
		await fs.outputFile(`./build/${proj}/bundle.js`, bundle);
		await fs.outputFile(`./build/${proj}/ssr.js`, ssr);

	};
}


fs.emptyDirSync('./build');

pack('./client/2d/2d.jsx', {
	dev : isDev && build('2d'),
	transforms
})
.then(build('2d'))
.catch((err)=>console.log(err))



pack('./client/video/video.jsx', {
	dev : isDev && build('video'),
	transforms
})
.then(build('video'))
.catch((err)=>console.log(err))





//In development set up a watch server and livereload
if(isDev){
	livereload('./build');
	watchFile('./server/server.js', {
		watch : [] // Watch additional folders if you want
	});
}


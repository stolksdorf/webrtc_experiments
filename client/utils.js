
const Queue = (func)=>{
	let queue = [];
	let isRunning = false;

	const next = ()=>{
		isRunning = true;
		func(...queue.shift());
	}
	return {
		queue,
		add: (...args)=>{
			queue.push(args);
			if(!isRunning) next();
		},
		next : ()=>{
			isRunning = false;
			if(queue.length !== 0) next();
		}
	}
};

const Emitter = ()=>{
	let fns = {};
	return {
		on : (evt,fn)=>fns[evt]=(fns[evt]||[]).concat(fn),
		off : (evt,fn)=>fns[evt]=(fns[evt]||[]).filter((_fn)=>_fn!==fn),
		emit : (evt, ...data)=>{
			(fns[evt]||[]).map((fn)=>fn(...data));
			(fns['*']||[]).map((fn)=>fn(evt, ...data));
		},
	}
};


module.exports = { Queue, Emitter };
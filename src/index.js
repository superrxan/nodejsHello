const WsServer = require('websocket').WsServer;
const config = require('./config');
const Processor = require('./Processor');

setInterval(() => {
	const used = process.memoryUsage();
	for (let key in used) {
		used[key] = `${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`;
	}
	console.log(`${process.pid}: ${JSON.stringify(used)}`);
}, 30000);

const wsServer = new WsServer(
	config.RECEIVER_HOST,
	config.RECEIVER_PORT,
	config.SECURE_WEBSOCKET,
	config.CERTIFICATE_PATH,
	config.KEY_PATH,
	config.OUTPUT_FILE_PATH
);



const processor = new Processor(
	config.PROTO_NAME,
	config.CONVERTER_PARAMS,
	config.MONGO_HOST,
	config.MONGO_PORT,
	(err, msg) => {
		if (err) {
			console.error('Error initializing Receiver:', err);
			process.exit(1);
		}
		else {
			wsServer.on('message', (ws, req, wsMsg) => {
				processor.process(ws, req, wsMsg);
			});
			console.log('Started Receiver');
		}
	});


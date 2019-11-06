const debug = require('debug')('ws-server');
const express = require('express');
const https = require('https');
const url = require('url');
const WebSocket = require('ws');
const fs = require('fs');
const EventEmitter = require('events');

class WsServer extends EventEmitter {
	constructor(host, port, secureWs, certPath, keyPath, outputFilename) {
		super();
		this.app = express();
		if (secureWs === true) {
			this.server = https.createServer({
					cert: fs.readFileSync(certPath),
					key: fs.readFileSync(keyPath)
				},
				this.app
			);
		} else {
			this.server = https.createServer(this.app);
		}

		this.server.listen(port, host);

		console.log('listen on host:port', host, port, secureWs);

		this.wss = new WebSocket.Server({ server: this.server });
		this.wss.on('connection', this.onConnected.bind(this));
		this.wss.on('error', this.onError.bind(this));
		this.outputFilename = outputFilename;
		if (this.outputFilename) {
			console.log('writing to', this.outputFilename);
			this.writer = fs.createWriteStream(this.outputFilename, { encoding: 'utf8', flags: 'a+' });
		}
	}

	onConnected(ws, req) {
		const location = url.parse(req.url, true);
		const ip = req.connection.remoteAddress;
		if (debug.enabled) {
			debug('Connection over Websocket ok ' + JSON.stringify(location) + 'from ' + ip);
		}
		ws.on('message', this.onMessage.bind(this, ws, req));
		ws.on('close', this.onClose.bind(this, ws, req));
	}

	onMessage(ws, req, msg) {
		if (debug.enabled){
			debug('ws: ' + msg.toString('hex'));
		}
		if (this.outputFilename) {
			this.writer.write(msg.toString('hex') + '\n');
		}
		this.emit('message', ws, req, msg);
	}

	onError(error) {
		this.emit('error', error);
	}
	
	onClose(ws, req, connection) {
		this.emit('close', ws, req, connection);
	}
}

module.exports = WsServer;

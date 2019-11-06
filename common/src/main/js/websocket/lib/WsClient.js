const debug = require('debug')('wsclient');
const WS = require('ws');
const EventEmitter = require('events');

const SLEEP_RETRY_SEC = 10;
const QUEUE_LIMIT = 10000;
const CONNECTION_STATE = {
	0: 'CONNECTING',
	1: 'OPEN',
	2: 'CLOSING',
	3: 'CLOSED'
};

class WsClient extends EventEmitter {
	constructor(address, options) {
		super();
		this.address = address;
		this.queue = [];
		this.client = null;
		this.closed = false;
		this.opened = false;
		this.options = options;
		this.reconnectTimer = null;
		this.connect();
	}

	getInfo() {
		return {
			connection_state: CONNECTION_STATE[this.client.readyState],
			opened: this.opened,
			closed: this.closed,
			queue_length: this.queue.length
		};
	}

	close() {
		this.closed = true;
		this.opened = false;
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}
		this.client.close();
	}

	connect() {

		debug('Connecting to websocket server on ' + this.address);

		this.client = new WS(this.address, this.options);

		this.client.on('close', (code, reason) => {
			if (this.closed) {
				this.emit('close', code, reason);
			} else {
				this.reconnect();
			}
		});

		this.client.on('error', error => {
			if (this.client.readyState === WS.OPEN) {
				this.emit('error', error);
			} else {
				this.reconnect();
			}
		});

		this.client.on('message', msg => {
			this.emit('message', msg);
		});

		this.client.on('open', () => {
			debug('connected to', this.address);

			if (!this.opened) {
				this.opened = true;
				this.emit('open');
			} else {
				this.emit('reconnect');
			}

			this.flush();
		});
	}

	flush() {
		if (debug.enabled) {
			debug('flushing started' + JSON.stringify(this.getInfo()));
		}
		while (this.queue.length > 0 && this.client.readyState === WS.OPEN) {
			this.send(this.queue.shift());
		}
		if (debug.enabled) {
			debug('flushing queue finished' + JSON.stringify(this.getInfo()));
		}
	}

	send(data) {
		if (this.client.readyState === WS.OPEN) {
			this.client.send(data, (err) => {
				if (err) {
					console.error('Error sending data', JSON.stringify({ data: data, error: err }));
					this.emit('send_error', { data: data, error: err });
				}
			});
		} else if (this.closed) {
			throw new Error('client is closed');
		} else {
			if (this.queue.length >= QUEUE_LIMIT) {
				let discarded = this.queue.shift();
				this.emit('send_discarded', { data: discarded });
				debug('queue is full. discarding data: ' + discarded);
			}
			this.queue.push(data);
		}
	}

	reconnect() {
		if (this.reconnectTimer) {
			return;
		}
		
		debug('reconnecting in ' + SLEEP_RETRY_SEC + ' second(s).' + JSON.stringify(this.getInfo()));

		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = null;
			this.emit('reconnecting');
			this.connect();
		}, SLEEP_RETRY_SEC * 1000);
	}
}

module.exports = WsClient;

const prom = require('prom-client');
const gcStats = require('prometheus-gc-stats');
const http = require('http');
const path = require('path');
const QuickLRU = require('quick-lru');

class Prometheus {

	constructor() {
		prom.collectDefaultMetrics({ timeout: 10000 });
		const startGcStats = gcStats(prom.register);
		startGcStats();
		this.startMetricsServer();
		this.counters = [];

		//per exp maintain a connection list
		this.connList = {};
	}

	startMetricsServer() {
		this.server = http.createServer((req, res) => {
			if (req.url === path.normalize('/metrics')) {
				res.writeHead(200, { 'Content-Type': prom.register.contentType });
				res.end(prom.register.metrics());
			}
			else {
				res.end();
			}
		});
		this.server.listen(3000);
	}


	addCounter(name, help = 'help') {
		let counter = new prom.Counter({
			name: name,
			help: help
		});
		this.counters[name] = counter;
		return counter;
	}

	inc(name, amount = 1) {
		let counter = this.counters[name];
		if (!counter) {
			counter = this.addCounter(name, name);
		}
		counter.inc(amount);
	}

	//for every exp, create a LRU.
	addConItem(exp_name) {
		let conItem = new QuickLRU({maxSize: 1000});
		this.connList[exp_name] = conItem;
		return conItem;
	}

	incConnectItem(exp_name, ws,remoteAddress) {
		let conItem = this.connList[exp_name];
		if (!conItem) {
			conItem = this.addConItem(exp_name);
		}


		let wsIstance = conItem.get(remoteAddress);
		if (!wsIstance) {
			conItem.set(remoteAddress, ws);
		}
	}

	delConnectItem(exp_name, ws,remoteAddress) {
		let conItem = this.connList[exp_name];
		if (!conItem) {
			return;
		}
		let wsInstance = conItem.has(remoteAddress)
		if (wsInstance) {
			conItem.delete(remoteAddress);
		}
	}



}

module.exports = Prometheus;

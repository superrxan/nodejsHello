const debug = require('debug')('processor');
const async = require('async');
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const ProtoHandler = require('./ProtoHandler');
const ProtoWrapper = require('./ProtoWrapper');
const Prometheus = require('./Prometheus');
const Converter = require(`./converters/AP/index`);
const MongoClient = require(`./database/mongodb/index`);
const QuickLRU = require('quick-lru');
const url = require('url');

class Processor extends EventEmitter {
	constructor(protobufName, converterParams, mongoHost, mongoPort, processorCb) {
		super();
		this.initProm();

		this.mongoClient = new MongoClient(mongoHost, mongoPort);
		this.protoWrapper = new ProtoWrapper(protobufName);
		this.protoHandler = new ProtoHandler(this.protoWrapper);

		this.protoToJsonConverter = new Converter(converterParams, this.mongoClient);


		if (this.protoToJsonConverter == null) {
			return processorCb(`Could not initialize converter named AP`);
		}
		this.on('proto', this.handleProtobufToJSON.bind(this));

		return processorCb(null);
	}

	initProm() {
		this.prom = new Prometheus();

		this.prom.addCounter('ws_receiver_proto_in', 'ws_receiver_proto_in');
		this.prom.addCounter('ws_receiver_proto_out_ok', 'ws_receiver_proto_out_ok');
		this.prom.addCounter('ws_receiver_proto_out_error', 'ws_receiver_proto_out_error');
		this.prom.addCounter('ws_receiver_converter_in', 'ws_receiver_converter_in');
		this.prom.addCounter('ws_receiver_converter_out_ok', 'ws_receiver_converter_out_ok');
		this.prom.addCounter('ws_receiver_converter_out_error', 'ws_receiver_converter_out_error');
		this.prom.addCounter('ws_receiver_avro_in', 'ws_receiver_avro_in');
		this.prom.addCounter('ws_receiver_avro_out_ok', 'ws_receiver_avro_out_ok');
		this.prom.addCounter('ws_receiver_avro_out_error', 'ws_receiver_avro_out_error');
	}

	process(ws, req, protobuf) {

		this.prom.inc('ws_receiver_proto_in');
		debug('protobuf:', protobuf.toString('hex'));

		const expName = url.parse(req.url, true).path.slice(1).trim();
		console.log('############################', expName);
		const remoteIp = req.connection.remoteAddress;
		this.prom.incConnectItem(expName, ws, remoteIp);


		this.protoHandler.process(protobuf, (err, proto) => {
			if (!err) {
				//enrich protobuf with exp name from url
				proto.expName= expName;
				debug("Received new protobuf", JSON.stringify(proto));

				this.prom.inc('ws_receiver_proto_out_ok');
				this.emit('proto', proto);
			} else {
				this.prom.inc('ws_receiver_proto_out_error');
			}
		});
	}

	handleProtobufToJSON(protobufObj) {
		this.prom.inc('ws_receiver_converter_in');
		if (debug.enabled) {
			debug('protobufJson:' + JSON.stringify(protobufObj, null, ''));
		}

		this.protoToJsonConverter.process(protobufObj, (err, Json) => {
			if (!err) {
				this.prom.inc('ws_receiver_converter_out_ok');
				this.emit('Json', avroJson);
			} else {
				this.prom.inc('ws_receiver_converter_out_error');
			}
		});
	}

}

module.exports = Processor;



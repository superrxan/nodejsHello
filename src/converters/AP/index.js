const debug = require('debug')('converter-ap-raw');
const Long = require('long');
const ouiClassifier = require('./ouiClassifier');
const utils = require('../../utils');
const MongoClient = require(`../../database/mongodb/index`);

const INVALID_PAYLOAD =
	'00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

class ConverterApRaw {

	constructor(params, mongoClient) {
		this.overwriteTimestamp = params.overwriteTimestamp ? params.overwriteTimestamp : false;
		this.mongoClient = mongoClient;
	}

	process(protobufObj, cb) {
		this.cleanupProto(protobufObj, (error, receivedTimestamp, reported, reporter, beacon) => {
			if (!error) {
				this.convertToAvroJson(receivedTimestamp, reporter, reported, beacon, cb);
			}
			else {
				cb(error);
			}
		});
	}

	cleanupProto(protobufObj, cb) {
		let now_time = Date.now();
		let now_date = utils.dateEpochToISO8601(now_time);
		let now = {time: now_time, date: now_date};
		try {

			let expName =  protobufObj.expName.toLowerCase();
			let PerProApValue = JSON.parse(JSON.stringify(protobufObj, this.macFieldToHexString));

			//#################################################################
			// below code split up a protobuf object and get the beacon info.
			//#################################################################
			let meta = protobufObj.meta;
			meta.version = new Long(meta.version).toString();
			let reporter = protobufObj.reporter;
			reporter.macFormatted = utils.macBytesToFormatted(reporter.mac);
			reporter.macAscii = utils.macBytesToAscii(reporter.mac).toLowerCase();
			reporter.UUID = utils.uuid(reporter.macFormatted);

			//save to mongo with
			// dbname     <expName>
			// collection <reporter mac>
			// document   <protobufObj>

			//this.mongoClient.SAVE2DB()

			this.mongoClient.SAVE2DB(expName, reporter.macAscii , PerProApValue);

			//console.log( '@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@', JSON.stringify(protobufObj.expName), JSON.stringify(reporter.macFormatted));

			//this.mongoClient.SAVE2DB(expName.toString(), reporter.macAscii.toString(), {id:2});
			debug(JSON.stringify(expName), JSON.stringify(reporter.macFormatted), PerProApValue);

			if (this.overwriteTimestamp == 0) {
				reporter.time = new Long(reporter.time).toNumber() * 1000;
			}
			else {
				reporter.time = now.time;
			}
			reporter.time_date = utils.dateEpochToISO8601(reporter.time);

			for (let indexReported in protobufObj.reported) {
				let reported = protobufObj.reported[indexReported];
				reported.macFormatted = utils.macBytesToFormatted(reported.mac);
				reported.macAscii = utils.macBytesToAscii(reported.mac);
				reported.macType = ouiClassifier.getMacAddressType(reported.macFormatted);
				if (reported.macType == ouiClassifier.TYPE_RANDOM) {
					let randomType = ouiClassifier.getMacRandomType(reported.macFormatted);
					if (randomType == ouiClassifier.TYPE_RANDOM_RESERVED) {
						reported.macType = ouiClassifier.TYPE_PUBLIC;
						console.warn('Address ' + reported.mac + ' was guessed as random \'reserved\' so changing it to public');
					}
				}
				reported.UUID = utils.uuid(reported.macFormatted);
				
				if (this.overwriteTimestamp == 0) {
					reported.lastSeen = new Long(reported.lastSeen).toNumber() * 1000;
				}
				else {
					reported.lastSeen = now.time;
				}
				reported.lastSeen_date = utils.dateEpochToISO8601(reported.lastSeen);

				for (let indexBeacon in reported.beacons) {
					let beacon = reported.beacons[indexBeacon];
					if (beacon.payload) {
						beacon.payload.advData = (beacon.payload.advData || '').toString('hex');
						beacon.payload.advDataLen = beacon.payload.advData.length / 2;
						beacon.payload.advDataTime = 0;
						beacon.payload.advDataDate = '';
						beacon.payload.advDataTime = reported.lastSeen;
						beacon.payload.advDataDate = reported.lastSeen_date;
						beacon.payload.scnResp = (beacon.payload.scnResp || '').toString('hex');
						beacon.payload.scnRespLen = beacon.payload.scnResp.length / 2;
						beacon.payload.scnRespTime = 0;
						beacon.payload.scnRespDate = '';
						if (beacon.payload.scnRespLen > 0) {
							beacon.payload.scnRespTime = reported.lastSeen;
							beacon.payload.scnRespDate = reported.lastSeen_date;
						}
					}
					cb(null, now, reported, reporter, beacon);
				}
			}
		} catch (error) {
			console.error('Error while sanitizing Telemetry:', error, protobufObj);
			cb(error);
		}
	}


	convertToAvroJson(now, reporter, reported, beacon, cb) {
		try {
			let payload = beacon.payload;
			payload = payload ? payload : {};

			let avroJson = {
				address: reported.macAscii,
				addressType: reported.macType,
				scannerUUID: reporter.UUID,
				scannerAddress: reporter.macAscii,
				rssi: reported.rssi ? reported.rssi.last : 0,
				connectable: true,
				hasScanResponse: payload.scnRespLen > 0,
				receivedTimestamp: now.time,
				receivedDatetime: now.date,
				capturedTimestamp: payload.advDataTime,
				capturedDatetime: payload.advDataDate,
				capturedResponseTimestamp: payload.scnRespTime,
				capturedResponseDatetime: payload.scnRespDate,
				scanPayload: payload.advData,
				scanPayloadLength: payload.advDataLen,
				responsePayload: payload.scnResp,
				responsePayloadLength: payload.scnRespLen,
				rawPayload: payload.advData + payload.scnResp,
				rawPayloadLength: payload.advDataLen + payload.scnRespLen 
			};

			if (this.isValidMessage(avroJson)) {
				if (debug.enabled) {
					debug('avro json:', JSON.stringify(avroJson, null, ''));
				}
				cb(null, { value: avroJson, key: { address: avroJson.address, addressType: avroJson.addressType } });
			} else {
				cb('invalid message.');
			}
		} catch (error) {
			cb(error);
			console.error('AvroParser: error parsing telemetry data', error);
		}
	}

	isValidMessage(msg) {
		return msg.rawPayload != INVALID_PAYLOAD && msg.rawPayloadLength > msg.responsePayloadLength;
	}

	macFieldToHexString (key, value) {
		if (key === "mac") {
			value = utils.macBytesToFormatted(Buffer.from(value, 'base64'))
		}
		return value
	}
}

module.exports = ConverterApRaw;


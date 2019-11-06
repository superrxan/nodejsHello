const debug = require('debug')('converter-attributes-scan');
const utils = require('../../utils');

class ConverterAttributesScan {
	constructor(overwriteTimestamp) {
		this.overwriteTimestamp = overwriteTimestamp;
	}

	process(protobufObj, cb) {
		try {
			const now = Date.now();
			const avroJson = {
				receivedTimestamp: now,
				receivedDatetime: utils.dateEpochToISO8601(now),
				capturedDatetime: protobufObj.timestamp,
				capturedTimestamp: utils.dateISO8601ToEpoch(protobufObj.timestamp),
				scannerUUID: protobufObj.scanner.UUID,
				scannerAddress: utils.macFormattedToAscii(protobufObj.scanner.address),
				address: utils.macFormattedToAscii(protobufObj.address),
				addressType: protobufObj.addressType,
				rssi: protobufObj.rssi,
				connectable: protobufObj.connectable,
				services: JSON.stringify(protobufObj.services, null, '')
			};
			cb(null, { value: avroJson, key: { address: avroJson.address, addressType: avroJson.addressType } });
		} catch (error) {
			cb(error);
		}
	}
}

module.exports = ConverterAttributesScan;
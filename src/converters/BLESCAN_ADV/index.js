const debug = require('debug')('converter-advertisement-scan');
const utils = require('../../utils');

class ConverterAdvertisementScan {
	constructor(overwriteTimestamp) {
		this.overwriteTimestamp = overwriteTimestamp;
	}

	process(protobufObj, cb) {
		try {
			let scanner = protobufObj.scanner;

			for (let i = 0; i < protobufObj.advPayloads.length; i++) {
				let adv = protobufObj.advPayloads[i];
				let now = Date.now();
				let avroJson = {
					receivedTimestamp: now,
					receivedDatetime: utils.dateEpochToISO8601(now),
					capturedTimestamp: utils.dateISO8601ToEpoch(adv.timestamp),
					capturedResponseTimestamp: utils.dateISO8601ToEpoch(adv.timestampResponse),
					capturedDatetime: adv.timestamp,
					capturedResponseDatetime: adv.timestampResponse,
					scannerUUID: scanner.UUID,
					scannerAddress: utils.macFormattedToAscii(scanner.address),
					address: utils.macFormattedToAscii(adv.address),
					addressType: adv.addressType,
					rssi: adv.rssi,
					connectable: adv.connectable,
					hasScanResponse: adv.hasScanResponse,
					scanPayload: adv.scanData.hex,
					scanPayloadLength: adv.scanData.length,
					responsePayload: adv.responseData ? adv.responseData.hex : '',
					responsePayloadLength: adv.responseData ? adv.responseData.length : 0,
					rawPayload: adv.rawData.hex,
					rawPayloadLength: adv.rawData.length
				};
				cb(null, { value: avroJson, key: { address: avroJson.address, addressType: avroJson.addressType } });
			}
		} catch (error) {
			cb(error);
		}
	}
}

module.exports = ConverterAdvertisementScan;


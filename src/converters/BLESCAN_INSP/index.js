const debug = require('debug')('converter-inspection-scan');
const utils = require('../../utils');

class ConverterInspectionScan {
	constructor(overwriteTimestamp) {
		this.overwriteTimestamp = overwriteTimestamp;
	}

	process(protobufObj, cb) {
		try {
			const now = Date.now();
			const avroJson = {
				receivedTimestamp: now,
				receivedDatetime: utils.dateEpochToISO8601(now),
				capturedTimestamp: utils.dateISO8601ToEpoch(protobufObj.timestamp),
				capturedDatetime: protobufObj.timestamp,
				scannerUUID: protobufObj.scanner.UUID,
				scannerAddress: utils.macFormattedToAscii(protobufObj.scanner.address),
				address: utils.macFormattedToAscii(protobufObj.address),
				addressType: protobufObj.addressType,
				iUUID: protobufObj.iUUID,
				status: protobufObj.status,
				dataLayer: protobufObj.iData.layer,
				dataCmd: protobufObj.iData.cmd.name,
				dataCmdResponse: protobufObj.iData.cmdResponse.name,
				dataCmdResponsePayload: protobufObj.iData.cmdResponse.dataRaw,
			};
			cb(null, { value: avroJson, key: { address: avroJson.address, addressType: avroJson.addressType } });
		} catch (error) {
			cb(error);
		}
	}
}

module.exports = ConverterInspectionScan;
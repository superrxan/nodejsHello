const debug = require('debug')('proto-wrapper');
const protobuf = require('protobufjs');
const fs = require('fs');
const path = require('path');

const SCHEMA_FILE_NAME = path.resolve('/Users/admin/project/nodejs/nodejsHello/common/src/main/proto/ap/aruba_telemetry.proto');
class ProtoWrapper {
	constructor(name) {
		this.type = protobuf.loadSync(SCHEMA_FILE_NAME).lookupType(name);
	}

	decode(buffer) {
		let decodedMessage = null;
		try {
			decodedMessage = this.type.decode(buffer);
		} catch (e) {
			if (e instanceof protobuf.util.ProtocolError) {
				// e.instance holds the so far decoded message with missing required fields
				debug('Decoding Error. Some required fields were missing:', e);
				throw e;
			} else {
				// wire format is invalid
				debug('wire format error:', e);
				throw e;
			}
		}

		let error = this.type.verify(this.type.toObject(decodedMessage));
		if (error) {
			decodedMessage = null;
			debug(
				'Error on message:',
				JSON.stringify({ protobuf: decodedMessage.toJSON(), Error: error }, null, ' ')
			);
			throw error;
		}
		if (debug.enabled) {
			debug('protobuf:' + JSON.stringify(decodedMessage.toJSON(), null, ''));
		}
		return decodedMessage;
	}
}

module.exports = ProtoWrapper;

const debug = require('debug')('converter-generic');

class ConverterGeneric {
	constructor() {
	}

	process(protobufObj, cb) {
		try {
			let json = protobufObj.toJSON();
			debug(JSON.stringify(json));
			cb(null, { value: json, key: json.name });
		} catch (error) {
			cb(error);
		}

	}
}

module.exports = ConverterGeneric;
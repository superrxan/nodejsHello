const debug = require('debug')('proto-handler');

class ProtoHandler {

	constructor(protoWrapper) {
		this.protoWrapper = protoWrapper;
	}

	process(buffer, cb) {
		try {
			cb(null, this.protoWrapper.decode(buffer) );
		}
		catch (error) {
			cb(error);
		}
	}

	// process(buffer) {
	// 	return new Promise(function (resolve, reject){
	// 		try {
	// 			console.log("decoding the protobug...");
	// 			console.log(buffer)
	// 			let protobufObj = this.protoWrapper.decode(buffer);
	// 			console.log("decoding the protobug done...");
	// 			console.log(protobufObj);
	// 			resolve(protobufObj);
	// 		}
	// 		catch (err) {
	// 			reject(err);
	// 		}
	// 	})
	// }
}


module.exports = ProtoHandler;

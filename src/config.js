const debug = require('debug')('config');
const { resolve } = require('path');

let envConfig = {
	RECEIVER_HOST: process.env.RECEIVER_HOST || '0.0.0.0',
	RECEIVER_PORT: process.env.RECEIVER_PORT || '8443',
	PROTO_NAME: process.env.PROTO_NAME || 'aruba_telemetry.Telemetry',
	CONVERTER_PARAMS: process.env.CONVERTER_PARAMS || '{overwriteTimestamp:true}',
	SECURE_WEBSOCKET: process.env.SECURE_SOCKET || true,
	MONGO_HOST: process.env.MONGO_HOST || 'localhost',
	MONGO_PORT: process.env.MONGO_PORT || '27017',
	CERTIFICATE_PATH: resolve(process.env.CERTIFICATE_PATH || 'cert/ws-receiver-cert.pem'),
	KEY_PATH: resolve(process.env.KEY_PATH || 'cert/ws-receiver-key.pem'),
	OUTPUT_FILE_PATH: process.env.OUTPUT_FILE_PATH ? resolve(process.env.OUTPUT_FILE_PATH) : undefined,
};
function getConfig() {
	return envConfig;
}

let config = getConfig();
if (debug.enabled) {
	debug('Config', JSON.stringify(config, null, ' '));
}

module.exports = config;

const MY_NAMESPACE = '88ef2fd0-ffcf-11e8-8e1a-4f0b1a8da4ee';
const uuidv5 = require('uuid/v5');
const QuickLRU = require('quick-lru');

const uuidCache = new QuickLRU({ maxSize: 100 });
const macCache = new QuickLRU({ maxSize: 1000 });

const regExComma = /:/g;
const regExPair = /.{1,2}/g;

module.exports = {
	macFormattedToBytes(formatted) {
		return Buffer.from(formatted.replace(regExComma, ''), 'hex');
	},
	macBytesToFormatted(bytes) {
		let mac = macCache.get(bytes);
		if (!mac) {
			mac = bytes
				.toString('hex')
				.toLowerCase()
				.match(regExPair)
				.join(':');
			macCache.set(bytes, mac);
		}
		return mac;
	},
	macAsciiToFormatted(ascii) {
		return ascii
			.toString('utf8')
			.toLowerCase()
			.match(regExPair)
			.join(':');
	},
	macFormattedToAscii(formatted) {
		return formatted.toLowerCase().replace(regExComma, '');
	},
	macAsciiToBytes(ascii) {
		return ascii.toString('utf8').toLowerCase();
	},
	macBytesToAscii(bytes) {
		return bytes.toString('hex');
	},
	uuid(str) {
		let uuid = uuidCache.get(str);
		if (!uuid) {
			uuid = uuidv5(str, MY_NAMESPACE);
			uuidCache.set(str, uuid);
		}
		return uuid;
	},
	dateISO8601ToEpoch(iso) {
		return iso.length > 0 ? Date.parse(iso) : 0;
	},
	dateEpochToISO8601(epoch) {
		let date = '';
		if (epoch > 0) {
			date = new Date(epoch);
			date = date.toISOString();
		}
		return date;
	}
};

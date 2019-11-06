const oui = require('./oui.json');

const TYPE_PUBLIC = 'public';
const TYPE_RANDOM = 'random';

function getMacAddressType(addr) {
	let addrKey = addr.substring(0, 8).toUpperCase();
	let owner = oui[addrKey];
	let type = owner ? TYPE_PUBLIC : TYPE_RANDOM;
	return type;
}

const TYPE_RANDOM_RESERVED = 'reserved';
const TYPE_RANDOM_NON_RESOLVABLE_PRIVATE = 'non-resolvable private';
const TYPE_RANDOM_RESOLVABLE_PRIVATE = 'resolvable private';
const TYPE_RANDOM_STATIC = 'resolvable private';

const regexMacNonResolvablePrivate = /^[0123]/i;
const regexMacResolvablePrivate = /^[4567]/i;
const regexMacStatic = /^[CEDF]/i;
function getMacRandomType(addr) {

	let randomFlag = addr.charAt(0);
	let type = TYPE_RANDOM_RESERVED;
	if (regexMacNonResolvablePrivate.test(randomFlag)) {
		type = TYPE_RANDOM_NON_RESOLVABLE_PRIVATE;
	} else if (regexMacResolvablePrivate.test(randomFlag)) {
		type = TYPE_RANDOM_RESOLVABLE_PRIVATE;
	} else if (regexMacStatic.test(randomFlag)) {
		type = TYPE_RANDOM_STATIC;
	}
	return type;
}

exports.getMacAddressType = getMacAddressType;
exports.getMacRandomType = getMacRandomType;

exports.TYPE_PUBLIC = TYPE_PUBLIC;
exports.TYPE_RANDOM = TYPE_RANDOM;

exports.TYPE_RANDOM_RESERVED = TYPE_RANDOM_RESERVED;
exports.TYPE_RANDOM_NON_RESOLVABLE_PRIVATE = TYPE_RANDOM_NON_RESOLVABLE_PRIVATE;
exports.TYPE_RANDOM_RESOLVABLE_PRIVATE = TYPE_RANDOM_RESOLVABLE_PRIVATE;
exports.TYPE_RANDOM_STATIC = TYPE_RANDOM_STATIC;

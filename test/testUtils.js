const utils = require('../src/utils')

let mac = '112233445566'

let macformatted = utils.macAsciiToFormatted(mac)

console.log(macformatted)

macbytes = utils.macFormattedToBytes(macformatted)

console.log(macbytes)

now_time = Date.now()

console.log(now_time)

now_date = utils.dateEpochToISO8601(now_time)

console.log(now_date)

console.log(utils.dateISO8601ToEpoch(now_date))

console.log(Buffer.from("ggryz+xg", 'base64').toString('hex'))

console.log(utils.macBytesToFormatted(Buffer.from("ggryz+xg", 'base64')))


console.log({exp: "data", col: "collection"});


const mongoClient = require('mongodb').MongoClient;
const debug = require('debug')('MongoClient');
debug.enabled = true;

const QUEUE_LENGTH = 1000;
const RETRY_TIMER = 10;


class MongoDBClient {
    constructor(host, port) {
        this.mongoURL = 'mongodb://' + host + ':' + port;
        this.connected = false;
        this.queue = [];
        this.reconnectTimer = null;

        this.mongoClientInstance = null;
        this.connect();
        console.log(this.mongoURL);
    }

    connect() {
        mongoClient.connect(this.mongoURL, {useNewUrlParser: true, useUnifiedTopology: true}, (err, mclient) => {
            if (err) {
                this.connected = false;
                debug('mongoDB connect error', JSON.stringify(err));
                this.reconnect();
            } else {
                this.mongoClientInstance = mclient;
                this.connected = true;
                this.flush();
                debug("MongoDB connect successfully");
            }
        })
    }

    reconnect() {
        if (this.reconnectTimer) return;

        this.reconnectTimer = setTimeout(()=> {
            this.reconnectTimer = null;
            debug('Reconnecting to the mongoDB');
        }, RETRY_TIMER*1000);
    }

    getInfo() {
        return {
            connectState: this.connected,
            queueLength: this.queue.length
        }
    }

    SAVE2DB(expName, collectionName, iotData) {
        console.log("jump into db saving ***************");
        if(this.connected) {
            this.insertDataToDB(expName, collectionName, iotData);
        } else {
            this.saveDataToQueue({exp: expName, col: collectionName, data: iotData});
        }
    }

    flush() {
        if (debug.enabled) {
            debug('flushing started' + JSON.stringify(this.getInfo()));
        }

        while (this.queue.length > 0 && this.connected === true) {
            let iotItem= this.queue.shift();
            this.insertDataToDB(iotItem.exp, iotItem.col, iotItem.data);
        }

        debug('flushing end' + JSON.stringify(this.getInfo()));

    }

    insertDataToDB(expName, collectionName, iotData) {
        if (debug.enabled) {
            debug(expName, collectionName, JSON.stringify(iotData));
        }

        //let iotObj = JSON.parse(JSON.stringify(iotData))
        //console.log('*************begin saving',expName, collectionName, JSON.parse(JSON.stringify(iotData)));
        this.mongoClientInstance.db(expName).collection(collectionName).insertOne(iotData)
            .then(r => {
                debug("successfully send data to database");
                console.log("successfully send data to database");
            })
            .catch( (error) => {
                debug("fail send data to database");
                console.log("fail send data to database");
                this.saveDataToQueue({exp: expName, col: collectionName, data: iotData});
            })
    }

    saveDataToQueue(iotItem) {
        debug('saving data to queue ********************', iotItem);
        if (this.queue.length > QUEUE_LENGTH) {
            let discarded = this.queue.shift();
            debug('queue is full. discarding data: ' + discarded);
        } else {
            this.queue.push(iotItem);
                debug('saving data to queue ', iotItem);
        }
    }
}


module.exports = MongoDBClient;


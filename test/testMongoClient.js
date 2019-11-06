const MongoClient = require(`../src/database/mongodb/index`);

const mongo = new MongoClient('localhost', '27017');

mongo.SAVE2DB('test', 'test', {id:2});

setTimeout(()=> {
    console.log("20 seconds later")
}, 20000);



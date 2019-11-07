
// load the things we need
const express = require('express');
const app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies



// set the view engine to ejs
app.set('view engine', 'ejs');


// use res.render to load up an ejs view file

// index page
app.get('/', function(req, res) {
    res.render('pages/index');
});

// about page

app.all('/about', function(req, res) {
    if (req.method === 'GET') {
        res.render('pages/about', {
            drinks: [],
        });
    } else {
        console.log(req.method);
        console.log(req.body);


        console.log();
        let drinks = [
            {name: 'Bloody Mary', drunkness: 3},
            {name: 'Martini', drunkness: 5},
            {name: 'Scotch', drunkness: 10}
        ];

        res.render('pages/about', {
            drinks: drinks,
        });
    }

});






app.listen(8080);
console.log('8080 is the magic port');
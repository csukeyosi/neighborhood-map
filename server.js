var express = require("express");
var app = express();
var port = process.env.PORT || 5000;

app.use(express.static(__dirname ));

app.listen(port, function() {
  console.log("Listening on " + port);
});

app.get('/', function(req, res){
    res.sendFile(__dirname  + '/static/public/index.html');
});
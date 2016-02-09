/*********************
 *     LiveBoard     *
 * A live imageboard *
 *********************/
console.log("Starting LiveChan Server...");


//--- Node Modules
var express = require('express');
var app = express();
var siofu = require("socketio-file-upload");
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require("fs");

var jsonfile = require('jsonfile');
var bodyParser = require('body-parser');
var settings = require(__dirname + '/config/settings.json');

//--- Global Variables
var ImageCounter = {};
var tempImage = 0;

//--- Global Functions
function htmlEscape(userPost) {
   return userPost.replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;")
                  .replace(/'/g, "&apos;")
                  .replace(/\"/g, "&quot;")
                  .replace(/\\/g, "&bsol;")
                  .replace(/  /g, " &nbsp;")
                  .replace(/\n/g, "<br/>");
}

function errorPage(req, res) {
    return res.sendFile(__dirname + '/public/errors/404.html');
}

//--- Setup Database
var database = {};
jsonfile.readFile(__dirname + '/database/database.json', function(err, obj) {
    database = obj;
    if (err) {
        console.log('Database errors: '+err);
    }
});

//--- Express Setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(siofu.router);

app.use('/', express.static(__dirname + '/public/'));

app.get('*', errorPage);
app.head('*', errorPage);

//--- Start server
http.listen(process.env.PORT);

io.on('connection', function(socket){
   socket.on('requestData', function(array){
      console.log(array);
      var board = array[0];
      var thread = array[1];
      var post = array[2];
      if (thread && board) {
         var threadd = [];
         if (thread > 0 && thread-1 < database[board].threads.length) {
            threadd.push(database[board].threads[thread-1]);
            socket.emit('receieveData', threadd);
         } else {
            socket.emit('receieveData', ["err", "Not a valid thread"]);
         }
      } else if (board) {
         var sent = {
            "threads":[]
         };
         for (var i  = 0; i < database[board].threads.length; i++) {
            var leg = database[board].threads[i].subPosts.length;
            sent.threads.push({
               "title": database[board].threads[i].title,
               "file": database[board].threads[i].file,
               "content": database[board].threads[i].content,
               "subPosts": [
                  database[board].threads[i].subPosts[leg-3],
                  database[board].threads[i].subPosts[leg-2],
                  database[board].threads[i].subPosts[leg-1]
               ]
            });
         }
         socket.emit('receieveData', sent);
      } else {
         
      }
   });
});
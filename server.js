/*********************
 *     LiveBoard     *
 * A live imageboard *
 *********************/
console.log("Starting LiveChan Server...");


//--- Node Modules
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require("fs");
var jsonfile = require('jsonfile');
var bodyParser = require('body-parser');

//--- Global Variables
var counter = 0;
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

function saveDatabase() {
   jsonfile.writeFile("./database/database.json", database, {spaces: 3}, function(err) {
      if (err) {
         console.error(err);
      }
   });
}

//--- Express Setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

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
         socket.join(database[board].threads[thread].id);
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
            if (database[board].threads[i].subPosts) {
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
         }
         console.log(sent)
         socket.emit('receieveData', sent.subPosts);
      } else {
         
      }
   });
   
   socket.on("files", function(data){
      var file = data.file;
      var ext = data.ext;
      var content = data.content;
      var subject = data.subject;
      var cBoard = data.url[0];
      var cThread = parseInt(data.url[1], 36);
      if (subject && content && file) {
         fs.writeFile("./public/i/"+database.counter.toString(36)+ext, file, function(err){
            if (err) {
               return console.log(err);
            }
         });
         database[cBoard].threads.unshift({
            "title": subject,
            "content": content,
            "file": database.counter.toString(36)+ext,
            "id": (database[cBoard].counter+1).toString(36),
            "subPostCounter": 2,
            "subPosts": []
         });
         database[cBoard].counter++;
         saveDatabase();
      } else {
         if (cThread && cThread-1 < database[cBoard].threads.length && file && content) {
            fs.writeFile("./public/i/"+database.counter.toString(36)+ext, file, function(err){
               if (err) {
                  return console.log(err);
               }
            });
            database[cBoard].threads[cThread-1].subPosts.push({
               "content": content,
               "file": database.counter.toString(36)+ext,
               "id": (database[cBoard].threads[cThread-1].subPostCounterr+1).toString(36)
            });
            io.to(database[cBoard].threads[cThread].id).emit("newPost", {
               "content": content,
               "file": database.counter.toString(36)+ext,
               "id": (database[cBoard].threads[cThread-1].subPostCounter+1).toString(36)
            });
            database[cBoard].threads[cThread-1].subPostCounter++;
            saveDatabase();
         } else if (cThread && cThread-1 < database[cBoard].threads.length && content) {
            database[cBoard].threads[cThread-1].subPosts.push({
               "content": content,
               "id": (database[cBoard].threads[cThread-1].subPostCounter+1).toString(36)
            });
            database[cBoard].threads[cThread-1].subPostCounter++;
            saveDatabase();
            io.to(database[cBoard].threads[cThread].id).emit("newPost", {
               "content": content,
               "id": (database[cBoard].threads[cThread-1].subPostCounter+1).toString(36)
            });
         } else {
            socket.emit("error", "Your post could not be made.");
         }
      }
   });
});
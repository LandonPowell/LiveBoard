/*********************
 *     LiveBoard     *
 * A live imageboard *
 *********************/
 
//--- Node Modules
var io = require('socket.io')();
var fs = require("fs");
var express = require('express');
var multer = require('multer');
var jsonfile = require('jsonfile');
var bodyParser = require('body-parser')
var settings = require('./config/settings.json');
var app = express();

//--- Global Variables
var database = {};
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
    return res.sendFile('./public/errors/404.html');
}

//--- Setup Database
jsonfile.readFile('./database/database.json', function(err, obj) {
    database = obj;
    if (err) {
        console.log('Database errors: '+err);
    }
});

//--- Config Multer
var storage = multer.diskStorage({
   destination: function (req, file, callback) {
      callback(null, 'temp/');
   },
   filename: function (req, file, callback) {
      tempImage++;
      var ext = file.originalname.split(".");
      ext = ext[ext.length-1];
      if (settings.filetypes.indexOf(ext.toLowerCase()) > -1) {
         callback(null, tempImage+'.'+ext);
      } 
      else {
         return false;
      }
   }
});
var upload = multer({ 
    storage: storage,
    onFileUploadStart: function(file, req, res){
        res.redirect(req.files.file.path);
    }
});

//--- Express Setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
})); 
app.use('/', express.static(__dirname + '/public/'));

app.post('/upload', upload.single('file'), function(req, res){
   var subject = req.body.userSubject;
   var post = req.body.userPost;
   res.send(subject + ": " + post);
   // res.redirect(req.file.filename);
   res.status(204).end();
});


/*app.get('/rand', function(req, res) {
   var board = req.param('board');
   var thread = req.param('thread');
   //var post = req.param('post');
   var pID = parseInt(thread, 36)-1;
   if (board)
   if (thread) {
      if (pID < database[board].threads.length) {
         res.send(database[board].threads[pID]);
      } else {
         res.send("No thread.");
      }
   } else {
      var send = [];
      for (var i = 0; i < database[board].threads.length; i++) {
         send.push(database[board].threads[i].title);
      }
      res.sendFile(__dirname+'/index.html');
   }
});*/

app.get('*', errorPage);
app.head('*', errorPage);

//--- Start server
app.listen(process.env.PORT);

io.on('connection', function(socket){
   socket.on('requestData', function(array){
      var board = array[0];
      var thread = array[1];
      var post = array[2];
      if (thread && board) {
         if (thread > 0 && thread-1 < database[board].threads.length) {
            socket.emit('receieveData', ["2", database[board].threads[thread-1]]);
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
         socket.emit('receieveData', ["1", sent]);
      } else {
         
      }
   });
});
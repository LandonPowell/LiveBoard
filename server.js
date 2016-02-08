/*********************
 *     LiveBoard     *
 * A live imageboard *
 *********************/
 
// Node Modules
var io = require('socket.io')();
var express = require('express');
var multer = require('multer');
var jsonfile = require('jsonfile');
var settings = require('./settings.json');
var app = express();

// Global Variables
var database = {};
var ImageCounter = {};
var tempImage = 0;

// Global Functions
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

// Setup Database
jsonfile.readFile('database.json', function(err, obj) {
    database = obj;
    if (err) {
        console.log('Database errors: '+err);
    }
});

// Config Multer
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

// File upload
app.use('/', express.static(__dirname + '/public/'));

app.post('/upload', upload.single('file'), function(req, res){
   res.redirect(req.file.filename);
   res.status(204).end();
});


app.get('/rand', function(req, res) {
   var board = req.param('board');
   var thread = req.param('thread');
   //var post = req.param('post');
   var pID = parseInt(thread, 36)-1;
   if (thread) {
      if (pID < database[board].threads.length) {
         res.send(database[board].threads[pID]);
      } else {
         res.send("No thread.");
      }
   } else {
      var send = "<script>var threadTitles = [";
      for (var i = 0; i < database[board].threads.length; i++) {
         send += '"'+database[board].threads[i].title+'"';
         if (i < database[board].threads.length-1) {
            send += ", ";
         }
      }
      send += "]</script>";
      res.send(send);
   }
});

// Start server
app.listen(process.env.PORT);
/*********************
 *     LiveBoard     *
 * A live imageboard *
 *********************/
 
// Node Modules
var io = require('socket.io')();
var express = require('express');
var multer = require('multer');
var settings = require('settings.json');
var app = express();

// Global Variables
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

// Config Multer
var storage = multer.diskStorage({
   destination: function (req, file, callback) {
      callback(null, 'temp/');
   },
   filename: function (req, file, callback) {
      tempImage++;
      var ext = file.originalname.split(".")[this.length-1];
      if (settings.filetypes.indexOf(ext) > -1) {
         callback(null, tempImage+'.'+ext);
      } else {
         return false;
      }
   }
});


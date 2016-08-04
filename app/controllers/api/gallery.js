var express = require('express');

// Models
var User = require('../../models/user');
var jwt = require('jsonwebtoken');
var multer  = require('multer');
//helpers
var helpers = require('../../helpers/controllers');
var modelHelpers = require('../../helpers/gallery');
var commonHelpers = require('../../helpers/common');
var fs = require('fs');
module.exports = function (app) {
    app.post('/gallery/upload', function (req, res) {
        //modelHelpers.UploadFile(req, res);
    if(req.query.folderName) {
        var file_name;
        var username;
        var newDestination;
        var folderName;
        var upload = multer({ //multer settings
          storage: multer.diskStorage({ //multers disk storage settings
            destination: function (req, file, cb) {
                folderName = req.query.folderName;
                newDestination =  './app/uploads/'+folderName+'/';
                console.log(req.query);
                console.log(newDestination);
                var stat;
                try {
                    stat = fs.statSync(newDestination);
                } catch (err) {
                    fs.mkdirSync(newDestination);
                }
                if (stat && !stat.isDirectory()) {
                    throw new Error('Directory cannot be created because an inode of a different type exists at "' + dest + '"');
                }
                
                cb(null, newDestination);      
            
              
            },
            filename: function (req, file, cb) {
               
              var datetimestamp = Date.now();
              var file_original_name = file.originalname;
              var file_new_name = file_original_name.replace(/\s+/g, '-').toLowerCase();

              var prefix = file_new_name.split(".")[0];

              file_name = prefix+ '-'+ datetimestamp +'.'+file_new_name.split('.')[file.originalname.split('.').length -1];
              cb(null, file_name);
            }
          })
        }).single('file');

        upload(req, res, function(err){
          //done uploading or error occured
          console.log(req.body);
        
          
          if(err) return res.json({"success": false, "error": err});
          else{
            // return res.json({"success": true, "data": file_name});
            
            var params = req.body;
            modelHelpers.UploadFile(params, file_name, res, app);
            
          }//else of file upload

      });
    }//if
     else {
        res.json({"success": false, "error": "folderName is not present"});
     }
    });

    

    app.get('/gallery/get', function (req, res) {
       
        var id = req.query.id;
        console.log(id);
        modelHelpers.getList(id, res);
    });

    app.post('/gallery/remove', function (req, res) {
        var data = req.body;
        modelHelpers.RemoveFile(data, res);
    });

   
}

var express = require('express');
var fileUpload = require('../services/upload');
var router = express.Router();
var User = require('../models/users');
var UserCount = require('../models/signupCount')
var TextDb = require('../models/textDb')
var node_xj = require("xls-to-json");
var fs = require('fs');
const { check, validationResult } = require('express-validator');
const passport = require('passport');
const bcrypt = require('bcrypt');
var counters = require('redis-counter').createCounters({redisUrl: 'redis://user:password@host:port/database'});

/* GET users listing.
 */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});


// upload a xlsx file and update the mongoDb with username and password
router.post('/batchCreateUsers', fileUpload.upload.single('file'), function (req, res) {
  console.log(req.file.destination + '/' + req.file.filename);
  node_xj({ input: req.file.destination + '/' + req.file.filename, }, function (err, result) {
    if (err) {
      console.log(err)
    } else {
      console.log(result)
      var dup = false
      result.forEach( async (element) => {
        var isPresent  = await User.find({
          "username":element["username"]
        });
        if(isPresent.length){
          dup = true
        } else {
          var userElement = new User(element);
          userElement.save().then(data => {
            console.log(data)
          }).catch(error => {
            console.log(error)
          });
        }
      });
    }
  });
  fs.unlinkSync(req.file.destination + '/' + req.file.filename)
  res.sendStatus(200);
});

// endpoint for the user login with passport and validation middlewares
router.post('/login',
  check('username').notEmpty(),
  check('password').notEmpty(),
  passport.authenticate('local'),
  async function (req, res) {
    const errorRes = validationResult(req);
    if (!errorRes.isEmpty()) {
      res.send('username and password cant be empty!!');
    }
    res.send('login successful !');
  })

// endpoint for user registration with validation middleware
router.post('/signup',
  check('username').notEmpty(),
  check('password').notEmpty(),
  async function (req, res) {
    const username = req.body.username;
    const pwd = req.body.password;
    const errorRes = validationResult(req);
    if (!errorRes.isEmpty()) {
      res.send('username and password cant be empty!!');
    } else {
      const userPresent = await User.find({
        "username": username,
      })
      if (userPresent.length) {
        res.send("user already registered")
      } else {
        const salt = await bcrypt.genSalt();
        const hashedpwd = await bcrypt.hash(pwd, salt)
        const newUser = new User({
          "username": username,
          "password": hashedpwd,
        });
        //const isPresent = 
        newUser.save().then(data => {
          res.send('user registered');
          counters('requests').increment();
        }).catch(error => {
          res.send('cant register user. Try Again later !!');
        })
      }
    }
  })

// endpoint for text search without using mongodb regex
router.post('/textsearch',async function(req, res){
  const text = req.body.text;
  const result = await TextDb.find({
    $text: {
      $search: text
    }
  });
  res.send(result)
})

module.exports = router;

/*global require, __dirname, console*/
var express = require('express'),
  bodyParser = require('body-parser'),
  errorhandler = require('errorhandler'),
  morgan = require('morgan'),
  net = require('net'),
  N = require('../basic_example/nuve'),
  fs = require("fs"),
  https = require("https"),
  config = require('./../../licode_config');
var iwom_config = require('./../../3iwom_config/config');
console.log(iwom_config);
var options = {
  // key: fs.readFileSync('../../cert/2_pro.3iwom.com.key').toString(),
  // cert: fs.readFileSync('../../cert/1_pro.3iwom.com_bundle.crt').toString()
  key: fs.readFileSync('./../../cert/' + iwom_config.cert.key).toString(),
  cert: fs.readFileSync('./../../cert/' + iwom_config.cert.cert).toString()
};

var app = express();

// app.configure ya no existe
"use strict";

// KX 能否用line 101替换？
app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  res.header("X-Powered-By", ' 3.2.1')
    //res.header("Content-Type", "application/json;charset=utf-8");
  next();
});


app.use(errorhandler({
  dumpExceptions: true,
  showStack: true
}));
app.use(morgan('dev'));
app.use(express.static(__dirname + '/../basic_example/public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

//app.set('views', __dirname + '/../views/');
//disable layout
//app.set("view options", {layout: false});

N.API.init(config.nuve.superserviceID, config.nuve.superserviceKey, 'http://localhost:3000/');

/*
var myRoom;

N.API.getRooms(function(roomlist) {
    "use strict";
    var rooms = JSON.parse(roomlist);
    console.log(rooms.length); //check and see if one of these rooms is 'basicExampleRoom'
    for (var room in rooms) {
        if (rooms[room].name === 'basicExampleRoom'){
            myRoom = rooms[room]._id;
        }
    }
    if (!myRoom) {

        N.API.createRoom('basicExampleRoom', function(roomID) {
            myRoom = roomID._id;
            console.log('Created room ', myRoom);
        });
    } else {
        console.log('Using room', myRoom);
    }
});
*/


app.get('/getRooms/', function(req, res) {
  "use strict";
  N.API.getRooms(function(rooms) {
    res.send(rooms);
  });
});

app.get('/getUsers/:room', function(req, res) {
  "use strict";
  var room = req.params.room;
  N.API.getUsers(room, function(users) {
    res.send(users);
  });
});

var roomMaster = {};
app.post('/createToken/', function(req, res) {
  "use strict";
  var room = req.body.room_id,
    username = req.body.username,
    role = req.body.role,
    userId = req.body.user_id;

  console.log("room : ", room);

  if (!roomMaster[room]) {
    roomMaster[room] = userId;
  }

  N.API.getRooms(function(roomlist) {
    "use strict";
    var rooms = JSON.parse(roomlist);
    console.log(rooms.length); //check and see if one of these rooms is 'basicExampleRoom'
    var hasCreate = false;
    var room_id;
    for (var _room in rooms) {
      if (rooms[_room].name === room) {
        hasCreate = true;
        room_id = rooms[_room]._id;
      }
    }

    if (!hasCreate && roomMaster[room] === userId) {
      N.API.createRoom(room, function(roomID) {
        // myRoom = roomID._id;
        console.log('Created room ', roomID._id);
        N.API.createToken(roomID._id, username, role, function(token) {
          console.log("token : ", token);
          return res.json({ token: token, role: 'master' });
        });
      });
    } else {
      N.API.createToken(room_id, username, role, function(token) {
        console.log("token : ", token);
        if (roomMaster[room] === userId) {
          return res.json({ token: token, role: 'master' });
        } else {
          return res.json({ token: token, role: 'slave' });
        }
      });
    }

  });
});

app.get('/clearMaster', function(req, res) {
  var roomId = req.query.room_id;
  delete roomMaster[roomId];
  return res.end();
});


app.use(function(req, res, next) {
  "use strict";
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, DELETE');
  res.header('Access-Control-Allow-Headers', 'origin, content-type');
  if (req.method == 'OPTIONS') {
    res.send(200);
  } else {
    next();
  }
});



app.listen(3001);

var server = https.createServer(options, app);
server.listen(3004);
var express = require("express");
var router = express.Router();
const redis = require("redis");
const bluebird = require("bluebird");
bluebird.promisifyAll(redis);

const client = redis.createClient();

client.on("error", function(error) {
  console.error(error);
});

module.exports = function(io) {

  io.sockets.on("connection",function(socket){

    socket.on('online',(data)=>{
      socket.broadcast.emit('onStatus',data);
    })
    socket.on('offline',(data)=>{
      socket.broadcast.emit('onStatus',data);
    })
    socket.on('typing',(data)=>{
      socket.broadcast.emit('onStatus',data);
    })
    socket.on('chat message', async function(score){
      console.log(score);
     socket.broadcast.emit('chat message', score);
      await client.HMSET('live','run',score);
    });

    socket.on('send_private_msg',function(data){
      io.sockets.emit('send', data);
    })

  })
  /* GET home page. */
  router.get("/", async function(req, res, next) {
    res.render("Login");
  });
  
  router.post("/", async function(req, res, next) {
    try {
      req.session.username = req.body.name;
      await client.lpush("userlist", req.session.username);

      io.sockets.on("connection", function(socket) {
        socket.join(req.session.username, function() {
          console.log("Current rooms: ", socket.rooms);
        });
        io.emit("join_msg", {
          msg: "you are Join Room" + req.session.username
        });
      });
      res.redirect("/chat");
    } catch (e) {
      console.log("Error", e);
    }
  });

  router.get("/football", async function(req, res, next) {
    res.render("football", { title: "Express", run: 125 });
  });

  router.get("/chat", async function(req, res, next) {
    let userlist_len = await client.llenAsync("userlist");
    let userlist = await client.lrangeAsync("userlist", 0, userlist_len - 1);
    res.render("chat", { req: req, session: req.session, userlist: userlist });
  });
  return router;
};

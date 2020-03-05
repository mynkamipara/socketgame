var express = require("express");
var router = express.Router();
const redis = require("redis");
const bluebird = require("bluebird");
bluebird.promisifyAll(redis);
const client = redis.createClient();

module.exports = function(io) {
  io.sockets.on("connection", function(socket) {
    console.log("a user connected");

    socket.on("clientcall", async function(data) {
      let usercordinate = await client.getAsync(data.name);
      usercordinate = JSON.parse(usercordinate);
      let newCordinate = cordinateUpdate(usercordinate, data.action);
      await client.setAsync(
        data.name,
        `{"posx":${newCordinate.posx},"posy":${newCordinate.posy}}`
      );
      io.sockets.emit("positioncall", data);
      /*  io.to('mk5').emit("positioncall", data); */
    });

    socket.on("adduser", async data => {
      await client.saddAsync("emojilist", data.user);
      var posx = 25; /* (Math.random() * 909).toFixed() */
      var posy = 25; /* (Math.random() * 637).toFixed() */
      data["posx"] = posx;
      data["posy"] = posy;

      await client.setAsync(data.user, `{"posx":${posx},"posy":${posy}}`);
      io.sockets.emit("newuser", data);
    });

    socket.on("wincall", async data => {
      let winner_name = data.name;
      await client.set("win", winner_name, () => {
        io.sockets.emit("wincallbroadcast", winner_name);
      });
    });

    socket.on("disconnect", function() {
    });

   /*  io.on("connection", function(socket) {
      socket.join("mk57", function() {
        console.log("Current rooms: ", socket.rooms);
      });
    });
    io.emit("join_msg", { msg: "you are Join Room" }); */
  });

  /* GET users listing. */
  router.get("/", function(req, res, next) {
    res.send("respond with a resource");
  });

  router.get("/game", async function(req, res, next) {
    let CreateUserList = [];
    let conneted_user_list = await client.smembersAsync("emojilist");
    let recentwin = await client.getAsync("win");
    await Promise.all(
      conneted_user_list.map(async user => {
        let UserJson = {};
        UserJson.name = user;
        let cordinate = await client.getAsync(user);
        cordinate = JSON.parse(cordinate);
        UserJson.position = cordinate;
        CreateUserList.push(UserJson);
      })
    );

    res.render("game", {
      req: req,
      session: req.session,
      CreateUserList: CreateUserList,
      recentwin: recentwin
    });
  });

  router.post("/game", async function(req, res, next) {
    req.session.username = req.body.session_name;
    io.on("connection", function(socket) {
      socket.join(req.session.username, function() {
        console.log("Current rooms: ", socket.rooms);
      });
    });
    res.redirect("/users/game");
  });

  return router;
};

//call for Cordinate Change and Update in Redis
function cordinateUpdate(usercordinate, action) {
  let trans_digit = 50;
  if (action.go === "top") {
    usercordinate.posx =
      action.digit === "+=50"
        ? usercordinate.posx + trans_digit
        : usercordinate.posx - trans_digit;
    return usercordinate;
  } else if (action.go === "left") {
    usercordinate.posy =
      action.digit === "+=50"
        ? usercordinate.posy + trans_digit
        : usercordinate.posy - trans_digit;
    return usercordinate;
  }
}

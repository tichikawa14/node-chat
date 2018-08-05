
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , io = require('socket.io')
  , multer = require('multer');

var fs = require('fs');

var app = express();
var server = http.createServer(app);
var io = io.listen(server);
var IMAGE_DIR = path.join(__dirname, 'public', 'images');


// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');  //テンプレートエンジンとしてejsを設定
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', function(req,res){
  res.render('index',{
    title: 'ChatRoom'
  });
});




server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


var count = 0;
var roomList = new Object();
var files;

io.sockets.on('connection', function(socket) {
  console.log("connected");
  console.log(roomList);
  count++;
  io.sockets.emit('count', count);
  var storage = multer.diskStorage({
  // ファイルの保存先を指定
  destination: './public/uploads',
  // ファイル名を指定(オリジナルのファイル名を指定)
  filename: function (req, file, cb) {
    cb(null, file.originalname);
    files = file.originalname;
  }
})
const uploader = multer({ storage });


app.post( '/file_upload', uploader.array( 'select_files' ),
  function( request, response ) {
    console.log(socket.id);
    io.sockets.socket(socket.id).emit('msg push', {files: files});
    response.json({status:0});
});

  socket.on("enter", function(rname){

    //clientがjoinしているroom名を取得する
    var rooms = io.sockets.manager.roomClients[socket.id];

    //keyを取り出す
    var roomsn = Object.keys(rooms);

    roomsn.forEach(function(room){

      //default('')以外に空でないroomsn要素があるとき
      if(roomsn[1] && room !==''){

        //スラッシュをとる
        room = room.replace(/\//, '');

        //そのroomから退室する
        socket.leave(room);
        roomList[room]--;

        //人数が0人以下になったらroomListから削除
        if(roomList[room] <= 0){
          delete roomList[room];
          console.log(room + 'は削除されました');
        }
      }
    });

    //roomListを確認
    if(!roomList[rname]){
      roomList[rname] = 1;
    }else{
      roomList[rname]++;
    }

    //roomにjoin
    socket.join(rname);

    //roomListを更新
    io.sockets.emit("roomList",roomList);

  });


  socket.on('msg post', function(msg) {

    //clientがjoinしているroom名を取得する
    var rooms = io.sockets.manager.roomClients[socket.id];

    //keyを取り出す
    var roomsn = Object.keys(rooms);

    //clientがデフォルト以外のどのroomにもjoinしていないときは、全員に送信
    if(!roomsn[1] && roomsn[0] ===''){
      io.sockets.emit('msg push', {name: msg.name, text: msg.text});
    }else{
      roomsn.forEach(function (room){
        //clientがroomにjoinしているときは、そのroomに送信
        if(room !==''){
          //スラッシュをとる
          room = room.replace(/\//, '');
          io.sockets.to(room).emit('msg push', {name: msg.name, text: msg.text});
          
        }
      });
    }
  });


//切断した時の処理
  socket.on('disconnect', function(){
    //接続人数を-1して送信
    count--;
    io.sockets.emit('count', count);

    //clientが接続しているroom名を取得
    var rooms = io.sockets.manager.roomClients[socket.id];

    //keyを取り出す
    var roomsn = Object.keys(rooms);

    //roomの人数を-1
    roomsn.forEach(function(room){
      if(room !==''){
        //スラッシュをとる
        room = room.replace(/\//,'');
        //人数を-1
        roomList[room]--;

        //人数が0人以下になったらroomListから削除
        if(roomList[room] <= 0){
          delete roomList[room];
        }
      }
    });

    //roomListの更新
    io.sockets.emit('roomList', roomList);

  });

});

$(function(){
  var socket = io.connect();

  $("#select_button").on("click",function(e){ $("#file_dialog").click(); });
  $("#upload_button").on("click",function(e){
    //upload
    var fd = new FormData( $('#upload_form')[0] );
    $.ajax({
        url: '/file_upload',
        type: 'post',
        data: fd,
        processData: false,
        contentType: false,
    }).done( function( res, status, xhr ){
        if( res.status == 0 ){
            alert("file uploading done.");
        }else{
            alert("file uploading failed.");
        }
    });
});

  //接続確認
  socket.on('connect',function(){
    console.log('connected.');
    socket.on('count', function(data){
      $('#count').text(data);
    });

    //メッセージを受信
    socket.on('msg push', function(msg){
      // $('#img').attr("src", msg.text);
      // $('#imgtitle').html(msg.text);
      if(msg.files == null){
        $('#list').prepend($("<dt>" + new Date() + "</dt><p>" + msg.name + ":" + msg.text + "</p><hr>"));
      } else {
        $('#list').prepend($("<img src=/uploads/" + msg.files + "><hr>"));
      }
      
    });

  });

  //メッセージを送信
  $('#comment_form').on('submit',function(){
    var name = $('#name').val();
    var text = $('#text').val();
    if(text && name){

      socket.emit('msg post',{name: name, text: text});
      $('#text').val('');
    };
  });

  socket.on("roomList", function(roomList){
    $("#list-box").text("");
    if(roomList){
      Object.keys(roomList).forEach(function(rname){
        console.log(rname + "," + roomList[rname] + "人");
        $("#list-box").append("ルーム『"+ rname + "』に" + roomList[rname] +"人います<br>");
      });
    }
  });


//サーバーに入るルーム名を送信
  $('#room_form').on('submit', function(){
    var name = $("#enter").val();
    socket.emit("enter", name);
  });


});

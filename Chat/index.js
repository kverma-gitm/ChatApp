var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Chat=require('./chatLog.js');
var mongoose=require('mongoose');
var responseGenerator = require('./libs/responseGenerator');
var chatModel=mongoose.model('Chats');
var chatMessage="";
var oldMessages=[];



app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});




io.on('connection', function(socket){
//socket.broadcast.emit('chat message', 'A new user has just joined the chat');

  socket.on('user',function(data){
    console.log(data+ " came online");
    socket.broadcast.emit('chat message', data+" login just now");
    // you can allocate variables in socket.
    socket.user = data;
    loadHistory(socket.id);


  });

  socket.on('chat message', function(msg){
    io.emit('chat message', socket.user+' : '+msg);
    saveMessage(msg,socket.user);

  });

  //Listener for typing events
  socket.on('typing', function(msg){

    //Broadcast to clients if user is typing
    socket.broadcast.emit('typing', socket.user+" is typing");
  });

    //Listener to clear typing event
  socket.on('clear typing', function(msg){

    //Broadcast to clients that user isn't typing
    socket.broadcast.emit('clear user is typing',socket.user);
  });

  //Message After disconnecting

  socket.on('disconnect',function(){
  	 
  	 console.log("some user left the chat");
     socket.broadcast.emit('chat message', socket.user+" logged out ");
  	  


  }); //end socket disconnected
  

  //Listener for loading history
  socket.on('load-history',function(data){
    console.log(data+" is requesting history");

    //Emit history to the current client
    io.to(socket.id).emit('show-history',oldMessages);
  });

  //Delete Chat History
   socket.on('clear chat', function(){
		deleteHistory(socket.id);

   });


});


//Chat History Code functions

//Function to save each chat message
var saveMessage=function(message,userName){
  var newMessage = new chatModel({userName : userName,userMessage: message});
  newMessage.save(function(err){
      if(err){

          var myResponse = responseGenerator.generate(true,"some error"+err,500,null);
          console.log(myResponse);
      }
      else{

          var myResponse = responseGenerator.generate(false,"Saved Message",200,newMessage);
          console.log(myResponse);
      }

  });//end new mesage save
};

//Function to load history
var loadHistory = function(id){

    //Find all chats in the chat model
    chatModel.find({},function(err,history){
      if(err){
                var myResponse = responseGenerator.generate(true,"Some error"+err,500,null);                
                console.log(myResponse);
            }
            else{

                //Save chat messages array in oldMessages variable
                console.log("Loading History");
                oldMessages=history;
            }
    });
};

//Function to delete history if required
var deleteHistory = function(id){
    chatModel.remove({},function(err,history){
      if(err){
                var myResponse = responseGenerator.generate(true,"Some error"+err,500,null);                
                console.log(myResponse);
            }
            else{
                console.log("History Deleted");
            }
    });
};


http.listen(3000, function(){
  console.log('listening on :3000');
});



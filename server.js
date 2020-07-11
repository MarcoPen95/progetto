const express = require('express');// carico modulo express
const path = require('path');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');  //per accedere ai campi della form
const mongoose = require('mongoose');    //database
const passport = require('passport'); 
const methodOverride = require('method-override'); 
const session = require('express-session'); // necessario per flash
const flash = require('connect-flash');
const amqp = require('amqplib/callback_api');
const app = express();

const http = require('http').Server(app);
const io = require('socket.io')(http);




//carico moduli
require('./models/Utente');
require('./models/Evento');


//configurazione passport
require('./config/passport')(passport);



//carico le routes
const index = require('./routes/index');
const auth = require('./routes/auth');
const eventi = require('./routes/eventi');
const chat = require('./routes/chat');

//load keys
const keys = require('./config/keys.js');

//handlebars helpers
const {
  stripTags,
  formatDate
} = require('./helpers/hbs');







/********************************************************************************************************/
/*                     WebSocket and AMQP connection to handle CHAT and NOTIFIES                        */
/********************************************************************************************************/
io.on('connection', function(socket){

  // Handle notify event
  socket.on('notify', function(data){
    console.log("dentro al notify");
    console.log(data);
      if(data != ''){
        amqp.connect(keys.ampqURI, function(err, conn) {
          conn.createChannel(function(err, ch) {
          var ex = 'notify';
              ch.assertExchange(ex, 'topic', {durable: false});

              ch.assertQueue(data, {exclusive: false}, function(err, q) {
                  console.log(" notify ->[*] Waiting for messages in %s", q.queue);
                  io.emit(data+"ack");  //Ack to sure the connection
                  ch.bindQueue(q.queue, ex, data);
                  ch.bindQueue(q.queue, ex, "all");
                  ch.consume(q.queue, function(msg) {
                    console.log("......."+ data);
                    io.emit(data, msg.content.toString());
                    console.log(" [x] %s", msg.content.toString());
                  }, {noAck: true});
              });
          });
        });
      }
  });


  // Download all prev messages
  socket.on('chatstart', function(data){
    if(data != ''){
      amqp.connect(keys.ampqURI, function(err, conn) {
        conn.createChannel(function(err, ch) {
        var ex = 'chat';
            ch.assertExchange(ex, 'topic', {durable: false});

            ch.assertQueue("chat"+data, {exclusive: false}, function(err, q) {
                console.log(" [*] Waiting for messages in %s", q.queue);
                ch.bindQueue(q.queue, ex, 'chat');
                ch.consume(q.queue, function(msg) {
                  io.emit("chat"+data, msg.content.toString());
                  //console.log(" [x] %s", msg.content.toString());
                }, {noAck: false});
            });
        });
        setTimeout(function() { conn.close();}, 3000);
      });
    }
  });

  // Handle message event
  socket.on('chat', function(msg){
    io.emit('chat', msg);
    // Send chat message to the main queue
    amqp.connect(keys.ampqURI, function(err, conn) {
      conn.createChannel(function(err, ch) {
        var ex = 'chat';
        var key = 'chat';
        ch.assertExchange(ex, 'topic', {durable: false});
        ch.publish(ex, key, new Buffer.from('<p><strong>' + msg.handle + ': </strong>' + msg.message + '</p>'));
      });
      setTimeout(function() { conn.close();}, 2000);
    });
  });

  // Handle typing event
  socket.on('typing', function(data){
    socket.broadcast.emit('typing', data);
  });

});



















// Map global promise - get rid of warning
mongoose.Promise = global.Promise;
//connect to mongoose
mongoose.connect(keys.mongoDB, {
    useNewUrlParser: true
  })
    .then(() => console.log('MongoDb Connected..'))      //use promise instead of callbacks for cleaner code
    .catch(err => console.log(err));


    
app.engine('handlebars',exphbs({ 
  helpers:{
    stripTags: stripTags,
    formatDate: formatDate

  },
  defaultLayout: 'main'}));
app.set('view engine','handlebars');



//body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(methodOverride('_method'));




//express session middleware
app.use(session({
  secret: 'pennacchia',
  resave: true,
  saveUninitialized: true
}));


//passport middleware
app.use(passport.initialize());
app.use(passport.session());


//flash middleware
app.use(flash());
// Set global vars (for navbar and error messages)
app.use(function(req, res, next){
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});






//app.use(express.static('images'));


app.use(express.static(path.join(__dirname, 'public')));


app.use('/',index); // uso la route.
app.use('/auth',auth); // uso la route.
app.use('/eventi',eventi);
app.use('/chat',chat); //uso la route


const port = process.env.PORT || 3000;

http.listen(port,()=>{
    console.log(`Server è partito su porta ${port}`);
});





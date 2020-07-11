const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Evento = mongoose.model('eventi');
const utente = mongoose.model('utenti');
const {ensureAuthenticated} = require('../helpers/auth');
const path = require('path');
//const multer = require('multer');
const fs = require('fs');
const amqp = require('amqplib/callback_api');
const keys = require('../config/keys.js');
//const geocoder = require('../utils/geocoder');
//const keys = require('../config/keys.js');
const NodeGeocoder = require('node-geocoder');
 

 







// Show Single event
router.get('/show/:id', (req, res) => {
  Evento.findOne({
    _id: req.params.id
    })
    .populate('creatore')     //to access creator info
    .then(evento => {
      res.render('eventi/show', {
        evento:evento
      });
    });
});



// route ricerca annunci
router.post('/ricerca', ensureAuthenticated, (req,res) => {
  //trova gli annunci creati dall'utente
    console.log(req.user);
    console.log(req.body.titolo);
    //console.log(req.body.descrizione);
    console.log(req.body.categoria);
    //console.log(req.user.annunci);
    
    
   Evento.find({$and :[{citta: req.body.citta },{categoria: req.body.categoria},{venditore:{ $ne: req.user}}]})
    .populate('eventi')
    .then(eventi_trovati => {
      console.log("eventi cercati");
      res.render('eventi/eventi_trovati', {
        eventi_trovati: eventi_trovati
      });
    })
});






// annunci route
router.get('/mieiEventi', ensureAuthenticated, (req,res) => {
  //trova gli annunci creati dall'utente

   Evento.find({
    creatore: req.user.id
    })
    .then(mieieventi => {

      utente.findOne({
        _id:req.user.id
      })
      .populate('eventi')
      .then(utentetrovato => {
        res.render('eventi/mieiEventi', {
          mieieventi:mieieventi,
          eventsjoined: utentetrovato.eventi
        });
      })
    })
});




// Crea evento route
router.get('/crea_Evento',ensureAuthenticated,(req,res) => {
  res.render('eventi/crea_Evento');
})


//rindirizzo alla form di edit dell'annuncio

router.get('/modifica_Evento/:id', ensureAuthenticated, (req,res) => {
  Evento.findOne({
    _id: req.params.id
    })
    .then(evento => {
      res.render('eventi/modifica_Evento', {
        evento: evento
      });
    });
})


//upload
// aggiunta di un annuncio
router.post('/crea_Evento',(req,res) => {
  
  
  let errors = [];

  //console.log(req.body.file);
  //server side validation
  if(!req.body.categoria){
    errors.push({text:'scegli una categoria '});
  }
  if(!req.body.titolo){
    errors.push({text:'scegli un titolo'});
  }
  console.log(errors);
  if(errors.length > 0){
    res.render('eventi/crea_Evento', {
      errors: errors,
      categoria: req.body.categoria,
      titolo: req.body.titolo,
      descrizione: req.body.descrizione,
    });
  } else{




    const nuovoEvento = new Evento();
    nuovoEvento.categoria= req.body.categoria;
    nuovoEvento.titolo =  req.body.titolo;
    nuovoEvento.descrizione =  req.body.descrizione;
    nuovoEvento.data =  req.body.data + ' ' + req.body.time;
    nuovoEvento.creatore = req.user.id;
    nuovoEvento.immagine = req.body.immagine;
    nuovoEvento.indirizzo = req.body.indirizzo;
    var stringa = req.body.indirizzo;
    var n = stringa.indexOf(",");
    var result = stringa.substring(n+1);
    nuovoEvento.citta = result;

    
    
    nuovoEvento.save().then(evento => {
        console.log("evento creato");
        req.user.save();
        res.redirect('/eventi/mieiEventi');
      })
      console.log("sono qui");
          // Send a notify to all users
      amqp.connect(keys.ampqURI,function(err,conn){
        conn.createChannel(function(err, ch) {
          var ex = 'notify';
          var key = "all";
          var msg = "The event '"+ req.body.titolo + "' has been created";
          console.log(msg);
          ch.assertExchange(ex, 'topic', {durable: false});
          ch.publish(ex, key, new Buffer.from(msg));
        });
        setTimeout(function() { conn.close();}, 500);
      });
  }
});





//modifica dell'annuncio

router.put('/:id',(req, res) => {
  Evento.findOne({
    _id: req.params.id
    })
    .then(evento => {
      let errors = [];
      
      console.log(req.body.categoria);

      //server side validation
      if(!req.body.categoria){
        errors.push({text:'aggiungi una categoria'});
      }
      if(!req.body.titolo){
        errors.push({text:'aggiungi un titolo'});
      }
      if(!req.body.descrizione){
        errors.push({text:'aggiungi una descrizione'});
      }
      console.log(req.body.titolo);
      console.log(errors);
      console.log("___________________");
      console.log(req.body.descrizione);
      if(errors.length > 0){
        res.render('eventi/crea_Evento', {
          errors: errors,
          categoria: req.body.categoria,
          titolo: req.body.titolo,
          descrizione: req.body.descrizione,
        });
      } else {
        evento.categoria = req.body.categoria;
        evento.titolo = req.body.titolo;
        evento.descrizione = req.body.descrizione;
        evento.venditore = req.user.id;        
        evento.data = req.body.data + ' ' + req.body.time;
        evento.immagine = req.body.immagine;

        for(i = 0; i < evento.partecipanti.length; i++){
          utente.findOne({
            _id: evento.partecipanti[i]._id
          }).then(user => {
            if(user._id.toString() != evento.creatore._id.toString()){
              // Send a notify to all joiners
              amqp.connect(keys.amqpURI, function(err, conn) {
                conn.createChannel(function(err, ch) {
                  var ex = 'notify';
                  var key = user.email;
                  var msg = "The event '" + req.body.descrizione + "' has been edited";
                  ch.assertExchange(ex, 'topic', {durable: false});
                  ch.publish(ex, key, new Buffer.from(msg));
                });
                setTimeout(function() { conn.close();}, 500);
              });
            }
          });
        }


        evento.save()
        .then(evento => {
          req.flash('success_msg', 'Evento aggiornato');
          res.redirect('/eventi/mieiEventi');
        })
      }
    });
});



//partecipa all'evento
router.put('/partecipa/:id', (req, res) => {
  console.log("sto cercando l'evento");
  Evento.findOne({
    _id: req.params.id
    })
    .then(evento => {
      //check if already joined
      utente.findOne({
        _id: req.user.id
      })
      .then(user => {
        if (user.eventi.indexOf(evento._id) != -1){
          req.flash('error_msg', 'Already joined');
          res.redirect('/eventi/mieiEventi');
        } else {
          //to add in both user (events) list and event (joiners) list
          evento.partecipanti.push(req.user.id);
          user.eventi.unshift(evento);
          user.save();

          //to send a notify to event's creator
          utente.findOne({
            _id: evento.creatore._id
          })
          .then(user2 => {
            if(user._id.toString() != evento.creatore._id.toString()){
              // Send a notify to event's creator
              amqp.connect(keys.ampqURI, function(err, conn) {
                conn.createChannel(function(err, ch) {
                  var ex = 'notify';
                  var key = user2.email;
                  var msg = req.user.nome + " " + req.user.cognome + " has joined your event '" + evento.descrizione + "'";
                  console.log(msg);
                  ch.assertExchange(ex, 'topic', {durable: false});
                  ch.publish(ex, key, new Buffer.from(msg));
                });
                setTimeout(function() { conn.close();}, 500);
              });

              
            }
          });

          evento.save()
            .then(evento => {
              req.flash('success_msg', 'Event joined');
              res.redirect('/eventi/mieiEventi');
            });
        }
      });
    });
});



//abbandona l'evento

router.put('/delete/:id', (req, res) => {
  // cancellare l'utente nella lista partecipanti
  Evento.findOne({
    _id: req.params.id
    })
  
    .then(evento => {
      evento.partecipanti.pull(req.user.id);

      //to delete also in the user (events) list
      utente.findOne({
          _id: req.user.id
        })
        .then(user => {
          //to send a notify to event's creator una notifica all'utente cha ha aggiunto
          utente.findOne({
            _id: evento.creatore._id
          })
          .then(user2 => {
            // Send a notify to event's creator
            if(user._id.toString() != evento.creatore._id.toString()){
              amqp.connect(keys.amqpURI, function(err, conn) {
                conn.createChannel(function(err, ch) {
                  var ex = 'notify';
                  var key = user2.email;
                  var msg = req.user.nome + " " + req.user.cognome + " ha abbandonato il tuo evento" + evento.titolo + "'";
                  ch.assertExchange(ex, 'topic', {durable: false});
                  ch.publish(ex, key, new Buffer.from(msg));
                });
                setTimeout(function() { conn.close();}, 500);
              });
            }
          user.eventi.pull(evento);
          user.save();
        });

        });

      evento.save()
        .then(evento => {
          req.flash('error_msg', 'Evento abbandonato');
          res.redirect('/eventi/mieiEventi');
        });
    });
});







//rimuovere evento
//delete event
router.delete('/:id', (req, res) => {

  Evento.findOne({
    _id: req.params.id
    }).then(evento =>{
      if(evento.partecipanti.length > 0){

        for(i = 0; i < evento.partecipanti.length; i++){
          utente.findOne({
            _id: evento.partecipanti[i]._id
          }).then(user => {
            if(user._id.toString() != evento.creatore._id.toString()){
              // Send a notify to all joiners
              amqp.connect(keys.amqpURI, function(err, conn) {
                conn.createChannel(function(err, ch) {
                  var ex = 'notify';
                  var key = user.email;
                  var msg = "ATTENTION: the event '" + evento.descrizione + "' that you're joined has been canceled";
                  console.log(key);
                  console.log(msg);
                  ch.assertExchange(ex, 'topic', {durable: false});
                  ch.publish(ex, key, new Buffer.from(msg));
                });
                
                setTimeout(function() {conn.close();}, 500);
              });
            }
            //to delete also in the user (events) list
            user.eventi.pull(evento);
            user.save();
          })
        }
      }
    }).then(() =>{
      Evento.deleteOne({
        _id: req.params.id
        })
        .then(evento => {
          req.flash('error_msg', 'evento rimosso');
          res.redirect('/eventi/mieiEventi');

        });
    });
});

module.exports = router;
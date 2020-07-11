const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const router = express.Router();

const {ensureAuthenticated} = require('../helpers/auth');


//load user module
require('../models/Utente');
const User = mongoose.model('utenti');

//log-in routes
router.get('/login', (req,res) =>{
  res.render('auth/login');
});


//sign-up routes
router.get('/iscriviti', (req,res) =>{
  res.render('auth/iscriviti');
});



//user page routes
router.get('/userPage', ensureAuthenticated, (req,res) =>{
  res.render('auth/paginaUtente');
});


//form di log in

router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/welcome',
    failureRedirect: '/auth/login',
    failureFlash: true
  })(req,res, next);
});


//register Form
router.post('/registrazione', (req, res) => {
  let errors = [];

  if(req.body.password != req.body.password2){
    errors.push({text:'la password non coincide'});
  }

  if(req.body.password.length < 6){
    errors.push({text:'La password deve contenere almeno 6 caratteri'});
  }

	//server side validation
  if(errors.length > 0){
    res.render('auth/iscriviti', {
      errors: errors,
      nome: req.body.nome,
      cognome: req.body.cognome,
      email: req.body.email,
      regione: req.body.regione
      //password cleared
    });
  } else{
    User.findOne({email: req.body.email})       //to check if email already in
      .then(user =>{
        if(user){
          req.flash('error_msg', 'Email già usata');
          res.redirect('/auth/iscriviti');
        } else{
          //console.log(req.body.ruolo.value);
          console.log(req.body.ruolo);
            if (req.body.ruolo == "utente"){

              const newUser = new User({
              nome: req.body.nome,
              cognome: req.body.cognome,
              email: req.body.email,
              password: req.body.password,
              ruolo: req.body.ruolo,
              regione: req.body.regione,
              info: true,
              
            });
              bcrypt.genSalt(10, (err,salt) => {			//password crypting 
                bcrypt.hash(newUser.password, salt, (err, hash) => { //(salt is additional input to a function that hashes data)
                  if(err) throw err;                          
                  newUser.password = hash; 
                  newUser.save()
                    .then(user => {
                      console.log("registrazione ok");
                      req.flash('success_msg', 'You are now registered, please log-in');
                      res.redirect('/auth/login');
                    })
                    .catch(err => {
                      console.log(err);
                      return;
                    })
                });
              });
          }
          else{
          const newUser = new User({
            nome: req.body.nome,
            cognome: req.body.cognome,
            email: req.body.email,
            password: req.body.password,
            ruolo: req.body.ruolo,
            regione: req.body.regione,
            info: false,
          });
            bcrypt.genSalt(10, (err,salt) => {			//password crypting 
              bcrypt.hash(newUser.password, salt, (err, hash) => { //(salt is additional input to a function that hashes data)
                if(err) throw err;                          
                newUser.password = hash; 
                newUser.save()
                  .then(user => {
                    console.log("registrazione ok");
                    req.flash('success_msg', 'You are now registered, please log-in');
                    res.redirect('/auth/login');
                  })
                  .catch(err => {
                    console.log(err);
                    return;
                  })
              });
            });
          } 
         
        }
      });
  }
});


// logout utente
router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'Logged out')
  res.redirect('/auth/login');
});

// auth with dropbox
router.get('/dropbox', passport.authenticate('dropbox-oauth2'));

router.get('/dropbox/callback', 
    passport.authenticate('dropbox-oauth2', {
        successRedirect:'/welcome', 
        failureRedirect: '/auth/login' 
    })
);

// auth with google
router.get('/google', passport.authenticate('google', {
  scope: ['profile','email']
}));

// callback route for google to redirect to
router.get('/google/redirect', passport.authenticate('google'), (req, res) => {
  // handle with passport
  //res.send(req.user);
  res.redirect('/welcome');
});

/*
//GOOGLE authentication
router.get('/google', passport.authenticate('google', {scope: ['profile', 'email']}));

//return from authenticate
router.get('/google/callback',
  passport.authenticate('google', {
    successRedirect : '/welcome',
    failureRedirect: '/auth/login'
    })
  );

*/

module.exports = router;
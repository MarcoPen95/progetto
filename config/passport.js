
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const DropboxOAuth2Strategy = require('passport-dropbox-oauth2').Strategy;
const keys = require('./keys.js');
const mongoose = require('mongoose');
//const keys = require('./keys.js');
const bcrypt = require('bcryptjs');

const Utente = mongoose.model('utenti');

module.exports = function(passport){
  //da accedere tramite la form di log in
  passport.use('local',
      new LocalStrategy({usernameField: 'email'}, (email, password, done) => {
      // verifico esistenza utente
      Utente.findOne({
        email:email
      }).then(user => {
        if(!user){
          return done(null, false, {message: 'nessun utente trovato'});
        }

        // corrispondenza password
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if(err) throw err;
          if(isMatch){
            return done(null, user, {message: 'utente esistente'});
          } else {
            return done(null, false, {message: 'Password sbagliata'});
          }
        })
      })
    }));


/*

//to access by google
passport.use('google',
new GoogleStrategy({
  clientID: keys.google_clientID,
  clientSecret:keys.google_clientSecret,
  callbackURL:'/auth/google/callback',
  proxy: true
}, (accessToken, refreshToken, profile, done) => {

  const newUser = {
    googleID: profile.id,
    nome: profile.name.givenName,
    cognome: profile.name.familyName,
    email: profile.emails[0].value,
  }

  // Check for existing user
  User.findOne({
    email:profile.emails[0].value
  }).then(user => {
    if(user){
      // Return user
      done(null, user);
    } else {
      // Create user
      new User(newUser)
        .save()
        .then(user => done(null, user));
    }
  })
})
);

*/

passport.use('dropbox-oauth2',
    new DropboxOAuth2Strategy({
        apiVersion: '2',
        clientID: keys.dropbox.clientID,
        clientSecret:keys.dropbox.clientSecret,
        callbackURL:'/auth/dropbox/callback'
    }, (accessToken, refreshToken, profile, done) => {

        const newUser = {
            dropboxID: profile.id,
            nome: profile.name.givenName,
            cognome: profile.name.familyName,
            email: profile.emails[0].value
        }

        // Check for existing user
        Utente.findOne({
            email:profile.emails[0].value
        }).then(user => {
            if(user){
            // Return user
            done(null, user);
        } else {
            // Create user
            new Utente(newUser)
                .save()
                .then(user => done(null, user));
            }
        })
    })
);

passport.use(
  new GoogleStrategy({
      // options for google strategy
      callbackURL: '/auth/google/redirect',
      clientID: keys.google.clientID,
      clientSecret: keys.google.clientSecret
  }, (accessToken, refreshToken, profile, done) => {
      // check if user already exist in our db
      console.log(profile);
      Utente.findOne({googleId: profile.id}).then((currentUser) => {
          if (currentUser) {
              // already have the user
              console.log("ci siamo gia vistiiiiiiiiiiii");
              //console.log('user is:', currentUser);
              done(null, currentUser);
          } else {
              // if not, create user in our db
              new Utente ({
                  nome: profile.displayName,
                  googleId: profile.id,
                  info: false,
                  email: profile.emails[0].value,
              }).save().then((newUser) => {
                console.log("CIAOooooooooooooooooo");
                  //console.log('new user created: '+ newUser);
                  done(null, newUser);
              });
          }
      });

      
  })
);

    passport.serializeUser(function(user, done) {
        done(null, user._id);
    });
  
    passport.deserializeUser(function(id, done) {
        Utente.findById(id, function(err, user) {
            done(err, user);
        });
    });
}

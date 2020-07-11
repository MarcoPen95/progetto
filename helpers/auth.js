//per controllare l'accesso ad una route.
module.exports = {
    ensureAuthenticated: function(req, res, next){
      if(req.isAuthenticated()){
        return next();
      }
      req.flash('error_msg', 'Non sei autorizzato,fai il log-in');
      res.redirect('/auth/login');
    }
  }
  
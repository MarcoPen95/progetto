const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// User Schema
const UserSchema = new Schema({
  email:                  { type: String, required: true },
  nome:                   { type: String, required: false },
  cognome:                { type: String, required: false },
  googleId:               { type: String                  },
  dropboxId:              {type:String                    },
  password:               { type: String, required: false },
  regione:                 { type: String,required: false  },
  eventi:                 [{ type: Schema.Types.ObjectId, ref:'eventi'}],
  ruolo:                  {type: String,required: false},
  info:                   {type: Boolean,required: false}
});


mongoose.model('utenti', UserSchema);

UserSchema.methods.IsGestore = function(){
  return (this.ruolo === "gestore")
}

UserSchema.methods.IsUtente= function(){
  return (this.ruolo === "utente")
}

mongoose.model('utenti', UserSchema);
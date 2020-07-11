const mongoose = require('mongoose');
const geocoder = require('../utils/geocoder');

const Schema = mongoose.Schema;

//Evento schema
const EventoSchema = new Schema({
  categoria:{
    type: String,
    required: true
  },
  titolo:{
    type: String,
    required: true
  },
  descrizione: {
    type: String,
    required: true
  },
  data:{
    type: Date,
    required: true
  },
  creatore:{
    type: Schema.Types.ObjectId,
    ref:'utenti'
  },
  partecipanti:[{
    utente:{
      type: Schema.Types.ObjectId,
      ref:'utenti'
    }
  }],
  indirizzo:{
    type: String,
    required: true
  },
  citta: {
    type: String,
    required: true
  },
  luogo: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinate:{
      type: [Number],
      index: '2dsphere',
      default: undefined
    },
    indirizzo_formattato:{
      type: String
    } 
  },
  immagine:{
    type: String
  },
  dateCreation:{
    type: Date,
    default: Date.now
  }
});

EventoSchema.pre('save',async function(next){

    console.log(this.indirizzo);
    const loc = await  geocoder.geocode(this.indirizzo);
    //console.log(loc);
    this.luogo = {
      type: 'Point',
      coordinate: [loc[0].longitude,loc[0].latitude]
      //indirizzo_formattato : res[0].formattedAddress
    }
    /*var stringa = this.indirizzo;
    var n = stringa.indexOf(",");
    var res = stringa.substring(n+1);
    this.citta = res;
    console.log(this.citta);
    */
    next();
  
})


mongoose.model('eventi', EventoSchema);

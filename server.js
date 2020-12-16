require('dotenv').config();
const express = require('express');
const mongo = require('mongodb');
const mongoose = require('mongoose');
const validUrl = require('valid-url');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

//Connexion à la BDD
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

//Création du Schéma mongoose
const Schema = mongoose.Schema;
const urlSchema = new Schema({
  originalUrl: {type: String, required: true},
  shortUrl: Number
});
const URL = mongoose.model("URL", urlSchema);

// Your first API endpoint
let responseObject = {};
app.post('/api/shorturl/new', bodyParser.urlencoded({extended: false}), (req, res) => {
  let inputUrl = req.body.url;

  if (!validUrl.isUri(inputUrl)){
    res.json({error: 'invalid url'});
    return
  }

  responseObject.original_url = inputUrl;

  //On cherche le plus grand numéro pour shortUrl
  let inputShort = 1 //initialisation
  URL.findOne({})
      .sort({shortUrl: 'desc'})
      .exec((error, result) => {
        if(!error && result != undefined){
          //mise à jour de inputShort
          inputShort = result.shortUrl+1;
        }
        if(!error){
          //Mise à jour de l'URL
          URL.findOneAndUpdate(
            {original_url: inputUrl},
            {original_url: inputUrl, short_url: inputShort},
            {new: true, upsert: true},
            (error, savedUrl) => {
              if(!error){
                console.log(savedUrl);
                responseObject.short_url = savedUrl.shortUrl;
              }
            })
        }
      })
  res.json(responseObject);
} )

app.get('/api/shorturl/:input', (req, res) => {
  let input = req.params.input;
  console.log(input);
  URL.findOne({shortUrl: input}, (error, result) => {
    if(!error && result != undefined){
      res.redirect(result.originalUrl);
    } else {
      res.json({error: 'URL not found'});
    }
  })
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

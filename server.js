require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const { Schema } = mongoose;
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const shortUrlSchema = new Schema({
    original_url : {type: String, unique: true},
    short_url: {type: String, unique: true}
  });

let ShortUrl = mongoose.model('ShortUrl', shortUrlSchema);;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let respuesta = {};

app.post("/api/shorturl", function(req, res){
  const urlExp = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
  const regex = new RegExp(urlExp);
  const original = req.body.url;
  respuesta["original_url"] = original;


  if(regex.test(original)){
    ShortUrl.findOneAndUpdate(
      {original_url: original},
      {original_url: original, short_url: new Date().getTime()},
      {new: true, upsert: true},
      function(err, obj){
        if(!err){
          respuesta["short_url"] = obj.short_url;
          res.json(respuesta);
        }
      }
    );
  } else {
    res.json({error: 'invalid url'});
  }
});

app.get("/api/shorturl/:short_url", function(req, res){
  const shortUrl = req.params.short_url;

  ShortUrl.findOne({short_url: shortUrl}, function(err, obj){
    if(!err && obj != undefined){
      res.redirect(obj.original_url);
    } else
    res.json({message: "URL not found"});
  });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

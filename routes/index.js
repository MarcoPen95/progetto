const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

//index route


router.get('/', (req,res) => {
  res.render('index/home');
})



router.get('/welcome', (req,res) => {
  res.render('index/welcome');
})


//about route
router.get('/about', (req,res) => {
  res.render('index/about');
})

module.exports = router;

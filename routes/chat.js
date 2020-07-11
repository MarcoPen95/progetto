const express = require('express');
const router = express.Router();
const {ensureAuthenticated} = require('../helpers/auth');

// Get insights page 
router.get('/chat', ensureAuthenticated, (req,res) => {
    res.render('chat/chat');
});

module.exports = router;
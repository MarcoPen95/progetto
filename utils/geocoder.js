const NodeGeocoder = require ('node-geocoder');
const keys = require('../config/keys');

const options = {
    provider: 'opencage',
    httpAdapter: 'https',
    apiKey: '53a140446a9f4ba5a3f4819c85a9a1f4',
    formatter: null

};

const  geocoder = NodeGeocoder(options);

module.exports = geocoder;
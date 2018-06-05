'use strict';
const axios = require('axios');
const ibuki = require('./ibuki');
const config = require('../config');

let util = {};
util.execPromise = (counter) => {
    axios.get('http://localhost:8081/test')
        .then(res => {
            //Save in database
            console.log(res.data, 'counter: ', counter);
            (counter <= config.promiseCounter) && ibuki.emit('next-promise');
        })
        .catch(err => {
            //log in database
            console.log('Error in promise', 'counter: ', counter);
            (counter <= config.promiseCounter) && ibuki.emit('next-promise');
        });
    // return (p);
}

module.exports = util;
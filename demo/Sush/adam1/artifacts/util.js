'use strict';
const axios = require('axios');
const ibuki = require('./ibuki');
const config = require('../config');

let util = {};

util.processCarrier = (carrierObject) => {
    const carrierInfo = carrierObject.carrierInfo;
    let index = carrierObject.index;
    axios.get(carrierInfo[index].url)
        .then(res => {
            //Save in database
            console.log(carrierInfo[index].trackingNumber,'name:',carrierInfo[index].name, ', index: ', index);
            ibuki.emit('next-carrier:util:workbench', {
                carrierInfo: carrierInfo,
                index: ++index
            });
        })
        .catch(err => {
            //log in database
            console.log('Error processing carrier data', 'index: ', index);
            ibuki.emit('next-carrier:util:workbench', {
                carrierInfo: carrierInfo,
                index: ++index
            });
        });
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

util.getRandomDelay = () => {
    const rnd = getRandomInt(0, 100);
    return (rx.of(rnd).pipe(operators.delay(rnd)));
}

util.getCarrierInfo = (name, count) => {
    let arr = [];
    for (let i = 0; i < count; i++) {
        let obj = {
            trackingNumber: getRandomInt(1000, 10000),
            url: 'http://localhost:8081/test',
            name: name
        }
        arr.push(obj);
    }
    return (arr);
}

module.exports = util;

// util.execPromise = (counter) => {
//     axios.get('http://localhost:8081/test')
//         .then(res => {
//             //Save in database
//             console.log(res.data, 'counter: ', counter);
//             ibuki.emit('next-promise');
//         })
//         .catch(err => {
//             //log in database
//             console.log('Error in promise', 'counter: ', counter);
//             ibuki.emit('next-promise');
//         });
// }
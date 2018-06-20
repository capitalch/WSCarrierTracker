'use strict';
const ibuki = require('./ibuki');
const rx = require('rxjs');
const operators = require('rxjs/operators');
const responses = require('./xml-responses');

ibuki.filterOn('test-zip:index>research').subscribe(d => {
    const obsA = rx.from([1, 2, 3, 4, 5, 6, 7]);
    const obsB = rx.from(['a', 'b', 'c']);
    const mySubA = new rx.Subject();
    const mySubB = new rx.Subject();
    const mySubC = new rx.Subject();
    const result = rx.zip(mySubA, mySubB, mySubC, (v1, v2, v3) => v1);
    result.subscribe(x => {
        console.log(x)
    });
    mySubA.next('a');
    mySubA.next('b');
    mySubA.next('c');
    mySubB.next(1);
    mySubB.next(2);
    // mySubC.next(1);
});

ibuki.filterOn('test-merge:index>research').subscribe(d => {
    const mySubA = new rx.Subject();
    const mySubB = new rx.Subject();
    const mySubC = new rx.Subject();
    const mySubD = rx.from(['x','y','z']);
    const result = rx.merge(mySubA, mySubB, mySubC, mySubD);
    result.subscribe(x => {
        console.log(x);
    });
    mySubA.next('a');
    mySubB.next('b');
    mySubC.next('c');
});

const fedexResponse = responses.fedexResponse;

var parseString = require('xml2js').parseString;
parseString(fedexResponse,{trim: true, explicitArray:false}, function (err, result) {
    // console.dir(result);
    const details = result.TrackReply.TrackDetails;
    result = null;
    // console.log(details);
});
// const xpath = require('xpath')
//   , dom = require('xmldom').DOMParser;

//   var xml = "<book><title><book>Harry Potter</book><book>Harry Potter 1</book></title></book>";
//   const doc = new dom().parseFromString(fedexResponse);
//   let title = xpath.select("//HighestSeverity", doc);
//   console.log(title);

// process.on('uncaughtException', function(err) {
// 	// handle the error safely
// 	console.log(err.name);
// });
/*
'<?xml version="1.0" encoding="utf-8"?>' +
'<note importance="high" logged="true">' +
'    <title>Happy</title>' +
'    <todo>Work</todo>' +
'    <todo>Play</todo>' +
'</note>';
*/
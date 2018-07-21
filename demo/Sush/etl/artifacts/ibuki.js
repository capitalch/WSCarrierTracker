'use strict';
var ibuki = {};
const rx = require('rxjs');
const operators = require('rxjs/operators');
const subject = new rx.Subject();
const hotSubject = new rx.BehaviorSubject();

ibuki.emit = (id, options) => {
    subject
        .next({
            id: id,
            data: options
        });
}

ibuki.filterOn = (id) => {
    return (subject.pipe(operators.filter(d => (d.id === id))));
}

ibuki.hotEmit = (id, options) => {
    hotSubject.next({
        id: id,
        data: options
    });
}

ibuki.hotFilterOn = (id) => {
    return (hotSubject.pipe(operators.filter(d => (d.id === id))));
}
module.exports = ibuki;
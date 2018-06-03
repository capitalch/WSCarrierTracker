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

//test area
function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
ibuki.get = () =>{
    const rnd = getRandomInt(3000, 10000);
    return(rx.of(rnd).pipe(operators.delay(rnd)));
}


// exports.obj = ibuki;
module.exports = ibuki;
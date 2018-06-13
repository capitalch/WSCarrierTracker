const ibuki = require('./ibuki');
const rx = require('rxjs');
const operators = require('rxjs/operators');

ibuki.filterOn('test-zip:index>research').subscribe(d => {
    const obsA = rx.from([1, 2, 3, 4, 5, 6, 7]);
    const obsB = rx.from(['a', 'b', 'c']);
    const mySubA = new rx.Subject();
    const mySubB = new rx.Subject();
    const result = rx.zip(mySubA, mySubB, (v1, v2) => v1);
    result.subscribe(x => console.log(x));
    mySubA.next('a');
    mySubA.next('b');
    mySubA.next('c');
    mySubB.next(1);
    mySubB.next(2);
});
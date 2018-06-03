const ibuki = require('./ibuki');
const rx = require('rxjs');

ibuki.filterOn('parallel:index:workbench').subscribe(
    d=> {
        let obsArray = d.data;
        rx.forkJoin(obsArray).subscribe(d=>{
            console.log('Parallel execution completed: ', d);
        })
    }
)
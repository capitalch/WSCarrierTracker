const ibuki = require('./ibuki');
const handler = require('./handler');
const rx = require('rxjs');
const operators = require('rxjs/operators');
const notify = require('./notify');
const db = require('./db'); // needed
const fex = require('./carriers/fex');
const gso = require('./carriers/gso');
const ups = require('./carriers/ups');
const tps = require('./carriers/tps');

const carriermap = {
    fex: (x) => ibuki.emit('process-fex:api>fex', x),
    ups: (x) => ibuki.emit('process-ups:api>ups', x),
    gso: (x) => ibuki.emit('process-gso:api>gso', x),
    tps: (x) => ibuki.emit('process-tps:api>tps', x)
};
handler.sub1 = ibuki.filterOn('handle-big-object:db>workbench').subscribe(
    d => {
        let bigObject = d.data;
        const fex = bigObject
            .filter(x =>
                (x.ShippingAgentCode === 'FEX') ||
                (x.ShippingAgentCode === 'FCC')
            ).map(x => {
                x.carrierName = 'fex';
                return (x);
            });
        const ups = bigObject
            .filter(x =>
                (x.ShippingAgentCode === 'TMC') ||
                (x.ShippingAgentCode === 'UPS')
            ).map(x => {
                x.carrierName = 'ups';
                return (x);
            });
        const gso = bigObject
            .filter(x =>
                x.ShippingAgentCode === 'GSO'
            ).map(x => {
                x.carrierName = 'gso';
                return (x);
            });
        (fex.length > 0) && ibuki.emit('process-carrier:self', fex);
        console.log('fex' + fex.length);
        (ups.length > 0) && ibuki.emit('process-carrier:self', ups);
        console.log('ups' + ups.length);
        (gso.length > 0) && ibuki.emit('process-carrier:self', gso);
        console.log('gso' + gso.length);
        handler.closeIfIdle();
        bigObject = null;
    });
handler.beforeCleanup(handler.sub1);

handler.sub8 = ibuki.filterOn('process-carrier:self').subscribe(d => {
    const carrierInfos = d.data;
    handler.sub2 = rx.from(carrierInfos)
        .pipe(
            operators
                .concatMap(x => rx.of(x)
                    .pipe(operators
                        .delay(30))))
        .subscribe(
            x => {
                handleCarrierInfo(x);
            }
        );
});
handler.beforeCleanup(handler.sub8);
function handleCarrierInfo(carrierInfo) {
    carriermap[carrierInfo.carrierName](carrierInfo);
}
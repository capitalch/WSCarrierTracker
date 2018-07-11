'use strict';
const _ = require('lodash');
const ibuki = require('./ibuki');
const handler = require('./handler');
const settings = require('../settings.json');
const rx = require('rxjs');
const operators = require('rxjs/operators');
const api = require('./api');
const notify = require('./notify');

let workbench = {};

const appKill = _.has(settings, 'config.appKillMin') ? settings.config.appKillMin * 60000 : 2 * 60 * 1000;
const myInterval = rx.interval(appKill);
const subs = myInterval.subscribe(() => {
    subs.unsubscribe();
    ibuki.emit('kill-process:any>handler');
});

const maxCarrierApiQueueSize = _.has(settings, 'config.maxCarrierApiQueueSize') ? settings.config.maxCarrierApiQueueSize : 1000;
const maxCarrierApiErrorCount = _.has(settings, 'config.maxCarrierApiErrorCount') ? settings.config.maxCarrierApiErrorCount : 1000;
handler.sub1 = ibuki.filterOn('handle-big-object:db>workbench').subscribe(
    d => {
        let bigObject = d.data;
        const fex = bigObject
            .filter(x =>
                (x.shippingAgentCode === 'FEX') ||
                (x.shippingAgentCode === 'FCC')
            ).map(x => {
                x.url = settings.carriers.fex.url;
                x.param = `<TrackRequest xmlns='http://fedex.com/ws/track/v3'><WebAuthenticationDetail><UserCredential><Key>${settings.carriers.fex.key}</Key><Password>${settings.carriers.fex.password}</Password></UserCredential></WebAuthenticationDetail><ClientDetail><AccountNumber>${settings.carriers.fex.accountNumber}</AccountNumber><MeterNumber>${settings.carriers.fex.meterNumber}</MeterNumber></ClientDetail><TransactionDetail><CustomerTransactionId>***Track v8 Request using VB.NET***</CustomerTransactionId></TransactionDetail><Version><ServiceId>trck</ServiceId><Major>3</Major><Intermediate>0</Intermediate><Minor>0</Minor></Version><PackageIdentifier><Value>${x.trackingNumber}</Value><Type>TRACKING_NUMBER_OR_DOORTAG</Type></PackageIdentifier><IncludeDetailedScans>1</IncludeDetailedScans></TrackRequest>`;
                //to take care for multiple tracking number add trackingNumberUniqueIdentifier tag
                x.param1 = `<TrackRequest xmlns='http://fedex.com/ws/track/v3'><WebAuthenticationDetail><UserCredential><Key>${settings.carriers.fex.key}</Key><Password>${settings.carriers.fex.password}</Password></UserCredential></WebAuthenticationDetail><ClientDetail><AccountNumber>${settings.carriers.fex.accountNumber}</AccountNumber><MeterNumber>${settings.carriers.fex.meterNumber}</MeterNumber></ClientDetail><TransactionDetail><CustomerTransactionId>***Track v8 Request using VB.NET***</CustomerTransactionId></TransactionDetail><Version><ServiceId>trck</ServiceId><Major>3</Major><Intermediate>0</Intermediate><Minor>0</Minor></Version><PackageIdentifier><Value>${x.trackingNumber}</Value><Type>TRACKING_NUMBER_OR_DOORTAG</Type></PackageIdentifier><TrackingNumberUniqueIdentifier>$$$trackingUid</TrackingNumberUniqueIdentifier><IncludeDetailedScans>1</IncludeDetailedScans></TrackRequest>`
                x.method = 'axiosPost';
                x.carrierName = 'fex';
                return (x);
            });

        const ups = bigObject
            .filter(x =>
                (x.shippingAgentCode === 'TMC') ||
                (x.shippingAgentCode === 'UPS'))
            .map(x => {
                x.url = settings.carriers.ups.url;
                x.param = `<?xml version="1.0"?><AccessRequest xml:lang="en-US"><AccessLicenseNumber>${settings.carriers.ups.accessLicenseNumber}</AccessLicenseNumber><UserId>${settings.carriers.ups.userId}</UserId><Password>${settings.carriers.ups.password}</Password></AccessRequest><?xml version="1.0"?><TrackRequest xml:lang="en-US"><Request><TransactionReference><XpciVersion>1.0001</XpciVersion></TransactionReference><RequestAction>Track</RequestAction><RequestOption>1</RequestOption></Request><TrackingNumber>${x.trackingNumber}</TrackingNumber></TrackRequest>`;
                x.method = 'axiosPost';
                x.carrierName = 'ups';
                return (x);
            });

        const gso = bigObject
            .filter(
                x => (
                    x.shippingAgentCode === 'GSO'
                ))
            .map(x => {
                x.method = 'axiosGet';
                x.carrierName = 'gso';
                x.accountNumber = x.trackingNumber ? x.trackingNumber.substr(0, 5) : null;
                (x.accountNumber === '11111') && (x.accountNumber = '50874');
                x.url = settings.carriers.gso.url.concat(`?TrackingNumber=${x.trackingNumber}&AccountNumber=${x.accountNumber}`);
                return (x);
            });

        const tps = bigObject
            .filter(x => (
                x.shippingAgentCode === 'TPS'
            ))
            .map(x => {
                x.url = `${settings.carriers.tps.url}?API=TrackV2&XML=<TrackFieldRequest USERID="${settings.carriers.tps.userId}"><TrackID ID="${x.trackingNumber}"></TrackID></TrackFieldRequest>`;
                x.method = 'axiosGet';
                x.carrierName = 'tps';
                return (x);
            });
        // notify module is used to notify errors and status
        (gso.length > 0) && (notify.initCarrier('gso', gso)) &&
        (ibuki.emit('pre-process-gso-carrier:self', gso)); // Pre processing GSO object to get token information
        (fex.length > 0) && (notify.initCarrier('fex', fex)) &&
        (ibuki.emit('process-carrier:self', fex));
        (ups.length > 0) && (notify.initCarrier('ups', ups)) &&
        (ibuki.emit('process-carrier:self', ups));
        (tps.length > 0) && (notify.initCarrier('tps', tps)) &&
        (ibuki.emit('process-carrier:self', tps));
        handler.closeIfIdle();
        bigObject = null;
    }
);
handler.beforeCleanup(handler.sub1);

function callAxios(x) {
    if (x.method === 'axiosPost') {
        ibuki.emit('axios-post:workbench-fex>api', x);
    } else {
        ibuki.emit('axios-get:workbench>api', x)
    }
}

handler.sub8 = ibuki.filterOn('process-carrier:self').subscribe(d => {
    const carrierInfos = d.data;
    settings.config.autoPilotPiston && ibuki.emit('adjust-piston:self', carrierInfos[0].carrierName);
    handler.sub2 = rx.from(carrierInfos)
        .pipe(
            operators
            .concatMap(x => rx.of(x)
                .pipe(operators
                    .delay(
                        (_.has(settings, 'config.autoPilotPiston') && settings.config.autoPilotPiston) ? (notify.getPiston(x.carrierName) || 10) : 10
                    ))))

        .subscribe(
            x => {
                if (notify.getApiError(x) >= maxCarrierApiErrorCount) {
                    notify.logInfo(x.carrierName.concat(':', x.trackingNumber, ':Maximum carrier api error count reached.'));
                } else if (notify.getApiQueue(x.carrierName) >= maxCarrierApiQueueSize) {
                    notify.logInfo(x.carrierName.concat(':', x.trackingNumber, ':Maximum carrier api queue size reached.'));
                } else {
                    callAxios(x);
                }           
            }
        );
});
handler.beforeCleanup(handler.sub8);

handler.sub9 = ibuki.filterOn('pre-process-gso-carrier:self').subscribe(d => {
    //get GSO tokens for multiple accounts and store store token in each gso element
    const gso = d.data;
    const gsoConfig = settings.carriers.gso;
    const gsoAccounts = gsoConfig.accounts;
    const tokenPromises = api.getGsoTokenPromises({
        tokenUrl: gsoConfig.tokenUrl,
        accounts: gsoAccounts
    });
    tokenPromises.then(res => {
        //key value pairs. Key is accountNumber and value is token. Error token is null;
        const accountWithTokens = {};
        res.forEach((x, i) => {
            accountWithTokens[gsoAccounts[i].accountNumber] = (x.state === 'fulfilled' ?
                x.value.headers.token :
                null);
        })
        gso.forEach(x => {
            x.token = x.accountNumber ? accountWithTokens[x.accountNumber] : '';
            x.config = {
                headers: {
                    "Token": x.token,
                    "Content-Type": "application/json"
                }
            };
        });
        ibuki.emit('process-carrier:self', gso);
    }).catch(err => {
        notify.pushError(err);
        // console.log(err);
    });
});
handler.beforeCleanup(handler.sub9);

handler.sub10 = ibuki.filterOn('adjust-piston:self').subscribe(
    d => {
        const carrierName = d.data;
        const queueSettings = settings.carriers[carrierName].queue;
        const myInterval = rx.interval(500);
        handler.sub11 = myInterval.subscribe(() => {
            const queue = notify.getApiQueue(carrierName);
            if (queue > queueSettings) { //increase piston to reduce queue
                notify.varyPiston(carrierName, 5);
            } else { //reduce piston
                notify.varyPiston(carrierName, -5);
            }
        });
        handler.beforeCleanup(handler.sub11);
    }
)
handler.beforeCleanup(handler.sub10);

module.exports = workbench;
var axios = require('axios');
var upsData = require('./data')
var Rx = require('rx');
var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var emitter = require('events').EventEmitter;


var strBuild = '', strBuildFedex = '';
var args = {};

var result = [];
var config = {
    userName: 'nwuser',
    password: 'user123%',
    server: 'nwazdb01.database.windows.net',
    options: {
        encrypt: true,
        database: 'PackageTracker'
    }
};
var connection = new Connection(config);
function exec(sql, result) {
    that = this;
    var e = new emitter();
    var timerName = "QueryTime";
    var request = new Request(sql, function (err, rowCount, rows) {
        if (err) {
            console.log(err);
        }
        console.log(rowCount);
        e.emit('rowCount', result);

    });
    request.on('doneProc', function (rowCount, more, rows) {
        if (!more) {
            console.timeEnd(timerName);
        }
    });
    request.on('row', function (columns) {
        let item = {};
        columns.forEach(column => {
            item[column.metadata.colName] = column.value;
        });
        result.push(item);
    });
    console.time(timerName);
    connection.execSql(request);
    return e;
}


connection.on('connect', function (err) {
    this.result = [];
    var execProcess = exec(`select rn,[External Tracking No_] as TrackingNo,[Shipping Agent Code] as ShippingAgentCode
    from PackagesToTrack where [Shipping Agent Code] in ('FEX','UPS','TMC')  order by rn`, result);
    execProcess.on('rowCount', (data) => (
        Rx.Observable.for(data, function (item) {
            return Rx.Observable.return(item).delay(200)
        }).throttle(100).subscribe(
            x => {
                console.log(x.TrackingNo);
                x.ShippingAgentCode == 'UPS' && UpdateUPS(x.TrackingNo);
                x.ShippingAgentCode == 'FEX' && UpdateFedEx(x.TrackingNo);
                x.ShippingAgentCode == 'GSO' && UpdateGSO(x.TrackingNo);//CreateGSOTrackRequest(x.External); 
                x.ShippingAgentCode == 'TPS' && UpdateTPS(x.TrackingNo);
            },
            e => {
                console.log('e:' + e);
            },
            () => {
            }
        )
    ));
});




function CreateUPSTrackRequest(trackingNo) {
    var accessLicenseNumber = 'FC312F9BE62AFF90';
    var upsUserId = 'UPSwineshipping';
    var upsUserPass = 'easyship';
    var xpciVersion = '1.0001';
    var requestOption = '1';

    strBuild = "<?xml version=\"1.0\"?>";
    strBuild = strBuild + "<AccessRequest xml:lang=\"en-US\">";
    strBuild = strBuild + "<AccessLicenseNumber>" + accessLicenseNumber + "</AccessLicenseNumber>";
    strBuild = strBuild + "<UserId>" + upsUserId + "</UserId>";
    strBuild = strBuild + "<Password>" + upsUserPass + "</Password>";
    strBuild = strBuild + "</AccessRequest>";

    strBuild = strBuild + "<?xml version=\"1.0\"?>";
    strBuild = strBuild + "<TrackRequest xml:lang=\"en-US\">";
    strBuild = strBuild + "<Request>";
    strBuild = strBuild + "<TransactionReference>";
    strBuild = strBuild + "<XpciVersion>" + xpciVersion + "</XpciVersion>";
    strBuild = strBuild + "</TransactionReference>";
    strBuild = strBuild + "<RequestAction>Track</RequestAction>";
    strBuild = strBuild + "<RequestOption>" + requestOption + "</RequestOption>";
    strBuild = strBuild + "</Request>";

    strBuild = strBuild + "<TrackingNumber>" + trackingNo + "</TrackingNumber>";
    strBuild = strBuild + "</TrackRequest>";
}

function CreateFedExTrackRequest(fedexTrackingNo) {
    strBuildFedex = "<TrackRequest xmlns='http://fedex.com/ws/track/v3'><WebAuthenticationDetail><UserCredential><Key>JfSbK7tkzfRBMf8G</Key>" +
        "<Password>dbc2GzV8LXPIcc7BQ4NPTMdUE</Password></UserCredential></WebAuthenticationDetail><ClientDetail>" +
        "<AccountNumber>510087348</AccountNumber><MeterNumber>5690072</MeterNumber></ClientDetail>" +
        "<TransactionDetail><CustomerTransactionId>***Track v8 Request using VB.NET***</CustomerTransactionId></TransactionDetail><Version><ServiceId>trck</ServiceId><Major>3</Major><Intermediate>0</Intermediate><Minor>0</Minor></Version><PackageIdentifier><Value>" + fedexTrackingNo + "</Value><Type>TRACKING_NUMBER_OR_DOORTAG</Type></PackageIdentifier><IncludeDetailedScans>1</IncludeDetailedScans></TrackRequest>";
}

function UpdateUPS(trackingNo) {
    CreateUPSTrackRequest(trackingNo);
    var UPSURL = "https://onlinetools.ups.com/ups.app/xml/Track";
    console.log(strBuild);
    axios.post(UPSURL, strBuild).then(function (rspn) {
        console.log(rspn.status);
    }).catch(
        function (error) {
            console.log(error);
        }
    )
}

function UpdateFedEx(fedexTrackingNo) {
    CreateFedExTrackRequest(fedexTrackingNo);
    var fedexUrl = "https://gateway.fedex.com:443/xml";
    axios.post(fedexUrl, strBuildFedex).then(function (rspn) {
        console.log(rspn.status);
    }).catch(
        function (error) {
            console.log(error);
        }
    )
}

function UpdateGSO(gsoTrackingNo) {
    // accessTokenUrl = "https://api.gso.com/Rest/v1/token";

    acountNumber = gsoTrackingNo.substring(0, 5);
    token = 'YX5dIhnUYm4xSwgFj28RsXH8Y0Vaf1HZDp2IlvhCMo5uTmdeUBO8f7mxGYbgcAzgTerG9oSj8DKwp//LWTq+Aq/+2hKgE+8T6m1XIBxk2k0=';
    gsoUrl = 'https://api.gso.com/Rest/v1/TrackShipment?TrackingNumber=' + gsoTrackingNo + '&AccountNumber=' + acountNumber;
    axios.get(gsoUrl, { headers: { Token: token, 'Content-Type': 'application/json' } }).then(response => {
        console.log(response.status);
    }).catch((error) => {
        console.log('error 3 ' + error);
    });
}

function UpdateTPS(tpsTrackingNo) {
    tpsUserName = '487WINES7756';
    tpsUrl = 'http://production.shippingapis.com/ShippingAPI.dll';
    requestUrl = tpsUrl + '?API=TrackV2&XML=<TrackFieldRequest USERID="' + tpsUserName + '">'
    requestUrl += '<TrackID ID="' + tpsTrackingNo + '">'
    requestUrl += '</TrackID>'
    requestUrl += '</TrackFieldRequest>'
    console.log(requestUrl);
    axios.get(requestUrl).then(response => {
        console.log(response.status);
    }).catch((error) => {
        console.log('error 3 ' + error);
    });

}



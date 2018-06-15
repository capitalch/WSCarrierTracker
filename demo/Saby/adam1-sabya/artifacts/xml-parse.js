const xml2js = require('xml2js');
const ibuki = require('./ibuki');
const config = require('../config');
const logger = require('./logger');
var xpath = require('xpath')
  , dom = require('xmldom').DOMParser
let parseXML = {};

let parser = new xml2js.Parser();

ibuki.filterOn('parseXml:util:xmlParse').subscribe(
    d => {
        var packageStatus = {};
        let xmlData = d.data.response;
        let carrierInfo = d.data.carrierInfo;
        switch (carrierInfo.name) {
            case 'UPS':
                parseXML.getUpsData(d.data.response, packageStatus);
                break;
            case ("FEX"):
            case ("FCC"):
                parseXML.getFedexData(d.data.response, packageStatus);
                break;
            case ("GSO"):
                parseXML.getGSOData(d.data.response, packageStatus);
                break;
            case ("TPS"):
                parseXML.getTPSData(d.data.response, packageStatus);
                break;
        }
    }
);

parseXML.getFedexData = (response, packageStatus) => {
    parser.parseString(response, function (err, result) {
        if(result.TrackReply.TrackDetails)
        {        
            packageStatus.responseStatus = result.TrackReply.TrackDetails[0].StatusCode[0]
        }else{
            console.log(result)
        } 
        
    });
}

parseXML.getGSOData = (result, packageStatus) => {
    packageStatus.responseStatus = result.ShipmentInfo[0].Delivery.TransitStatus
}
parseXML.getTPSData = (result, packageStatus) => {

}

parseXML.getUpsData = (result, packageStatus) => {
    var xml = result;//"<TrackResponse><Response><TransactionReference><XpciVersion>1.0001</XpciVersion></TransactionReference><ResponseStatusCode>1</ResponseStatusCode><ResponseStatusDescription>Success</ResponseStatusDescription></Response><Shipment><Shipper><ShipperNumber>5X0937</ShipperNumber><Address><AddressLine1>50 TECHNOLOGY CT</AddressLine1><City>NAPA</City><StateProvinceCode>CA</StateProvinceCode><PostalCode>94558   7519</PostalCode><CountryCode>US</CountryCode></Address></Shipper><ShipTo><Address><City>MERCER ISLAND</City><StateProvinceCode>WA</StateProvinceCode><PostalCode>98040</PostalCode><CountryCode>US</CountryCode></Address></ShipTo><ShipmentWeight><UnitOfMeasurement><Code>LBS</Code></UnitOfMeasurement><Weight>13.10</Weight></ShipmentWeight><Service><Code>002</Code><Description>UPS 2ND DAY AIR</Description></Service><ReferenceNumber><Code>01</Code><Value>270613</Value></ReferenceNumber><ShipmentIdentificationNumber>1Z5X0937A655582697</ShipmentIdentificationNumber><PickupDate>20180403</PickupDate><DeliveryDateUnavailable><Type>Scheduled Delivery</Type><Description>Scheduled Delivery Date is not currently available, please try back later</Description></DeliveryDateUnavailable><Package><TrackingNumber>1Z5X0937A655582697</TrackingNumber><DeliveryIndicator>Y</DeliveryIndicator><DeliveryDate>20180404</DeliveryDate><PackageServiceOptions><SignatureRequired><Code>A</Code></SignatureRequired></PackageServiceOptions><Activity><ActivityLocation><Address><City>MERCER ISLAND</City><StateProvinceCode>WA</StateProvinceCode><PostalCode>98040</PostalCode><CountryCode>US</CountryCode></Address><Code>M1</Code><Description>RESIDENTIAL</Description><SignedForByName>CASIE</SignedForByName></ActivityLocation><Status><StatusType><Code>D</Code><Description>DELIVERED</Description></StatusType><StatusCode><Code>KB</Code></StatusCode></Status><Date>20180404</Date><Time>142600</Time></Activity><Activity><ActivityLocation><Address><City>SEATTLE</City><StateProvinceCode>WA</StateProvinceCode><CountryCode>US</CountryCode></Address></ActivityLocation><Status><StatusType><Code>I</Code><Description>OUT FOR DELIVERY TODAY</Description></StatusType><StatusCode><Code>OT</Code></StatusCode></Status><Date>20180404</Date><Time>083300</Time></Activity><Activity><ActivityLocation><Address><City>SEATTLE</City><StateProvinceCode>WA</StateProvinceCode><CountryCode>US</CountryCode></Address></ActivityLocation><Status><StatusType><Code>I</Code><Description>PROCESSING FOR DELIVERY</Description></StatusType><StatusCode><Code>YP</Code></StatusCode></Status><Date>20180404</Date><Time>063700</Time></Activity><Activity><ActivityLocation><Address><City>SEATTLE</City><StateProvinceCode>WA</StateProvinceCode><CountryCode>US</CountryCode></Address></ActivityLocation><Status><StatusType><Code>I</Code><Description>ARRIVAL SCAN</Description></StatusType><StatusCode><Code>AR</Code></StatusCode></Status><Date>20180404</Date><Time>045500</Time></Activity><Activity><ActivityLocation><Address><City>PORTLAND</City><StateProvinceCode>OR</StateProvinceCode><CountryCode>US</CountryCode></Address></ActivityLocation><Status><StatusType><Code>I</Code><Description>DEPARTURE SCAN</Description></StatusType><StatusCode><Code>DP</Code></StatusCode></Status><Date>20180404</Date><Time>004300</Time></Activity><Activity><ActivityLocation><Address><City>PORTLAND</City><StateProvinceCode>OR</StateProvinceCode><CountryCode>US</CountryCode></Address></ActivityLocation><Status><StatusType><Code>I</Code><Description>ARRIVAL SCAN</Description></StatusType><StatusCode><Code>AR</Code></StatusCode></Status><Date>20180403</Date><Time>164900</Time></Activity><Activity><ActivityLocation><Address><City>ROSEBURG</City><StateProvinceCode>OR</StateProvinceCode><CountryCode>US</CountryCode></Address></ActivityLocation><Status><StatusType><Code>I</Code><Description>DEPARTURE SCAN</Description></StatusType><StatusCode><Code>DP</Code></StatusCode></Status><Date>20180403</Date><Time>124600</Time></Activity><Activity><ActivityLocation><Address><City>ROSEBURG</City><StateProvinceCode>OR</StateProvinceCode><CountryCode>US</CountryCode></Address></ActivityLocation><Status><StatusType><Code>I</Code><Description>ARRIVAL SCAN</Description></StatusType><StatusCode><Code>AR</Code></StatusCode></Status><Date>20180403</Date><Time>112000</Time></Activity><Activity><ActivityLocation><Address><City>SAN PABLO</City><StateProvinceCode>CA</StateProvinceCode><CountryCode>US</CountryCode></Address></ActivityLocation><Status><StatusType><Code>I</Code><Description>DEPARTURE SCAN</Description></StatusType><StatusCode><Code>DP</Code></StatusCode></Status><Date>20180403</Date><Time>020200</Time></Activity><Activity><ActivityLocation><Address><City>SAN PABLO</City><StateProvinceCode>CA</StateProvinceCode><CountryCode>US</CountryCode></Address></ActivityLocation><Status><StatusType><Code>I</Code><Description>ORIGIN SCAN</Description></StatusType><StatusCode><Code>OR</Code></StatusCode></Status><Date>20180402</Date><Time>210400</Time></Activity><Activity><ActivityLocation><Address><CountryCode>US</CountryCode></Address></ActivityLocation><Status><StatusType><Code>M</Code><Description>BILLING INFORMATION RECEIVED</Description></StatusType><StatusCode><Code>MP</Code></StatusCode></Status><Date>20180402</Date><Time>232900</Time></Activity><PackageWeight><UnitOfMeasurement><Code>LBS</Code></UnitOfMeasurement><Weight>13.10</Weight></PackageWeight><ReferenceNumber><Code>01</Code><Value>270613</Value></ReferenceNumber><Accessorial><Code>043</Code><Description>CUSTOMIZED DELIVERY CONFIRMATION</Description></Accessorial></Package></Shipment></TrackResponse>";
    var doc = new dom().parseFromString(xml)
    var nodes = xpath.select("//TrackResponse/Shipment/Package/Activity", doc)

    nodes.forEach(element => {
        let Activity = new dom().parseFromString(element.toString());
        let itemStatusDesc = xpath.select("//Status/StatusType/Description", Activity)
        let itemStatusCode = xpath.select("//Status/StatusType/Code", Activity)
        if (itemStatusDesc && (itemStatusDesc[0].textContent.indexOf('DAMAGE') > 0)) {
            packageStatus.DAMAGE = '1';
            packageStatus.DAMAGEMSG = itemStatusDesc[0].textContent;
            config.DAMAGECOUNTER = +1;
        }

        if (itemStatusDesc && (itemStatusDesc[0].textContent.indexOf('RETURNED TO') > 0)) {
            packageStatus.DAMAGE = '1';
            packageStatus.DAMAGEMSG = itemStatusDesc[0].textContent;
            config.DAMAGECOUNTER = +1;
        }


        if (itemStatusDesc && (itemStatusDesc[0].textContent.indexOf('RETURNED TO') > 0)) {
            packageStatus.DAMAGE = '1';
            packageStatus.DAMAGEMSG = itemStatusDesc[0].textContent;
            config.DAMAGECOUNTER = +1;
        }

        switch (itemStatusCode[0].textContent) {
            case "D":
                packageStatus.ResponseStatus = "Delivered";
                packageStatus.ResponseStatusCode = itemStatusDesc[0].textContent;
                break;
            case "I":
                packageStatus.ResponseStatus = "In Transit";
                packageStatus.ResponseStatusCode = itemStatusDesc[0].textContent;
                break;
            case "X":
                packageStatus.ResponseException = 1
        }
    });
};

module.exports = parseXML;
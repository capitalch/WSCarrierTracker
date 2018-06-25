var fs = require('fs');
var Logger = {};
var infoStream = fs.createWriteStream('logs/info.txt');
var errorStream = fs.createWriteStream('logs/error.txt');

Logger.info = function (msg) {
    var message = "\n"+new Date().toISOString() + " : " + msg + "\n";
    infoStream.write(message);

};
Logger.logXML = function (msg) {
    var message = "\n"+new Date().toISOString() + " : " + msg + "\n";
    xmlStream.write(message);

};
Logger.error = function (msg) {
    var message = "\n"+new Date().toISOString() + " : " + msg + "\n";
    errorStream.write(message);
};

module.exports = Logger;
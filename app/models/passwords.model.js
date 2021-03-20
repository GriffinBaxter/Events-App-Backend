const CryptoJS = require('crypto-js');

exports.hash = async function(password) {
    return CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
}

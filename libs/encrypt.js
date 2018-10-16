const 
	crypto = require('crypto'),
	JSEncrypt = require('node-jsencrypt');



module.exports = function(){

	return {
		encrypt: function(loginUser, loginPwd, token){
			var pwd = require('./hex_md5')(loginPwd);
			console.log('\nMd5 pwd : ');
			console.log(pwd);

			var userStr = loginUser + ',' + pwd;
			console.log('\nUser string : ');
			console.log(userStr);

			var key = Buffer.from(token, 'hex').toString('base64');

			const encrypt = new JSEncrypt();
			encrypt.setPublicKey(key);
			console.log('\nPublic Key : ');
			console.log(encrypt.getPublicKey());

			var rsaUserStr =  encrypt.encrypt(userStr);
			console.log('\nEncrypt result : ');
			console.log(rsaUserStr);
			return rsaUserStr;

		}
	}

}



// Import modules
// request-promise
const credentials = require('../configs/credentials');
const rp = require('request-promise');
// require('request-promise').debug = true
//require('request-debug')(rp);


// cookie
const tough = require('tough-cookie');
const cookiejar = rp.jar(); // create cookie jar 

// anticaptcha

var anticaptcha = require('anti-captcha');
var service = anticaptcha('http://anti-captcha.com', credentials.anticaptchaProviders.key);

// encrypt 
const JSEncrypt = require('node-jsencrypt');
const Encrypt = require('./encrypt')();

// Set basic url 
const apiSrc = "http://cms.pokermanager.club/cms-api";
const webSrc = "http://cms.pokermanager.club/cmsLogin.html"


function printCaptchaText(captcha) {
  console.log(captcha.text);
  return captcha.text;
}
 

function createRpData(uri, method, data, cookies, token){
	if(method === 'POST'){
		return {
            method: 'POST',
            uri: uri,
            form: data,
            json: true, // parse responese into js object
            jar: cookies,
            headers: { 'User-Agent': 'Mozilla/5.0' ,
        				'token':token}
        };
	}else if(method === 'GET'){
        return {
        	headers: { 'User-Agent': 'Mozilla/5.0' },
            method: 'GET',
            uri: uri,
            jar: cookies      
        };
    }else if(method === 'POST_BODY'){
    	return {
            method: 'POST',
            uri: uri,
            body: data,
            json: true, // parse responese into js object
            jar: cookies,
            headers: { 'User-Agent': 'Mozilla/5.0' ,
        				'token': token}
        };
    }else{
        return "Wrong Method!";
    }
}



function CmsApi(loginUser, loginPwd){
	this.loginUser = loginUser || '';
	this.loginPwd = loginPwd || '';
	this.uuid = {};
	this.token = '';
	this.clubId = {};
	// Init cookie
	var aliCookie = new tough.Cookie({
	    key: "aliyungf_tc",
	    value: "AQAAAN9bjlZ0UgQAAg9MKh3OyjB89I+Z",
	});
	var langCookie = new tough.Cookie({
	    key: "userLanguage",
	    value: "zh",
	});

	// Put cookie into global cookie jar
	cookiejar.setCookie(aliCookie, 'http://cms.pokermanager.club');
	cookiejar.setCookie(langCookie, 'http://cms.pokermanager.club');
	this.cookiejar = cookiejar;

	//this.login();

}
	

CmsApi.prototype.setToken = function (token){
	this.token = token;
}

CmsApi.prototype.getToken = function (){
	return this.token;
}

CmsApi.prototype.login =  async function(){
	
	//get public token
	let rpData = createRpData(apiSrc + '/token/generateCaptchaToken', 'POST', '');
	response = await rp(rpData);

	console.log('Get captcha token : '+ response.result);
	var token = this.token = response.result;
	
	//get captcha image string
	let body = { token : this.token};
	rpData = createRpData(apiSrc + '/captcha', 'POST', body);
	response =  await rp(rpData); 

	console.log('Get image raw string : ');
	let imageRawString = response.result; 

	//recognize the captcha with anticaptcha api
	console.log('Start Anticaptcha : ');

	captcha = await service.uploadCaptcha(imageRawString, {phrase: true});
	console.log(captcha);
	imageCode = await service.getText(captcha).then(function(captcha){
		return printCaptchaText(captcha);
	})
	console.log(imageCode);

	var rsaUserStr = Encrypt.encrypt(this.loginUser, this.loginPwd, this.token);
    let locale = 'zh'
    
    // Pepare encrypt data for login
    let loginData = {
        token : token,
        data : rsaUserStr,
        safeCode :  imageCode,
        locale : locale
    }
    console.log('Encrypt login data : ');
    
   
    // Send login request
    result = await rp(createRpData(apiSrc + '/login', 'POST', loginData, cookiejar));
    console.log(result);
	return result;
};

CmsApi.prototype.checkToken = function(){

	let options = createRpData(apiSrc+'/user/getCurrentUserInfo', 'POST', '', this.cookiejar, this.token);
	return rp(options)
			.then(function(result){
				if(typeof result.iErrCode !== undefined){
					return result.iErrCode === 0;
				}else{
					return false;
				}
			}).catch(function(err){
				console.log(err);
				return err;
			});
};

CmsApi.prototype.callCmsApi = function(uri, method, data){
			
	let options = createRpData(uri, method, data, this.cookiejar, this.token);
	return rp(options)
			.then(function(result){
				return result;
			}).catch(function(err){
				console.log(err);
				return err;
			});
};

//index
CmsApi.prototype.getClubList = function(){
	let options = createRpData(apiSrc + '/club/getClubList', 'POST', '', this.cookiejar, this.token);
	return rp(options)
			.then(function(result){
				return result;
			}).catch(function(err){
				console.log(err);
				return err;
			});
};

CmsApi.prototype.knickOffLine = function(){

};

CmsApi.prototype.getOnlineUserList = function(){
	let options = createRpData(apiSrc + '/user/getOnlineUserList', 'POST', '', this.cookiejar, this.token);
	return rp(options)
			.then(function(result){
				return result;
			}).catch(function(err){
				console.log(err);
				return err;
			});
};

 //frame.js

CmsApi.prototype.getNotice = function(){

};


CmsApi.prototype.getCurrentUserInfo = function(){

};


CmsApi.prototype.getBuyinCount = function(){

};

CmsApi.prototype.getMenuList = function(){

};

CmsApi.prototype.logout = function(){

};


//basicMsg
CmsApi.prototype.calculateClubLevelLimit = function(){

};

CmsApi.prototype.checkPermission = function(){

};

CmsApi.prototype.clubInfo = function(clubId){
	this.clubId = clubId;
	data = {clubId: clubId};
	let options = createRpData(apiSrc + '/club/clubInfo', 'POST', data, this.cookiejar, this.token);
	return rp(options)
			.then(function(result){
				return result;
			}).catch(function(err){
				console.log(err);
				return err;
			});
};

CmsApi.prototype.getClubUserLevel = function(){

};

CmsApi.prototype.buyClubLevel = function(){

};

//buyinConfirmation

CmsApi.prototype.getBuyinList = function(){

};

CmsApi.prototype.acceptBuyin = function(){

};

CmsApi.prototype.denyBuyin = function(){

};

//presentGames
CmsApi.prototype.getCurrentGameList = function(){
	let options = createRpData(apiSrc + '/game/getCurrentGameList', 'POST', '', this.cookiejar, this.token);
	return rp(options)
			.then(function(result){
				return result;
			}).catch(function(err){
				console.log(err);
				return err;
			});
};

//gradeExports
CmsApi.prototype.getHistoryGameList = function(){

};

//memberManage

CmsApi.prototype.getUserAlias = function(){

};

CmsApi.prototype.setUserAlias = function(){

};

CmsApi.prototype.fire = function(){

};

CmsApi.prototype.getClubMemberList = function(){

};

//adminMsg

CmsApi.prototype.getClubManagerList = function(){

};

CmsApi.prototype.getSpecifyUserByShowId = function(){

};

CmsApi.prototype.addClubManager = function(){

};

CmsApi.prototype.deleteClubManager = function(){

};

//bringinCheck

CmsApi.prototype.getApplyList = function(){

};

CmsApi.prototype.acceptApply = function(){

};

CmsApi.prototype.denyApply = function(){

};

//allianceMag
CmsApi.prototype.getClubGameInfoOfLeague = function(){

};

CmsApi.prototype.setClubClearTime = function(){

};

//mirroring

CmsApi.prototype.createClubMirror = function(){

};

CmsApi.prototype.checkCurrentClubMirrorStatus = function(){

};

//operationRecord


CmsApi.prototype.operationLog = function(){

};

CmsApi.prototype.getHistoryGameDetail = function(){

};

module.exports = CmsApi;
	

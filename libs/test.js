const 
    credentials = require('../configs/credentials'),    
    CmsApi = require('./cmsApi'),
    loginUser = credentials.pokerProviders.account,
    loginPwd = credentials.pokerProviders.password;



async function run(){
    let cms = new CmsApi(loginUser, loginPwd);
    await cms.login();
    let res = await cms.getClubList();
    console.log(res);

}

run();

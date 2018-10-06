// Handlers for home page

const 
    credentials = require('../configs/credentials');
    CmsApi = require('../libs/cmsApi'),
    apiSrc = "http://cms.pokermanager.club/cms-api";
    loginUser = credentials.pokerProviders.account,
    loginPwd = credentials.pokerProviders.password;



async function index (req, res) {

    // Init api
    let cms = new CmsApi(loginUser, loginPwd);
    cms.setToken(req.session.cmsToken);

    // Request api
    let response = await cms.getClubList();
    let result = response.result;

    // Extract data
    let clubInfoList = [];
    for(let i=0 ; i<result.length ; i++){
        let clubInfo = {
            clubId : result[i].lClubID, 
            clubName : result[i].sClubName, 
            maxMember : result[i].iMaxMembers, 
            curMember : result[i].iCurMembers, 
            maxManager : result[i].iMaxManageMembers, 
            curManager : result[i].iCurManageMembers, 
            clubFund : result[i].lFund
        };
        clubInfoList.push(clubInfo);
    }
    
    console.log('get club info list : ');
    console.log(clubInfoList);

    // Render
    let context = { clubInfoList : clubInfoList };
    res.render('home/index', {layout : 'main', ...context });
}

async function presentgames(req, res) {

    // Init api
    let cms = new CmsApi(loginUser, loginPwd);
    cms.setToken(req.session.cmsToken);

    // Request api
    await cms.clubInfo(req.query.id)
    let response =  await cms.getCurrentGameList();
    let result = response.result;

    // Convert create time to loacl string
    for(let i=0 ; i<result.length ; i++){
        let date = new Date(result[i].createTime);
        result[i].createTime = date.toLocaleString({ timeZone: 'CST' });
    }

    console.log('get present game list : ');
    console.log(result);

    // Render
    let context = { presentGameList : result };
    res.render('home/presentgames', {layout : 'main', ...context });
}

function add (req, res) {
    res.render('home/add', {layout : 'main'});
}

function login (req, res) {
    res.render('home/login', {layout : false});
}

function authorize(req, res, next){

    // User not login, just redirect
    if(!req.isAuthenticated()) {
        console.log('not authorized');
        res.redirect(303, '/home/login');
        return;
    }

    // User has logined, moving forward
    return next();
}

async function cmsconnect(req, res, next) {

    // Not yet possess cms token, request token and store in session
    if(!req.session.cmsToken){
        let cms = new CmsApi(loginUser, loginPwd);
        await cms.login();
        req.session.cmsToken = cms.getToken();
    }
    
    return next();
}


module.exports = {
    index: index,
    add: add,
    login: login,
    presentgames : presentgames,
    authorize : authorize,
    cmsconnect : cmsconnect
};

// ----------------------------------------------------- //


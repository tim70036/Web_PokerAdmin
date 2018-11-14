const
    credentials = require('../../configs/credentials'),
    { body, validationResult } = require('express-validator/check'),
    { sanitizeBody } = require('express-validator/filter'),
    sqlAsync = require('../../libs/sqlAsync'),
    cmsApi = require('../../cms/cmsApi');



let miscHandler = function(req,res){
    res.render('home/account/misc', {layout : 'home'});
}

let gameHandler = function(req,res){
    res.render('home/account/game', {layout : 'home'});
}

let clubHandler = async function(req,res){
    let role = req.user.role;
    let roleId= req.user.roleId;


    // Prepare query
    let sqlString =`SELECT *
                    FROM CmsPoker.ClubInfo AS a
                      LEFT OUTER JOIN CmsPoker.CmsAccount AS b ON a.cmsAccountId = b.id
                    WHERE adminId = ?;`;
    let values = [roleId];
    sqlString = req.db.format(sqlString, values);
    let sqlresults = await sqlAsync.query(req.db, sqlString);

    if(sqlresults.length <= 0) {
      res.render('home/account/club', {layout : 'home'});
      return console.log("results is empty");
    }
    let leftArr = [];
    let rightArr = [];
    for(let i=0 ; i<results.length ; i++){
        if(i%2 === 0)   leftArr.push(results[i]);
        else    rightArr.push(results[i]);
    }

    // Pass data to handlebars
    res.locals.clubs = {
        left: leftArr,
        right: rightArr,
        isEven : (results.length % 2 === 0) ? true : false,
    };

    console.log(res.locals.clubs);
    res.render('home/account/club', {layout : 'home'});


    // Search user in database
    // req.db.query(sqlString, function(error, results, fields){
    //     // error will be an Error if one occurred during the query
    //     // results will contain the results of the query
    //     // fields will contain information about the returned results fields (if any)
    //     if(error) {
    //         res.render('home/account/club', {layout : 'home'});
    //         return console.log(error);
    //     }
    //     // Not found
    //     else if (results.length <= 0) {
    //         res.render('home/account/club', {layout : 'home'});
    //         return console.log("results is empty");
    //     }
    //
    //     // Spilt results into 2 array
    //     let leftArr = [];
    //     let rightArr = [];
    //     for(let i=0 ; i<results.length ; i++){
    //         if(i%2 === 0)   leftArr.push(results[i]);
    //         else    rightArr.push(results[i]);
    //     }
    //
    //     // Pass data to handlebars
    //     res.locals.clubs = {
    //         left: leftArr,
    //         right: rightArr,
    //         isEven : (results.length % 2 === 0) ? true : false,
    //     };
    //
    //     console.log(res.locals.clubs);
    //     res.render('home/account/club', {layout : 'home'});
    // });

}

// let updateHandler = function(req, res) {
//
//     const result = validationResult(req);
//
//     // If the form data is invalid
//     if (!result.isEmpty()) {
//         // Return the first error to client
//         let firstError = result.array()[0].msg;
//         return res.json({err: true, msg: firstError});
//     }
//
//     const
//         {eaccount, epassword} = req.body;
//     // console.log("account : " + eaccount);
//     // console.log("password : " + epassword);
//
//     return res.json({err: false, msg: 'success'});
//
//     // [TODO] check data with api server
//
//     // [TODO] Prepare queries
// }

let createHandler = async function(req, res){
    let adminid = req.user.roleId;
    const result = validationResult(req);

    // If the form data is invalid
    if (!result.isEmpty()) {
        // Return the first error to client
        let firstError = result.array()[0].msg;
        return res.json({err: true, msg: firstError});
    }

    // Gather all required data
    const
        {   addaccount,
            addpassword } = req.body;
    console.log("addaccount : " + addaccount);
    console.log("addpassword : " + addpassword);

    // login cms with api, check whether the account is correct
    try{
      var token = await cmsApi.login(addaccount, addpassword);
    }
    catch(error){
      console.log(error);
      return res.json({err: true, msg: 'failed'});
    }

    // wrong account -> token is null
    if(token == null){
      return res.json({err: true, msg: 'CMS帳號密碼錯誤'});
    }

    // get the clubs of the cms account
    let club = await cmsApi.getClubList(token);
    console.log("length of club list is : " + club.result.length);

    // check whether the cms account is already exist (different admin could manage a same cms account)
    var checkQuery = `SELECT *
                      FROM CmsPoker.CmsAccount
                      WHERE account = ? AND adminId = ?;`;
    values = [addaccount, adminid];
    checkQuery = req.db.format(checkQuery, values);
    var cmsaccountid;
    let checkresults = await sqlAsync.query(req.db, checkQuery);
    if(checkresults.length <= 0){
      // cms account not exist -> insert into CmsAccount table & record the id for later use
      let insertQuery = `INSERT INTO CmsPoker.CmsAccount (account, password, adminId)
                          VALUES (?, ?, ?);`;
      values = [addaccount, addpassword, adminid];
      insertQuery = req.db.format(insertQuery, values);
      let insertresults = await sqlAsync.query(req.db, insertQuery + checkQuery);
      cmsaccountid = insertresults[1][0]['id'];
      console.log("insert : cmsaccountid is : " + cmsaccountid);
    }
    else{
      // cms account exist -> record the id for later use
      cmsaccountid = checkresults[0]['id'];
      console.log("cmsaccountid is : " + cmsaccountid);
    }


    // insert or update the clubInfo
    for(let i=0 ; i < club.result.length ; i++){
      // check whether the club exist, since different admin could manage a same cmsAccount
      // we have to select the club by cmsid and cmsAccountid
      let checkQuery = `SELECT *
                        FROM CmsPoker.ClubInfo AS club
                        WHERE club.cmsId = ? AND club.cmsAccountId = ?`;
      values = [club.result[i].lClubID, cmsaccountid];
      checkQuery = req.db.format(checkQuery, values);
      console.log("@@@@@@@ : " + checkQuery);
      let checkresults = await sqlAsync.query(req.db, checkQuery);
      if(checkresults.length <= 0){
        // club not exist -> insert
        console.log(" Time to insert ");
        let insertClubQuery = `INSERT INTO CmsPoker.ClubInfo
                                    (name, cmsId, cmsAccountId, curMember, maxMember, curManage, maxManage,
                                      level, fund, diamond, smallIcon, bigIcon)
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
        values = [club.result[i].sClubName, club.result[i].lClubID, cmsaccountid, club.result[i].iCurMembers, club.result[i].iMaxMembers,
                  club.result[i].iCurManageMembers, club.result[i].iMaxManageMembers, club.result[i].iClubLevel, club.result[i].lFund,
                  club.result[i].lDiamond, club.result[i].sSmallIcon, club.result[i].sBigIcon];
        var sqlString = req.db.format(insertClubQuery, values);
      }
      else{
        // club exist -> update
        console.log(" Time to update ");
        targetid = checkresults[0]['id'];
        let updateQuery = `UPDATE CmsPoker.ClubInfo
                           SET
                              name = ?, curMember = ?, maxMember = ?, curManage = ?, maxManage = ?,
                              level = ?, fund = ?, diamond = ?, smallIcon = ?, bigIcon = ?
                           WHERE id = ?;`;
        values = [club.result[i].sClubName, club.result[i].iCurMembers, club.result[i].iMaxMembers,
                  club.result[i].iCurManageMembers, club.result[i].iMaxManageMembers, club.result[i].iClubLevel, club.result[i].lFund,
                  club.result[i].lDiamond, club.result[i].sSmallIcon, club.result[i].sBigIcon, targetid];
        var sqlString = req.db.format(updateQuery, values);
      }
      let sqlresults = await sqlAsync.query(req.db, sqlString);

    }


    // store to redis
    // get the current value
    let key = '/clubsInfo:' + adminid;
    req.redis.get(key, function(err, reply){
      if(reply === ""){
        var myobj;
      }else{
        var myobj = JSON.parse(reply);
      }

      for(let i=0 ; i < club.result.length ; i++){
        var newobj = {
          [club.result[i].lClubID] : {
            "account":addaccount,
            "pwd":addpassword,
            "token":"null"
          }
        };
        myobj = Object.assign(newobj, myobj);
        console.log("after append : " + JSON.stringify(myobj));
      }
      req.redis.set(key, JSON.stringify(myobj));
      return res.json({err: false, msg: 'success'});

    });

}



let deleteHandler = async function(req, res) {
    let adminid = req.user.roleId;

    // Gather all required data
    const
        { clubid , cmsaccount} = req.body;
    console.log("target id : " + clubid);
    console.log("target account : " + cmsaccount);

    let deleteQuery = `DELETE FROM CmsPoker.ClubInfo
                       WHERE
                          id = (SELECT c.id
                                FROM (SELECT * FROM ClubInfo) AS c
                                WHERE c.cmsId = ? AND c.cmsAccountId = (SELECT ca.id
                                                                        FROM CmsPoker.CmsAccount AS ca
                                                                        WHERE account = ? AND adminId = ?));`;
    values = [clubid, cmsaccount, adminid];
    deleteQuery = req.db.format(deleteQuery, values);
    let deleteresult = await sqlAsync.query(req.db, deleteQuery);

      // delete data in redis
      let key = '/clubsInfo:' + req.user.roleId;
      req.redis.get(key, function(err, reply){
        var myobj = JSON.parse(reply);
        delete myobj[clubid];
        req.redis.set(key, JSON.stringify(myobj));
        return res.json({err: false, msg: 'success'});
      });
}

// function updateValidator(){
//     return [
//         // Check format
//         // All values must be string
//         body('*')
//             .isString().withMessage('Wrong data format. Must be string'),
//
//         body('eaccount')
//             .isLength({ min:1 }).withMessage('名稱不可為空')
//             .isLength({ max:20 }).withMessage('名稱長度不可超過20'),
//
//         body('epassword')
//             .isLength({ min:1 }).withMessage('名稱不可為空')
//             .isLength({ max:20 }).withMessage('名稱長度不可超過20'),
//
//         sanitizeBody('data.*.*')
//             .escape()
//             .trim()
//
//     ];
// }

function createValidator(){
    return [
        // Check format
        // All values must be string
        body('*')
            .isString().withMessage('Wrong data format. Must be string'),

        body('addaccount')
            .isLength({ min:1 }).withMessage('名稱不可為空')
            .isLength({ max:20 }).withMessage('名稱長度不可超過20'),

        body('addpassword')
            .isLength({ min:1 }).withMessage('名稱不可為空')
            .isLength({ max:20 }).withMessage('名稱長度不可超過20'),

        sanitizeBody('data.*.*')
            .escape()
            .trim()
    ];
}


module.exports = {
    misc : miscHandler,
    game : gameHandler,
    club : clubHandler,

    // update : updateHandler,
    // updateValidate : updateValidator(),

    create : createHandler,
    createValidate : createValidator(),

    delete : deleteHandler

};

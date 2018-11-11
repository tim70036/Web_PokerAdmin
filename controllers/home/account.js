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
    let sqlString =`SELECT * FROM CmsPoker.ClubInfo AS a LEFT OUTER JOIN CmsPoker.CmsAccount AS b ON a.cmsAccountId = b.id WHERE adminId = ?;`;
    let values = [roleId];
    sqlString = req.db.format(sqlString, values);

    try{
      await sqlAsync.query(req.db, 'START TRANSACTION');

      var results = await sqlAsync.query(req.db, sqlString);
    }
    catch(error){
      await sqlAsync.query(req.db, 'ROLLBACK');
      console.log(error);
      res.render('home/account/club', {layout : 'home'});
    }
    await sqlAsync.query(req.db, 'COMMIT');
    if(results.length <= 0) {
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

function printObject(o) {
  var out = '';
  for (var p in o) {
    out += p + ': ' + o[p] + '\n';
  }
  return out;
}

function getObjectValue(o){
  var out = '';
  for (var p in o){
    out = o[p];
  }
  return out;
}

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



    // [TODO] check data with api server

    try{
      var token = await cmsApi.login(addaccount, addpassword);
    }
    catch(error){
      console.log(error);
      return res.json({err: true, msg: 'failed'});
    }

    // wrong account -> token is null
    if(token == null){
      return res.json({err: true, msg: 'wrong account'});
    }

    let club = await cmsApi.getClubList(token);
    console.log("length of club list is : " + club.result.length);

    let checkQuery = `SELECT IF ((SELECT COUNT(c.id) FROM CmsPoker.CmsAccount AS c
                                    WHERE c.account = ? AND c.adminId = ?) > 0,'true', 'false');`;
    values = [addaccount, adminid];
    checkQuery = req.db.format(checkQuery, values);

    try{
      await sqlAsync.query(req.db, 'START TRANSACTION');
      var checkresults = await sqlAsync.query(req.db, checkQuery);
    }
    catch(error){
      await sqlAsync.query(req.db, 'ROLLBACK');
      console.log(error);
      return res.json({err: true, msg: '執行錯誤'});
    }
    await sqlAsync.query(req.db, 'COMMIT');

    // insert data into CmsAccount table and get cmsid for later insert clubInfo use
    if(getObjectValue(checkresults[0]) === 'false'){
      let insertCmsQuery = `INSERT INTO CmsPoker.CmsAccount (account, password, adminId)
                            VALUES (?, ?, ?);`;
      values = [addaccount, addpassword, adminid];
      insertCmsQuery = req.db.format(insertCmsQuery, values);

      let getCmsidQuery = `SELECT id FROM CmsPoker.CmsAccount WHERE account = ? AND adminId = ?`;
      values = [addaccount, adminid];
      getCmsidQuery = req.db.format(getCmsidQuery, values);

      try{
        await sqlAsync.query(req.db, 'START TRANSACTION');
        var getresults = await sqlAsync.query(req.db, insertCmsQuery + getCmsidQuery);
      }
      catch(error){
        await sqlAsync.query(req.db, 'ROLLBACK');
        console.log(error);
        return res.json({err: true, msg: '執行錯誤'});
      }
      await sqlAsync.query(req.db, 'COMMIT');

      var getCmsId = getresults[1][0]['id'];

      console.log("getresult with insert : " + getCmsId);
      //return res.json({err: false, msg: '#check point1'});

    }else if(getObjectValue(checkresults[0]) === 'true'){
      console.log("In function !!!");
      let getCmsidQuery = `SELECT id FROM CmsPoker.CmsAccount WHERE account = ? AND adminId = ?;`;
      values = [addaccount, adminid];
      getCmsidQuery = req.db.format(getCmsidQuery, values);
      console.log("QQQQQ : " + getCmsidQuery);
      try{
        await sqlAsync.query(req.db, 'START TRANSACTION');
        var getresults = await sqlAsync.query(req.db, getCmsidQuery);
      }
      catch(error){
        await sqlAsync.query(req.db, 'ROLLBACK');
        console.log(error);
        return res.json({err: true, msg: '執行錯誤'});
      }
      await sqlAsync.query(req.db, 'COMMIT');

      var getCmsId = getresults[0]['id'];

      console.log("getresult without insert : " + getCmsId);
      //return res.json({err: false, msg: '#check point2'});
    }else{
      console.log("Something went wrong !!!");
      return res.json({err: true, msg: '執行錯誤'});
    }

    for(let i=0 ; i < club.result.length ; i++){
    // check query
      let checkQuery = `SELECT IF((SELECT COUNT(club.id) FROM CmsPoker.ClubInfo AS club WHERE club.cmsId = ? AND
                                    club.cmsAccountId = ?)>0,'true','false') AS result;`;
      values = [club.result[i].lClubID, getCmsId];
      checkQuery = req.db.format(checkQuery, values);
      //console.log("the query is : " + checkQuery);

      try{
        await sqlAsync.query(req.db, 'START TRANSACTION');
        var checkresults = await sqlAsync.query(req.db, checkQuery);
      }
      catch(error){
        await sqlAsync.query(req.db, 'ROLLBACK');
        console.log(error);
        return res.json({err: true, msg: '執行錯誤'});
      }
      await sqlAsync.query(req.db, 'COMMIT');

      console.log("The check result is fucking : " + getObjectValue(checkresults[0]));
      if(getObjectValue(checkresults[0]) === 'true'){
        console.log("Time to update club ~~~");
        let updateQuery = `UPDATE CmsPoker.ClubInfo SET name = ?, curMember = ?, maxMember = ?, curManage = ?, maxManage = ?,
level = ?, fund = ?, diamond = ?, smallIcon = ?, bigIcon = ?
        WHERE id = (SELECT a.id FROM (SELECT * FROM CmsPoker.ClubInfo) AS a WHERE a.cmsId = ? AND a.cmsAccountId = ?);`;
        values = [club.result[i].sClubName, club.result[i].iCurMembers, club.result[i].iMaxMembers,
                  club.result[i].iCurManageMembers, club.result[i].iMaxManageMembers, club.result[i].iClubLevel, club.result[i].lFund,
                  club.result[i].lDiamond, club.result[i].sSmallIcon, club.result[i].sBigIcon, club.result[i].lClubID, getCmsId];
        updateQuery = req.db.format(updateQuery, values);

        try{
          await sqlAsync.query(req.db, 'START TRANSACTION');
          let updateResult = await sqlAsync.query(req.db, updateQuery);
        }
        catch(error){
          await sqlAsync.query(req.db, 'ROLLBACK');
          console.log(error);
          return res.json({err: true, msg: '執行錯誤'});
        }
        await sqlAsync.query(req.db, 'COMMIT');
      }
      else if(getObjectValue(checkresults[0]) === 'false'){
        console.log("Time to insert club ~~");
        let insertClubQuery = `INSERT INTO CmsPoker.ClubInfo (name, cmsId, cmsAccountId, curMember, maxMember, curManage, maxManage, level, fund, diamond, smallIcon, bigIcon)
                              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        values = [club.result[i].sClubName, club.result[i].lClubID, getCmsId, club.result[i].iCurMembers, club.result[i].iMaxMembers,
                  club.result[i].iCurManageMembers, club.result[i].iMaxManageMembers, club.result[i].iClubLevel, club.result[i].lFund,
                  club.result[i].lDiamond, club.result[i].sSmallIcon, club.result[i].sBigIcon];
        insertClubQuery = req.db.format(insertClubQuery, values);

        try{
          await sqlAsync.query(req.db, 'START TRANSACTION');
          let insertclubResult = await sqlAsync.query(req.db, insertClubQuery);
        }
        catch(error){
          await sqlAsync.query(req.db, 'ROLLBACK');
          console.log(error);
          return res.json({err: true, msg: '執行錯誤'});
        }
        await sqlAsync.query(req.db, 'COMMIT');
      }
      else{
        console.log("Something went wrong !!!");
        return res.json({err: true, msg: '執行錯誤'});
      }



      // [TODO] exist_notequal return false
      //        exist_equal update
      //        not_exist insert

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


    // [TODO] Prepare queries
    // let queryStrings = [];

    // let sqlString = ;

    // for(let i=0 ; i<updateData.length ; i++){
    //     let element = updataData[i];
    //     let values = [];

    //     // Append a statement to query string array
    //     queryStrings.push(req.db.format(sqlString, values));
    // }

    // sqlTransaction(req.db, queryStrings, function(error, msg){
    //     // Return the result of transaction to client
    //     if(error) {
    //         return res.json({err: true, msg: msg});
    //     }
    //     else {
    //         return res.json({err: false, msg: 'success'});
    //     }
    // });

}



let deleteHandler = async function(req, res) {
    let adminid = req.user.roleId;
    //const result = validationResult(req);


    // If the form data is invalid
    // if (!result.isEmpty()) {
    //     // Return the first error to client
    //     let firstError = result.array()[0].msg;
    //     return res.json({err: true, msg: firstError});
    // }

    // Gather all required data
    const
        { clubid , cmsaccount} = req.body;
    console.log("target id : " + clubid);
    console.log("target account : " + cmsaccount);

    let deleteQuery = `DELETE FROM CmsPoker.ClubInfo WHERE id = (SELECT c.id FROM (SELECT * FROM ClubInfo) AS c WHERE
                        c.cmsId = ? AND c.cmsAccountId = (SELECT ca.id FROM CmsPoker.CmsAccount AS ca WHERE account = ? AND adminId = ?));`;
    values = [clubid, cmsaccount, adminid];
    deleteQuery = req.db.format(deleteQuery, values);

    try{
      await sqlAsync.query(req.db, 'START TRANSACTION');
      let deleteResult = await sqlAsync.query(req.db, deleteQuery);
    }
    catch(error){
      await sqlAsync.query(req.db, 'ROLLBACK');
      console.log(error);
      return res.json({err: true, msg: '執行錯誤'});
    }
    await sqlAsync.query(req.db, 'COMMIT');

      // delete data in redis
      let key = '/clubsInfo:' + req.user.roleId;
      req.redis.get(key, function(err, reply){
        var myobj = JSON.parse(reply);
        delete myobj[clubid];
        req.redis.set(key, JSON.stringify(myobj));
        return res.json({err: false, msg: 'success'});
      });



    // [TODO] check data with api server

    // [TODO] Prepare queries
    // let queryStrings = [];

    // let sqlString = ;

    // for(let i=0 ; i<updateData.length ; i++){
    //     let element = updataData[i];
    //     let values = [];

    //     // Append a statement to query string array
    //     queryStrings.push(req.db.format(sqlString, values));
    // }

    // sqlTransaction(req.db, queryStrings, function(error, msg){
    //     // Return the result of transaction to client
    //     if(error) {
    //         return res.json({err: true, msg: msg});
    //     }
    //     else {
    //         return res.json({err: false, msg: 'success'});
    //     }
    // });
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

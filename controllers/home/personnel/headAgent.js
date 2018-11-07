const 
    sqlTransaction = require('../../../libs/sqlTransaction'),
    sqlAsync = require('../../../libs/sqlAsync'),
    { body, validationResult } = require('express-validator/check'),
    { sanitizeBody } = require('express-validator/filter');



// Page rendering
let renderHandler = function(req,res){
    res.render('home/personnel/head-agent', {layout : 'home'});
}

// Datatable ajax read
let readHandler = async function(req,res){

    // Init return data (must suit DataTable's format)
	let data = {
    	data : []
    };

    // Get admin 
    let admin;
    try{
        admin = await getAdmin(req);
    }
    catch(error) {
        return res.json({err: true, msg: error.message});
    }
    
    // Prepare query
    let sqlStringRead = `SELECT 
                            H.id, H.userAccount, H.name,
                            H.cash, H.credit, H.frozenBalance, H.availBalance, H.totalBalance, H.posRb, H.negRb, S.status,
                            H.lineId, H.wechatId, H.facebookId, H.phoneNumber, 
                            H.bankSymbol, H.bankName, H.bankAccount,  H.comment, H.createtime, H.updatetime
                        FROM HeadAgentInfo AS H
                        INNER JOIN UserAccount AS U
                            ON H.uid=U.id 
                        INNER JOIN Status AS S
                            ON U.statusId=S.id
                        WHERE H.adminId=?`;
    let values = [admin.id];
    sqlStringRead = req.db.format(sqlStringRead, values);

    // Search all head agents of this admin
    // Execute query
    try {
        let results = await sqlAsync.query(req.db, sqlStringRead);

        // Check result
        if(results.length <= 0 ) throw Error(`Cannot find any head agent for adminId = ${admin.id}`);

        // Return result
        data.data = results;
        return res.json(data);
    }
    catch(error) {
        console.log(error);
        return res.json(data); 
    }
}

// Datatable ajax create
let createHandler = async function(req,res){

    const result = validationResult(req);

    // If the form data is invalid
    if (!result.isEmpty()) {
        // Return the first error to client
        let firstError = result.array()[0].msg;
        return res.json({err: true, msg: firstError});
    }

    // Gather all required data
    const 
        {   name, 
            account, 
            password, 
            passwordConfirm, 
            email, 
            cash,
            credit,
            posRb,
            negRb,
            bankSymbol, 
            bankName, 
            bankAccount, 
            phoneNumber, 
            facebookId, 
            lineId, 
            wechatId, 
            comment } = req.body;
    
    // Get admin 
    let admin;
    try{
        admin = await getAdmin(req);
    }
    catch(error) {
        return res.json({err: true, msg: error.message});
    }

    // Check if admin has enough balance 
    if(cash > admin.availBalance){
        return res.json({err: true, msg: 'Admin 現金額度不足'});
    }

    // Prepare query
    // Query for insert into UserAccount
    let sqlStringInsert1 = `INSERT INTO UserAccount (account, password, role, email) VALUES (?, ?, ?, ?);`;
    let values = [account, password, 'headAgent', email];
    sqlStringInsert1 = req.db.format(sqlStringInsert1, values);

    // Query for insert into HeadAgentInfo
    let sqlStringInsert2 = `INSERT INTO HeadAgentInfo (
                                uid, adminId, userAccount, name, 
                                cash, credit, frozenBalance, posRb, negRb, 
                                lineId, wechatId, facebookId, phoneNumber, 
                                bankSymbol, bankName, bankAccount, comment) 
                            VALUES ((SELECT id FROM UserAccount WHERE account=?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
                            ;`;
    values = [  account, admin.id, account, name, 
                cash, credit, 0, posRb, negRb,
                lineId, wechatId, facebookId, phoneNumber, 
                bankSymbol, bankName, bankAccount, comment];
    sqlStringInsert2 = req.db.format(sqlStringInsert2, values);

    // Query for update AdminInfo cash and frozenBalance
    let sqlStringUpdate = ` UPDATE AdminInfo
                            SET cash=cash-?, frozenBalance=frozenBalance+?
                            WHERE id=?
                            ;`;
    values = [cash, cash, admin.id];
    sqlStringUpdate = req.db.format(sqlStringUpdate, values);

    // Insert new head agent
    // Execute transaction
    try{
        await sqlAsync.query(req.db, 'START TRANSACTION');
        
        let results = await sqlAsync.query(req.db, sqlStringInsert1 + sqlStringInsert2 + sqlStringUpdate);

    }
    catch(error) {
        await sqlAsync.query(req.db, 'ROLLBACK'); // rollback transaction if a statement produce error
        console.log(error);
        return res.json({err: true, msg: '執行錯誤'});
    }
    await sqlAsync.query(req.db, 'COMMIT');  // commit transaction only if all statement has executed without error
    
    return res.json({err: false, msg: 'success'});
}

// Datatable ajax update
let updateHandler = async function(req,res){
    console.log(req.body.data);
    const result = validationResult(req);
   
    // If the form data is invalid
    if (!result.isEmpty()) {
        // Return the first error to client
        let firstError = result.array()[0].msg;
        return res.json({err: true, msg: firstError});
    }

    // Receive data array
    let updateData = req.body.data;

    // Get admin 
    let admin;
    try{
        admin = await getAdmin(req);
    }
    catch(error) {
        return res.json({err: true, msg: error.message});
    }
    
    // Prepare query for validate availBalance
    let sqlStringCash = `SELECT SUM(cash) AS totalCash
                         FROM HeadAgentInfo
                         WHERE id IN(?)
                         `;
    values = [ updateData.map((element) => element.id) ]; // a list of id of all the head agent that required update
    sqlStringCash = req.db.format(sqlStringCash, values);

    // Execute query to get orginal total cash and new total cash of all the head agent that required update
    let newTotalCash = updateData.reduce( (sum, element) => sum + Number(element.cash) ,0);
    let orgTotalCash;
    try {
        let results = await sqlAsync.query(req.db, sqlStringCash);

        // Check result
        if(results.length <= 0 ) throw Error(`Cannot find calculate SUM of all head agents' cash`);
        orgTotalCash = results[0].totalCash;
    }
    catch(error) {
        console.log(error);
        return res.json({err: true, msg: '執行錯誤'});
    }

    console.log({newTotalCash, orgTotalCash});

    // Calculate change and validate with admin's availBalance
    if(newTotalCash - orgTotalCash > admin.availBalance){
        return res.json({err: true, msg: 'Admin 現金額度不足'});
    }


    // Now, these updates are all valid, execute all 
    // Prepare query
    let sqlStringTmp = `UPDATE HeadAgentInfo 
                            SET  name=?, cash=?, credit=?, frozenBalance=?, posRb=?, negRb=?,
                                lineId=?, wechatId=?, facebookId=?, phoneNumber=?, 
                                bankSymbol=?, bankName=?, bankAccount=?, comment=?
                            WHERE id=?
                            ;`;
    let sqlStringUpdate1 = '';
    for(let i=0 ; i<updateData.length ; i++) {

        let element = updateData[i];
        let values = [  element.name, element.cash, element.credit, element.frozenBalance, element.posRb, element.negRb,
                        element.lineId, element.wechatId, element.facebookId, element.phoneNumber,
                        element.bankSymbol, element.bankName, element.bankAccount, element.comment, element.id];
        sqlStringUpdate1  += req.db.format(sqlStringTmp, values);
    }

    let sqlStringUpdate2 = `UPDATE AdminInfo
                            SET cash=cash-?, frozenBalance=frozenBalance+?
                            WHERE id=?
                            ;`;
    values = [newTotalCash - orgTotalCash, newTotalCash - orgTotalCash, admin.id];
    sqlStringUpdate2 = req.db.format(sqlStringUpdate2, values);

    // Execute all queries
    try{
        await sqlAsync.query(req.db, 'START TRANSACTION');
        let results = await sqlAsync.query(req.db, sqlStringUpdate1 +  sqlStringUpdate2);
    }
    catch(error) {
        await sqlAsync.query(req.db, 'ROLLBACK'); // rollback transaction if a statement produce error
        console.log(error);
        return res.json({err: true, msg: '執行錯誤'});
    }
    await sqlAsync.query(req.db, 'COMMIT');  // commit transaction only if all statement has executed without error
    
    return res.json({err: false, msg: 'success'});
}

// Datatable ajax delete
let deleteHandler = async function(req,res){

    const result = validationResult(req);

    // If the form data is invalid
    if (!result.isEmpty()) {
        // Return the first error to client
        let firstError = result.array()[0].msg;
        return res.json({err: true, msg: firstError});
    }

    let deleteData = req.body.data;

    // Return cash to admin?

    // Get admin 
    let admin;
    try{
        admin = await getAdmin(req);
    }
    catch(error) {
        return res.json({err: true, msg: error.message});
    }


    // Prepare query
    let sqlStringCash = `SELECT SUM(cash) AS totalCash
                            FROM HeadAgentInfo
                            WHERE id IN(?)
                            `;
    values = [ deleteData.map((element) => element.id) ]; // a list of id of all the head agent that required update
    sqlStringCash = req.db.format(sqlStringCash, values);

    // Execute query to get total cash of all the head agent that pepare to be deleted
    let totalCash;
    try {
        let results = await sqlAsync.query(req.db, sqlStringCash);

        // Check result
        if(results.length <= 0 ) throw Error(`Cannot find calculate SUM of all head agents' cash`);
        totalCash = results[0].totalCash;
    }
    catch(error) {
        console.log(error);
        return res.json({err: true, msg: '執行錯誤'});
    }

    console.log({totalCash});

    // Now, delete all head agents
    // Prepare query
    let sqlStringDel = `DELETE FROM HeadAgentInfo
                        WHERE id IN (?)
                        ;`;
    values = [ deleteData.map((element) => element.id) ]; // a list of id of all the head agent that pepare to be deleted
    sqlStringDel = req.db.format(sqlStringDel, values);

    let sqlStringUpdate = `UPDATE AdminInfo
                            SET cash=cash+?, frozenBalance=frozenBalance-?
                            WHERE id=?
                            ;`;
    values = [totalCash, totalCash, admin.id];
    sqlStringUpdate = req.db.format(sqlStringUpdate, values);

    // Execute all queries
    try{
        await sqlAsync.query(req.db, 'START TRANSACTION');
        let results = await sqlAsync.query(req.db, sqlStringDel +  sqlStringUpdate);
    }
    catch(error) {
        await sqlAsync.query(req.db, 'ROLLBACK'); // rollback transaction if a statement produce error
        console.log(error);
        return res.json({err: true, msg: '執行錯誤'});
    }
    await sqlAsync.query(req.db, 'COMMIT');  // commit transaction only if all statement has executed without error
    
    return res.json({err: false, msg: 'success'});


}


// Form data validate generators
// Invoke it to produce a middleware for validating
function createValidator(){
    return [
        // Check format
        // All values must be string
        body('*')
            .isString().withMessage('Wrong data format'),

        // For each value
        body('name')
            .isLength({ min:1 }).withMessage('名稱不可為空')
            .isLength({ max:20 }).withMessage('名稱長度不可超過 20'),
        body('account')
            .isLength({ min:1 }).withMessage('帳號不可為空')
            .isLength({ max:20 }).withMessage('帳號長度不可超過 20'),
        body('password')
            .isLength({ min:1 }).withMessage('密碼不可為空')
            .isLength({ max:20 }).withMessage('密碼長度不可超過 20'), 
        body('passwordConfirm')
            .custom( function(data, {req}) { return data === req.body.password; }).withMessage('確認密碼與密碼不相同'),
        body('email')
            .isLength({ min:0, max:40 }).withMessage('信箱長度不可超過 40')
            .optional({ checkFalsy:true }) // Use optional for isInt, this allows input to be "", 0, null and false, however we check whether it is string above, so it is fine
            .isEmail({ min:0 }).withMessage('信箱格式錯誤'), 

        body('cash')
            .isInt().withMessage('現金額度必須是數字'),
        body('credit')
            .isInt().withMessage('信用額度必須是數字'),
        body('posRb')
            .isFloat().withMessage('正退水必須是小數'),
        body('negRb')
            .isFloat().withMessage('負退水必須是小數'),

        body('bankSymbol')
            .isLength({ min:0, max:20 }).withMessage('銀行代碼長度不可超過 20')
            .optional({ checkFalsy:true }) // Use optional for isInt, this allows input to be "", 0, null and false, however we check whether it is string above, so it is fine
            .isInt({ min:0 }).withMessage('銀行代號必須是數字'),
        body('bankName')
            .isLength({ min:0, max:20 }).withMessage('銀行名稱長度不可超過 20'),
        body('bankAccount')
            .isLength({ min:0, max:20 }).withMessage('銀行帳號長度不可超過 20')
            .optional({ checkFalsy:true }) // Use optional for isInt, this allows input to be "", 0, null and false, however we check whether it is string above, so it is fine
            .isInt({ min:0 }).withMessage('銀行帳號必須是數字'),

        body('lineId')
            .isLength({ min:0, max:20 }).withMessage('Line Id 長度不可超過 20'),  // length 0 means this field is optional
        body('wechatId')
            .isLength({ min:0, max:20 }).withMessage('Wechat Id 長度不可超過 20'), 
        body('facebookId')
            .isLength({ min:0, max:20 }).withMessage('Facebook Id 長度不可超過 20'),
        body('phoneNumber')
            .isLength({ min:0, max:20 }).withMessage('電話長度不可超過 20')
            .optional({ checkFalsy:true }) // Use optional for isInt, this allows input to be "", 0, null and false, however we check whether it is string above, so it is fine
            .isInt({ min:0 }).withMessage('電話號碼必須是數字'),
        body('comment')
            .isLength({ min:0, max:40 }).withMessage('備註長度不可超過 40'),
        
        // Sanitize all values 
        sanitizeBody('*')
            .escape() // Esacpe characters to prevent XSS attack, replace <, >, &, ', " and / with HTML entities
            .trim(), // trim white space from both end
        
        // Check in database
        body('account').custom(function(data, {req}){

            // Prepare query
            let sqlString =`SELECT * 
            FROM UserAccount 
            WHERE account=?`;
            let values = [data];
            sqlString = req.db.format(sqlString, values);

            // Check if duplicate account exists
            return new Promise(function(resolve, reject) {
                req.db.query(sqlString, function(error, results, fields){
                    // error will be an Error if one occurred during the query
                    // results will contain the results of the query
                    // fields will contain information about the returned results fields (if any)
                    if(error) { 
                        return reject('Server 錯誤');
                    }                
                    // This account is duplicate
                    else if (results.length > 0) {
                        return reject('使用者帳號重複');
                    }

                    // Validation success, this is not a duplicate account
                    return resolve(true);
                });
            });
        }),
    ];
}

function updateValidator(){
    return [
        // Check format
        // Data must be array
        body('data')
            .isArray().withMessage('Wrong data format')
            .custom( function(data) { return data.length < 10000;  }).withMessage('更改資料數量過多'),

        // All values must be string
        body('data.*.*')
            .isString().withMessage('Wrong data format'),

        // For each in data array
        body('data.*.id')
            .isInt({ min:0, max:9999999999 }).withMessage('Wrong data format'),
        body('data.*.name')
            .isLength({ min:1 }).withMessage('名稱不可為空')
            .isLength({ max:20 }).withMessage('名稱長度不可超過 20'),  

        body('data.*.cash')
            .isInt().withMessage('現金額度必須是數字'),
        body('data.*.credit')
            .isInt().withMessage('信用額度必須是數字'),
        body('data.*.frozenBalance')
            .isInt().withMessage('凍結資產必須是數字'),
        body('data.*.posRb')
            .isFloat().withMessage('正退水必須是小數'),
        body('data.*.negRb')
            .isFloat().withMessage('負退水必須是小數'),

        body('data.*.lineId')
            .isLength({ min:0, max:20 }).withMessage('Line Id 長度不可超過 20'),  // length 0 means this field is optional
        body('data.*.wechatId')
            .isLength({ min:0, max:20 }).withMessage('Wechat Id 長度不可超過 20'), 
        body('data.*.facebookId')
            .isLength({ min:0, max:20 }).withMessage('Facebook Id 長度不可超過 20'),
        body('data.*.phoneNumber')
            .isLength({ min:0, max:20 }).withMessage('電話號碼長度不可超過 20')
            .optional({ checkFalsy:true }) // Use optional for isInt, this allows input to be "", 0, null and false, however we check whether it is string above, so it is fine
            .isInt({ min:0 }).withMessage('電話號碼必須是數字'),

        body('data.*.bankSymbol')
            .isLength({ min:0, max:20 }).withMessage('銀行代碼長度不可超過 20')
            .optional({ checkFalsy:true }) // Use optional for isInt, this allows input to be "", 0, null and false, however we check whether it is string above, so it is fine
            .isInt({ min:0 }).withMessage('銀行代號必須是數字'),
        body('data.*.bankName')
            .isLength({ min:0, max:20 }).withMessage('銀行名稱長度不可超過 20'),
        body('data.*.bankAccount')
            .isLength({ min:0, max:20 }).withMessage('銀行帳號長度不可超過 20')
            .optional({ checkFalsy:true }) // Use optional for isInt, this allows input to be "", 0, null and false, however we check whether it is string above, so it is fine
            .isInt({ min:0 }).withMessage('銀行帳號必須是數字'),
        body('data.*.comment')
            .isLength({ min:0, max:40 }).withMessage('備註長度不可超過 40'),
        
        // Sanitize all values 
        sanitizeBody('data.*.*')
            .escape() // Esacpe characters to prevent XSS attack, replace <, >, &, ', " and / with HTML entities
            .trim(), // trim white space from both end
        
        // Check in database
        body('data.*.id').custom(function(data, {req}){

            // Prepare query
            // Based on different of this user, we will use different query string
            let sqlString;
            if(req.user.role === "serviceAgent"){
                let sqlTmpString = `SELECT * 
                                    FROM HeadAgentInfo AS H
                                    WHERE H.id=? AND H.adminId=(SELECT Ser.adminId from ServiceAgentInfo AS Ser WHERE Ser.id=?)`;
                let values = [data, req.user.roleId];
                sqlString = req.db.format(sqlTmpString, values);
            }
            else if(req.user.role === "admin"){
                let sqlTmpString = `SELECT * 
                                    FROM HeadAgentInfo 
                                    WHERE id=? AND adminId=?`;
                let values = [data, req.user.roleId];
                sqlString = req.db.format(sqlTmpString, values);
            }
            else{
                // Invalid role
                return false;
            }

            // Check if duplicate account exists
            return new Promise(function(resolve, reject) {
                req.db.query(sqlString, function(error, results, fields){
                    // error will be an Error if one occurred during the query
                    // results will contain the results of the query
                    // fields will contain information about the returned results fields (if any)
                    if(error) { 
                        return reject('Server 錯誤');
                    }                
                    // This id does not exist or this user has no permission to update
                    else if (results.length <= 0) {
                        return reject('更新無效');
                    }

                    // Validation success, this is a valid update
                    return resolve(true);
                });
            });
        }),
    ];
}

function deleteValidator(){
    return [
        // Check format
        // Data must be array
        body('data')
            .isArray().withMessage('Wrong data format')
            .custom( function(data) { return data.length < 10000;  }).withMessage('更改資料數量過多'),

        // All values must be string
        body('data.*.*')
            .isString().withMessage('Wrong data format'),

        // For each in data array
        body('data.*.id')
            .isInt({ min:0, max:9999999999 }).withMessage('Wrong data format'),
        
    

        // Sanitize all values 
        sanitizeBody('data.*.*')
            .escape() // Esacpe characters to prevent XSS attack, replace <, >, &, ', " and / with HTML entities
            .trim(), // trim white space from both end 


        // Check in database
        body('data.*.id').custom(function(data, {req}){

            // Prepare query
            // Based on different of this user, we will use different query string
            let sqlString;
            if(req.user.role === "serviceAgent"){
                let sqlTmpString = `SELECT * 
                                    FROM HeadAgentInfo AS H
                                    WHERE H.id=? AND H.adminId=(SELECT Ser.adminId from ServiceAgentInfo AS Ser WHERE Ser.id=?)`;
                let values = [data, req.user.roleId];
                sqlString = req.db.format(sqlTmpString, values);
            }
            else if(req.user.role === "admin"){
                let sqlTmpString = `SELECT * 
                                    FROM HeadAgentInfo 
                                    WHERE id=? AND adminId=?`;
                let values = [data, req.user.roleId];
                sqlString = req.db.format(sqlTmpString, values);
            }
            else{
                // Invalid role
                return false;
            }

            // Check if duplicate account exists
            return new Promise(function(resolve, reject) {
                req.db.query(sqlString, function(error, results, fields){
                    // error will be an Error if one occurred during the query
                    // results will contain the results of the query
                    // fields will contain information about the returned results fields (if any)
                    if(error) { 
                        return reject('Server 錯誤');
                    }                
                    // This id does not exist or this user has no permission to update
                    else if (results.length <= 0) {
                        return reject('刪除無效');
                    }

                    // Validation success, this is a valid update
                    return resolve(true);
                });
            });
        }),
    ];
}

// Function for get the admin of this user
// It returns admin instance in db
// Please execute it in try catch 
async function getAdmin(req){
    // Prepare query
    // Based on different of this user, we will use different query string
    let sqlStringCheck;
    let values;
    if(req.user.role === "serviceAgent"){
        let sqlTmpString = `SELECT 
                                *
                            FROM AdminInfo AS Adm
                            WHERE Adm.id=(SELECT Ser.adminId FROM ServiceAgentInfo AS Ser WHERE Ser.id=?)`;
        values = [req.user.roleId];
        sqlStringCheck = req.db.format(sqlTmpString, values);
    }
    else if(req.user.role === "admin"){
        let sqlTmpString = `SELECT 
                                *
                            FROM AdminInfo
                            WHERE id=?`;
        values = [req.user.roleId];
        sqlStringCheck = req.db.format(sqlTmpString, values);
    }
    else{
        throw Error(`權限不足`);
    }

    // Get availBalance and id of this admin
    // Execute query
    let results = await sqlAsync.query(req.db, sqlStringCheck);

    // Check result
    if(results.length <= 0 ) throw Error(`Cannot find admin's avail balance`);

    return results[0];

}

module.exports = {
    render : renderHandler,
    
    read : readHandler,

    create : createHandler,
    createValidate : createValidator(),

    update : updateHandler,
    updateValidate : updateValidator(),

    delete : deleteHandler,
    deleteValidate:  deleteValidator(),
};
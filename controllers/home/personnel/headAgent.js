const 
    sqlAsync = require('../../../libs/sqlAsync'),
    { body, validationResult } = require('express-validator/check'),
    { sanitizeBody } = require('express-validator/filter');



// Page rendering
let renderHandler = function(req,res){
    res.render('home/personnel/head-agent', {layout : 'home'});
};

// Datatable ajax read
let readHandler = async function(req,res){

    // Init return data (must suit DataTable's format)
	let data = {
        data : []
    };

    // Get the admin of this user
    let admin;
    try{
        admin = await getAdmin(req);
    }
    catch(error) {
        console.log(error);
        return res.json({err: true, msg: 'Server 錯誤'});
    }
    
    // Prepare query
    let sqlStringRead = `SELECT 
                            H.id, H.userAccount, H.name,
                            H.cash, H.credit, H.frozenBalance, H.availBalance, H.totalBalance, H.posRb, H.negRb, S.status,
                            H.lineId, H.wechatId, H.facebookId, H.phoneNumber, 
                            H.bankSymbol, H.bankName, H.bankAccount,  H.comment,
                            DATE_FORMAT(CONVERT_TZ(H.createtime, 'UTC', 'Asia/Shanghai'),'%Y-%m-%d %H:%i:%s ') AS createtime,
                            DATE_FORMAT(CONVERT_TZ(H.updatetime, 'UTC', 'Asia/Shanghai'),'%Y-%m-%d %H:%i:%s ') AS updatetime
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

        // Return result
        data.data = results;
        return res.json(data);
    }
    catch(error) {
        console.log(error);
        return res.json(data); 
    }
};

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
    
    // Get the admin of this user
    let admin;
    try{
        admin = await getAdmin(req);
    }
    catch(error) {
        console.log(error);
        return res.json({err: true, msg: 'Server 錯誤'});
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
        return res.json({err: true, msg: 'Server 錯誤'});
    }
    await sqlAsync.query(req.db, 'COMMIT');  // commit transaction only if all statement has executed without error
    
    return res.json({err: false, msg: 'success'});
};

// Datatable ajax update
let updateHandler = async function(req,res){
    
    const result = validationResult(req);
   
    // If the form data is invalid
    if (!result.isEmpty()) {
        // Return the first error to client
        let firstError = result.array()[0].msg;
        return res.json({err: true, msg: firstError});
    }

    // Receive data array
    let updateData = req.body.data;

    // Get the admin of this user
    let admin;
    try{
        admin = await getAdmin(req);
    }
    catch(error) {
        console.log(error);
        return res.json({err: true, msg: 'Server 錯誤'});
    }
    
    // Prepare query for validate availBalance
    let sqlStringCash = `SELECT SUM(cash) AS totalCash
                         FROM HeadAgentInfo
                         WHERE id IN(?)
                         `;
    let values = [ updateData.map((headAgent) => headAgent.id) ]; // bind a list of head agent id to the sql string
    sqlStringCash = req.db.format(sqlStringCash, values);

    // Execute query to get orginal total cash and new total cash of all the head agent that required update
    let newTotalCash = updateData.reduce( (sum, headAgent) => sum + Number(headAgent.cash) ,0);
    let orgTotalCash;
    try {
        let results = await sqlAsync.query(req.db, sqlStringCash);

        // Check result
        if(results.length <= 0 ) throw Error(`Cannot calculate SUM of all head agents' cash`);
        orgTotalCash = results[0].totalCash;
    }
    catch(error) {
        console.log(error);
        return res.json({err: true, msg: 'Server 錯誤'});
    }

    //console.log({newTotalCash, orgTotalCash});

    // Calculate change and validate with admin's availBalance
    if(newTotalCash - orgTotalCash > admin.availBalance){
        return res.json({err: true, msg: 'Admin 現金額度不足'});
    }


    // Now, these updates are all valid, execute all 
    // Prepare query
    // Query for update all head agents
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

    // Query for update admin
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
        return res.json({err: true, msg: 'Server 錯誤'});
    }
    await sqlAsync.query(req.db, 'COMMIT');  // commit transaction only if all statement has executed without error
    
    return res.json({err: false, msg: 'success'});
};

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

    // Get the admin of this user
    let admin;
    try{
        admin = await getAdmin(req);
    }
    catch(error) {
        console.log(error);
        return res.json({err: true, msg: 'Server 錯誤'});
    }


    // Prepare query, get total cash of all the head agents that pepare to be deleted
    let sqlStringCash =`SELECT SUM(cash) AS totalCash
                        FROM HeadAgentInfo
                        WHERE id IN(?)
                        `;
    let values = [ deleteData.map((headAgent) => headAgent.id) ]; // bind a list of head agent id to the sql string
    sqlStringCash = req.db.format(sqlStringCash, values);

    // Get total cash of all the head agents that pepare to be deleted
    // Execute query
    let totalCash;
    try {
        let results = await sqlAsync.query(req.db, sqlStringCash);

        // Check result
        if(results.length <= 0 ) throw Error(`Cannot calculate SUM of all head agents' cash`);
        totalCash = results[0].totalCash;
    }
    catch(error) {
        console.log(error);
        return res.json({err: true, msg: 'Server 錯誤'});
    }

    console.log({totalCash});

    // Now, delete all head agents
    // Prepare query, return cash to admin?
    let sqlStringDel = `DELETE Usr 
                        FROM UserAccount AS Usr
                        WHERE Usr.id IN (   SELECT H.uid 
                                            FROM HeadAgentInfo AS H
                                            WHERE H.id in (?) )
                        ;`;
    values = [ deleteData.map((headAgent) => headAgent.id) ]; // bind a list of head agent id to the sql string
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
        return res.json({err: true, msg: 'Server 錯誤'});
    }
    await sqlAsync.query(req.db, 'COMMIT');  // commit transaction only if all statement has executed without error
    
    return res.json({err: false, msg: 'success'});
};


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
            .isInt({ min:-999999999 , max:999999999}).withMessage('現金額度必須是數字'),
        body('credit')
            .isInt({ min:-999999999 , max:999999999}).withMessage('信用額度必須是數字'),
        body('posRb')
            .isFloat({ min:-100 , max:100}).withMessage('正退水必須是小數'),
        body('negRb')
            .isFloat({ min:-100 , max:100}).withMessage('負退水必須是小數'),

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
        
        // Check duplicate account in database
        body('account').custom(async function(data, {req}){

            // Prepare query
            let sqlString =`SELECT * 
                            FROM UserAccount 
                            WHERE account=?`;
            let values = [data];
            sqlString = req.db.format(sqlString, values);

            // Check if duplicate account exists
            let results;
            try {
                results = await sqlAsync.query(req.db, sqlString);
            }
            catch(error) {
                console.log(error);
                throw Error('Server 錯誤');
            }

            if(results.length > 0) throw Error('使用者帳號重複');

            return true;
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
            .isInt({ min:-999999999 , max:999999999}).withMessage('現金額度必須是數字'),
        body('data.*.credit')
            .isInt({ min:-999999999 , max:999999999}).withMessage('信用額度必須是數字'),
        body('data.*.frozenBalance')
            .isInt({ min:-999999999 , max:999999999}).withMessage('凍結資產必須是數字'),
        body('data.*.posRb')
            .isFloat({ min:-100 , max:100}).withMessage('正退水必須是小數'),
        body('data.*.negRb')
            .isFloat({ min:-100 , max:100}).withMessage('負退水必須是小數'),

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
        
        // Check permission from database
        body('data.*.id').custom(async function(data, {req}){

            // Prepare query
            // Based on different of this user, we will use different query string
            let sqlString, values;
            if(req.user.role === 'serviceAgent'){
                sqlString = `SELECT * 
                             FROM HeadAgentInfo AS H
                             INNER JOIN ServiceAgentInfo AS Ser
                                ON Ser.id=?
                             WHERE H.id=? AND H.adminId=Ser.adminId`;
            }
            else if(req.user.role === 'admin'){
                sqlString = `SELECT * 
                             FROM HeadAgentInfo 
                             WHERE adminId=? AND id=?`;
            }
            else{
                // Invalid role
                throw Error('更新無效');
            }
            values = [req.user.roleId, data];
            sqlString = req.db.format(sqlString, values);

            // Check if this head agent is valid for this user to update
            let results;
            try {
                results = await sqlAsync.query(req.db, sqlString);
            }
            catch(error) {
                console.log(error);
                throw Error('Server 錯誤');
            }

            if(results.length <= 0) throw Error('更新無效');

            return true;
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


        // Check permission from database
        body('data.*.id').custom(async function(data, {req}){

            // Prepare query
            // Based on different of this user, we will use different query string
            let sqlString, values;
            if(req.user.role === 'serviceAgent'){
                sqlString = `SELECT * 
                             FROM HeadAgentInfo AS H
                             INNER JOIN ServiceAgentInfo AS Ser
                                ON Ser.id=?
                             WHERE H.id=? AND H.adminId=Ser.adminId`;
            }
            else if(req.user.role === 'admin'){
                sqlString = `SELECT * 
                             FROM HeadAgentInfo 
                             WHERE adminId=? AND id=?`;
            }
            else{
                // Invalid role
                throw Error('更新無效');
            }
            values = [req.user.roleId, data];
            sqlString = req.db.format(sqlString, values);

            // Check if this head agent is valid for this user to delete
            let results;
            try {
                results = await sqlAsync.query(req.db, sqlString);
            }
            catch(error) {
                console.log(error);
                throw Error('Server 錯誤');
            }

            if(results.length <= 0) throw Error('刪除無效');

            return true;
        }),
    ];
}

// Function for get the admin of this user
// It returns admin instance in db
// Please execute it in try catch 
async function getAdmin(req){
    // Prepare query
    // Based on different of this user, we will use different query string
    let sqlStringCheck, values;
    if(req.user.role === 'serviceAgent'){
        sqlStringCheck  = `SELECT *
                           FROM AdminInfo AS Adm
                           INNER JOIN ServiceAgentInfo AS Ser
                                ON Ser.id=?
                           WHERE Adm.id=Ser.adminId`;
    }
    else if(req.user.role === 'admin'){
        sqlStringCheck = `SELECT *
                          FROM AdminInfo
                          WHERE id=?`;
    }
    else{
        throw Error(`權限不足`);
    }
    values = [req.user.roleId];
    sqlStringCheck = req.db.format(sqlStringCheck, values);

    // Get availBalance and id of this admin
    // Execute query
    let results = await sqlAsync.query(req.db, sqlStringCheck);

    // Check result
    if(results.length <= 0 ) throw Error(`Cannot find the admin of this user`);

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
const 
    sqlTransaction = require('../../../libs/sqlTransaction'),
    { body, validationResult } = require('express-validator/check'),
    { sanitizeBody } = require('express-validator/filter');


// Page rendering
let renderHandler = function(req,res){
    res.render('home/personnel/service-agent', {layout : 'home'});
}

// Datatable ajax read
let readHandler = function(req,res){

    // Get the admin id of this user
    let adminId = req.user.roleId;

    // Init return data (must suit DataTable's format)
	let data = {
    	data : []
    };

    // Prepare query
    let sqlString = `SELECT 
                        Ser.id, Ser.userAccount, Ser.name, S.status,
                        Ser.lineId, Ser.wechatId, Ser.facebookId, Ser.phoneNumber, 
                        Ser.bankSymbol, Ser.bankName, Ser.bankAccount,  Ser.comment, Ser.createtime, Ser.updatetime
                    FROM ServiceAgentInfo AS Ser
                    INNER JOIN UserAccount AS U
                        ON Ser.uid=U.id 
                    INNER JOIN Status AS S
                        ON U.statusId=S.id
                    WHERE Ser.adminId=?`;
    let values = [adminId];
    sqlString = req.db.format(sqlString, values);

    // Search all service agents of this admin
    req.db.query(sqlString, function(error, results, fields){
        // error will be an Error if one occurred during the query
        // results will contain the results of the query
        // fields will contain information about the returned results fields (if any)
        if(error) { 
            console.log(error);
            // return empty data
            return res.json(data);  
        }
                	
        data.data= results;
        return res.json(data);         
    });

}

// Datatable ajax create
let createHandler = function(req,res){

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
            bankSymbol, 
            bankName, 
            bankAccount, 
            phoneNumber, 
            facebookId, 
            lineId, 
            wechatId, 
            comment } = req.body,
        adminId = req.user.roleId,
        role = 'serviceAgent';


    // Insert new user accuont to 2 tables
    // Prepare queries
    let queryStrings = [];

    let sqlString = `INSERT INTO UserAccount (account, password, role, email) VALUES (?, ?, ?, ?)`;
    let values = [account, password, role, email];
    queryStrings.push(req.db.format(sqlString, values));
    
    sqlString =`INSERT INTO ServiceAgentInfo (uid, adminId, userAccount, name, lineId, wechatId, facebookId, phoneNumber, bankSymbol, bankName, bankAccount, comment) 
                VALUES ((SELECT id FROM UserAccount WHERE account=?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
                `;
    values = [account, adminId, account, name, lineId, wechatId, facebookId, phoneNumber, bankSymbol, bankName, bankAccount, comment];
    queryStrings.push(req.db.format(sqlString, values));

    // Execute SQL transaction and return response to client
    sqlTransaction(req.db, queryStrings, function(error, msg){
        // Return the result of transaction to client
        if(error) {
            return res.json({err: true, msg: msg});
        }
        else {
            return res.json({err: false, msg: 'success'});
        }
    });
}

// Datatable ajax update
let updateHandler = function(req,res){
    
    const result = validationResult(req);
   
    // If the form data is invalid
    if (!result.isEmpty()) {
        // Return the first error to client
        let firstError = result.array()[0].msg;
        return res.json({err: true, msg: firstError});
    }

    // Receive data array
    let updateData = req.body.data;
    
    // Prepare queries
    let queryStrings = [];
    
    let sqlString = `UPDATE ServiceAgentInfo 
                            SET name=?, lineId=?, wechatId=?, facebookId=?, phoneNumber=?, 
                                bankSymbol=?, bankName=?, bankAccount=?, comment=?
                            WHERE id=?`;
	for(let i=0 ; i<updateData.length ; i++){
        let element = updateData[i];
        let values = [element.name, element.lineId, element.wechatId, element.facebookId, element.phoneNumber,
            element.bankSymbol, element.bankName, element.bankAccount, element.comment, element.id];

        // Append a statement to query string array
        queryStrings.push(req.db.format(sqlString, values)); 
    }

    // Execute SQL transaction and return response to client
    sqlTransaction(req.db, queryStrings, function(error, msg){
        // Return the result of transaction to client
        if(error) {
            return res.json({err: true, msg: msg});
        }
        else {
            return res.json({err: false, msg: 'success'});
        }
    });
}

// Datatable ajax delete
let deleteHandler = function(req,res){

    const result = validationResult(req);

    // If the form data is invalid
    if (!result.isEmpty()) {
        // Return the first error to client
        let firstError = result.array()[0].msg;
        return res.json({err: true, msg: firstError});
    }

    let deleteData = req.body.data;

    // Prepare queries
    let queryStrings = [];

    let sqlString =`DELETE FROM UserAccount 
                    WHERE id=(SELECT uid 
                              FROM ServiceAgentInfo 
                              WHERE id=?)
                    `;
	for(let i=0 ; i<deleteData.length ; i++){
        let element = deleteData[i];
        let values = [element.id];

        // Append a statement to query string array
        queryStrings.push(req.db.format(sqlString, values));
    }

    // Execute SQL transaction and return response to client
    sqlTransaction(req.db, queryStrings, function(error, msg){
        // Return the result of transaction to client
        if(error) {
            return res.json({err: true, msg: msg});
        }
        else {
            return res.json({err: false, msg: 'success'});
        }
    });
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
            let sqlString =`SELECT * 
                                FROM ServiceAgentInfo 
                                WHERE id=? AND adminId=?`;
            let values = [data, req.user.roleId];
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
                    // This id does not exist or this admin has no permission to update
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
            let sqlString =`SELECT * 
                                FROM ServiceAgentInfo 
                                WHERE id=? AND adminId=?`;
            let values = [data, req.user.roleId];
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
                    // This id does not exist or this admin has no permission to update
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
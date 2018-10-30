const 
    credentials = require('../../configs/credentials'),
    { check, body, validationResult } = require('express-validator/check'),
    { sanitizeBody } = require('express-validator/filter');


let memberHandler = function(req,res){
    res.render('home/personnel/member', {layout : 'home'});
}

let agentHandler = function(req,res){
    res.render('home/personnel/agent', {layout : 'home'});
}

let headAgentHandler = function(req,res){
    res.render('home/personnel/head-agent', {layout : 'home'});
}

let serviceAgentHandler = function(req,res){
    res.render('home/personnel/service-agent', {layout : 'home'});
}

// datatable server-side read
let memberReadHandler = function(req,res){
    let data = {
    
    };

    res.json(data);
}

let agentReadHandler = function(req,res){
    let data = {};

    res.json(data);
}

let headAgentReadHandler = function(req,res){
    let data = {};

    res.json(data);
}

let serviceAgentReadHandler = function(req,res){

    // Get the admin id of this user
    let adminId = req.user.roleId;

    // Init return data (must suit DataTable's format)
	let data = {
    	"data":[]
    };

    // Prepare query
    let sqlString = `SELECT id, name, userAccount, lineId, wechatId,
    				 	facebookId, phoneNumber, bankSymbol, bankName, 
    				 	bankAccount,  comment, createtime, updatetime
                     FROM ServiceAgentInfo
                     WHERE adminId=?
                     `;
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
                	
        data["data"] = results;
        return res.json(data);         
    });

}

// datatable server-side create ajax
let memberCreateHandler = function(req,res){
    let data = {};

    res.json(data);
}

let agentCreateHandler = function(req,res){
    let data = {};

    res.json(data);
}

let headAgentCreateHandler = function(req,res){
    let data = {};

    res.json(data);
}



let serviceAgentCreateHandler = function(req,res){

    // Receive form data from AJAX
    let createData = req.body;
    
    // Return if data is empty
    if(!req.body.account)  {
        res.json({err: true, msg: '空白資料'});
        return;
    }

    console.log(req.body);
    
    
    const 
        {name, account, password, passwordConfirm, email, bankSymbol, bankName, bankAccount, phoneNumber, facebookId, lineId, wechatId, comment} = req.body,
        adminId = req.user.roleId,
        role = 'serviceAgent';

    
    // 
   
    
    // Prepare query
    let sqlString =`SELECT * 
                    FROM UserAccount 
                    WHERE account=?`;
    let values = [account];
    sqlString = req.db.format(sqlString, values);

    // Check if duplicate account exists
    req.db.query(sqlString, function(error, results, fields){
        // error will be an Error if one occurred during the query
        // results will contain the results of the query
        // fields will contain information about the returned results fields (if any)
        if(error) { 
            return res.json({err: true, msg: 'Server錯誤'});
        }                
        // User account is duplicate
        else if (results.length > 0) {
            return res.json({err: true, msg: '使用者帳號重複'});
        }
        
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
        
        console.log(queryStrings);

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

    });
}

// datatable server-side Update ajax
let memberUpdateHandler = function(req,res){
    let data = {};

    res.json(data);
}

let agentUpdateHandler = function(req,res){
    let data = {};

    res.json(data);
}

let headAgentUpdateHandler = function(req,res){
    let data = {};

    res.json(data);
}

let serviceAgentUpdateHandler = function(req,res){
    
    const result = validationResult(req);

    // If the form data is invalid
    if (!result.isEmpty()) {
        // Return the first error to client
        let firstError = result.array()[0].msg;
        return res.json({err: true, msg: firstError});
    }
    
    // Receive data array
    let updateData = req.body.data;
    
    // Return if data is empty
    if(!updateData)  {
        res.json({err: true, msg: '空白資料'});
        return;
    }
    
    // Prepare queries
    let queryStrings = [];
    
    let sqlString = `UPDATE ServiceAgentInfo 
                            SET name=?, lineId=?, wechatId=?, facebookId=?, phoneNumber=?, 
                                bankSymbol=?, bankName=?, bankAccount=?, comment=?
                            WHERE id=?`;
	for(let i=0 ; i<updateData.length ; i++){
        let element = updateData[i];
        let values = [element.name, element.lineId, element.wechatId, element.facebookId, element.phone,
            element.bankAccount, element.bankName, element.bankAccount, element.comment, element.id];

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

// datatable server-side delete ajax
let memberDeleteHandler = function(req,res){
    let data = {};

    res.json(data);
}

let agentDeleteHandler = function(req,res){
    let data = {};

    res.json(data);
}

let headAgentDeleteHandler = function(req,res){
    let data = {};

    res.json(data);
}

let serviceAgentDeleteHandler = function(req,res){

    const result = validationResult(req);

    // If the form data is invalid
    if (!result.isEmpty()) {
        // Return the first error to client
        let firstError = result.array()[0].msg;
        return res.json({err: true, msg: firstError});
    }

    let deleteData = req.body.data;
    
    // Return if data is empty
    if(!deleteData)  {
        res.json({err: true, msg: '空白資料'});
        return;
    }

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

// Function that execute multi SQL statement(strings in an array) inside a SQL transaction
// It will pass success status and message to callback, 
// It also pass all 'successful' results in an array to callback(all results before encounter a fail)
// PS : notice the 'return' before rollback()
function sqlTransaction(db, queryStrings, callback){
    try{
        
		db.beginTransaction(function(error){

            // Some errors happened when init transaction
			if(error) { 
                return callback(true, error);
            }

            // Recursively execute all SQL statements 
            sqlQueries(db, queryStrings, callback, []);
            
		});

	}catch(error){
		return callback(true, error);
	}
}
function sqlQueries(db, queryStrings, callback, allResults){
    
    // Reach end
    if(queryStrings.length <= 0) {
        // SQL execution succeed, commit transaction
        return db.commit(function(error){

            // Something happend when commiting trasaction
            if(error){
                return db.rollback(function(){
                    callback(true, error, allResults);
                })
            }

            // Transaction commit suceed
            return callback(false, 'success', allResults);
        });
    }
    // Still have queries to execute
    else {
        // Extract the first query from query array
        let sqlQuery = queryStrings.shift() + ';';  // use ';' to seperate each SQL statement
        
        // Execute one SQL query
        return db.query(sqlQuery, function(error, results, fields){
            
            // Some errors happend when executing query
            if(error){
                return db.rollback(function(){
                    return callback(true, error, allResults);
                });
                
            }
            else if(results.warningCount > 0){
                console.log(results)
                return db.rollback(function(){
                    return callback(true, 'warning', allResults);
                });

            }

            // Succeed, then add results to array and call the recursive function again
            allResults.push(results);
            sqlQueries(db, queryStrings, callback, allResults);
        });
    }

}

// Form data validate generators
// Invoke it to produce a middleware for validating
function serviceAgentUpdateValidator(){
    return [
        // Data must be array
        body('data')
            .isArray().withMessage('Wrong data format')
            .custom( function(data) { return (data.length < 10000)? true : false;  }).withMessage('更改資料數量過多'),
        // For each in data array
        body('data.*.id')
            .isInt({ min:0, max:9999999999 }).withMessage('Wrong data format'),
        body('data.*.name')
            .isString().withMessage('Wrong data format')
            .isLength({ min:1 }).withMessage('名稱不可為空')
            .isLength({ max:20 }).withMessage('名稱長度不可超過 20'),  
        body('data.*.lineId')
            .isString().withMessage('Wrong data format')
            .isLength({ min:0, max:20 }).withMessage('Line Id 長度不可超過 20'),  // length 0 means this field is optional
        body('data.*.wechatId')
            .isString().withMessage('Wrong data format')
            .isLength({ min:0, max:20 }).withMessage('Wechat Id 長度不可超過 20'), 
        body('data.*.facebookId')
            .isString().withMessage('Wrong data format')
            .isLength({ min:0, max:20 }).withMessage('Facebook Id 長度不可超過 20'),
        body('data.*.phone')
            .isString().withMessage('Wrong data format')
            .isLength({ min:0, max:20 }).withMessage('電話長度不可超過 20'),
        body('data.*.bankSymbol')
            .isString().withMessage('Wrong data format')
            .isLength({ min:0, max:20 }).withMessage('銀行代碼長度不可超過 20')
            .optional({ checkFalsy:true }) // Use optional for isInt, this allows input to be 0, null and false, however node mysql will escpae them, so it is fine
            .isInt({ min:0 }).withMessage('銀行代號必須是數字'),
        body('data.*.bankName')
            .isString().withMessage('Wrong data format')
            .isLength({ min:0, max:20 }).withMessage('銀行名稱長度不可超過 20'),
        body('data.*.bankAccount')
            .isString().withMessage('Wrong data format')
            .isLength({ min:0, max:20 }).withMessage('銀行帳號長度不可超過 20')
            .optional({ checkFalsy:true }) // Use optional for isInt, this allows input to be "", 0, null and false, however node mysql will escpae them, so it is fine
            .isInt({ min:0 }).withMessage('銀行帳號必須是數字'),
        body('data.*.comment')
            .isString().withMessage('Wrong data format')
            .isLength({ min:0, max:30 }).withMessage('備註長度不可超過 30'),
        
        // Sanitize all values 
        sanitizeBody('data.*.*')
            .escape() // Esacpe characters to prevent XSS attack, replace <, >, &, ', " and / with HTML entities
            .trim(), // trim white space from both end

    ];
}

function serviceAgentDeleteValidator(){
    return [
        // Data must be array
        body('data')
            .isArray().withMessage('Wrong data format')
            .custom( function(data) { return (data.length < 10000)? true : false;  }).withMessage('更改資料數量過多'),
        // For each in data array
        body('data.*.id')
            .isInt({ min:0, max:9999999999 }).withMessage('Wrong data format'),
        
        // Sanitize all values 
        sanitizeBody('data.*.*')
            .escape() // Esacpe characters to prevent XSS attack, replace <, >, &, ', " and / with HTML entities
            .trim(), // trim white space from both end 
    ];
}

module.exports = {
    member : memberHandler,
    agent : agentHandler,
    headAgent : headAgentHandler,
    serviceAgent : serviceAgentHandler,

    //Read
    memberRead : memberReadHandler,
    agentRead : agentReadHandler,
    headAgentRead : headAgentReadHandler,
    serviceAgentRead : serviceAgentReadHandler,

    //Create
    memberCreate : memberCreateHandler,
    agentCreate : agentCreateHandler,
    headAgentCreate : headAgentCreateHandler,
    serviceAgentCreate : serviceAgentCreateHandler,

    //Update
    memberUpdate : memberUpdateHandler,
    agentUpdate : agentUpdateHandler,
    headAgentUpdate : headAgentUpdateHandler,
    serviceAgentUpdate : serviceAgentUpdateHandler,
    serviceAgentUpdateValidate : serviceAgentUpdateValidator(),
    

    //Delete
    memberDelete : memberDeleteHandler,
    agentDelete : agentDeleteHandler,
    headAgentDelete : headAgentDeleteHandler,
    serviceAgentDelete : serviceAgentDeleteHandler,
    serviceAgentDeleteValidate:  serviceAgentDeleteValidator(),
};
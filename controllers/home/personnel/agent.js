const 
    sqlAsync = require('../../../libs/sqlAsync'),
    { body, validationResult } = require('express-validator/check'),
    { sanitizeBody } = require('express-validator/filter');



// Page rendering
let renderHandler = async function(req,res){

    // Determine all head agents managed by this user
    // Prepare query
    let sqlString, values;
    if(req.user.role === 'headAgent'){
        sqlString =`SELECT name, userAccount
                    FROM HeadAgentInfo
                    WHERE id=?
                    ;`;
    }
    else if(req.user.role === 'serviceAgent'){
        sqlString =`SELECT H.name, H.userAccount
                    FROM HeadAgentInfo AS H
                    INNER JOIN ServiceAgentInfo AS Ser
                        ON Ser.id=?
                    WHERE H.adminId=Ser.adminId
                    ;`;
    }
    else if(req.user.role === 'admin'){
        sqlString =`SELECT name, userAccount
                    FROM HeadAgentInfo
                    WHERE adminId=?
                    ;`;
    }
    else{
        // Invalid role
        return res.render('home/personnel/agent', {layout : 'home'});
    }
    values = [req.user.roleId];
    sqlString = req.db.format(sqlString, values);

    // Search all head agents managed by this user
    // Render page with head agents' data
    // Execute query
    try {
        let results = await sqlAsync.query(req.db, sqlString);
        return res.render('home/personnel/agent', {layout : 'home', headAgents : results});
    }
    catch(error) {
        console.log(error);
        return res.render('home/personnel/agent', {layout : 'home'});
    }
};

// Datatable ajax read
let readHandler = async function(req,res){

    // Init return data (must suit DataTable's format)
	let data = {
        data : []
    };

    // Determine all agents managed by this user
    // Prepare query
    let sqlString, values;
    if(req.user.role === 'headAgent'){
        sqlString =`SELECT 
                        A.id, A.userAccount, A.name,
                        A.cash, A.credit, Ab.totalCash, Ab.totalFrozen, Ab.totalAvail, A.posRb, A.negRb,
                        S.status, H.name AS headAgentName, H.userAccount AS headAgentAccount,
                        A.lineId, A.wechatId, A.facebookId, A.phoneNumber, 
                        A.bankSymbol, A.bankName, A.bankAccount,  A.comment,
                        DATE_FORMAT(CONVERT_TZ(A.createtime, 'UTC', 'Asia/Shanghai'),'%Y-%m-%d %H:%i:%s ') AS createtime,
                        DATE_FORMAT(CONVERT_TZ(A.updatetime, 'UTC', 'Asia/Shanghai'),'%Y-%m-%d %H:%i:%s ') AS updatetime
                    FROM AgentInfo AS A
                    INNER JOIN AgentBalance AS Ab
                            ON A.id = Ab.id
                    INNER JOIN UserAccount AS U
                        ON A.uid=U.id 
                    INNER JOIN Status AS S
                        ON U.statusId=S.id
                    INNER JOIN HeadAgentInfo AS H
                        ON A.headAgentId=H.id AND H.id=?
                    ;`;
    }
    else if(req.user.role === 'serviceAgent'){
        sqlString =`SELECT 
                        A.id, A.userAccount, A.name,
                        A.cash, A.credit, Ab.totalCash, Ab.totalFrozen, Ab.totalAvail, A.posRb, A.negRb,
                        S.status, H.name AS headAgentName, H.userAccount AS headAgentAccount,
                        A.lineId, A.wechatId, A.facebookId, A.phoneNumber, 
                        A.bankSymbol, A.bankName, A.bankAccount,  A.comment, 
                        DATE_FORMAT(CONVERT_TZ(A.createtime, 'UTC', 'Asia/Shanghai'),'%Y-%m-%d %H:%i:%s ') AS createtime,
                        DATE_FORMAT(CONVERT_TZ(A.updatetime, 'UTC', 'Asia/Shanghai'),'%Y-%m-%d %H:%i:%s ') AS updatetime
                    FROM AgentInfo AS A
                    INNER JOIN AgentBalance AS Ab
                            ON A.id = Ab.id
                    INNER JOIN UserAccount AS U
                        ON A.uid=U.id 
                    INNER JOIN Status AS S
                        ON U.statusId=S.id
                    
                    INNER JOIN ServiceAgentInfo AS Ser
                        ON Ser.id=?
                    INNER JOIN HeadAgentInfo AS H
                        ON A.headAgentId=H.id AND H.adminId=Ser.adminId
                    ;`;
    }
    else if(req.user.role === 'admin'){
        sqlString =`SELECT 
                        A.id, A.userAccount, A.name,
                        A.cash, A.credit, Ab.totalCash, Ab.totalFrozen, Ab.totalAvail, A.posRb, A.negRb,
                        S.status, H.name AS headAgentName, H.userAccount AS headAgentAccount,
                        A.lineId, A.wechatId, A.facebookId, A.phoneNumber, 
                        A.bankSymbol, A.bankName, A.bankAccount,  A.comment, 
                        DATE_FORMAT(CONVERT_TZ(A.createtime, 'UTC', 'Asia/Shanghai'),'%Y-%m-%d %H:%i:%s ') AS createtime,
                        DATE_FORMAT(CONVERT_TZ(A.updatetime, 'UTC', 'Asia/Shanghai'),'%Y-%m-%d %H:%i:%s ') AS updatetime
                    FROM AgentInfo AS A
                    INNER JOIN AgentBalance AS Ab
                            ON A.id = Ab.id
                    INNER JOIN UserAccount AS U
                        ON A.uid=U.id 
                    INNER JOIN Status AS S
                        ON U.statusId=S.id
                        
                    INNER JOIN HeadAgentInfo AS H
                        ON A.headAgentId=H.id AND H.adminId=?
                    ;`;
    }
    else{
        // Invalid role
        return res.json(data); 
    }
    values = [req.user.roleId];
    sqlString = req.db.format(sqlString, values);
    
    // Search all agents managed by this user
    // Execute query
    try {
        let results = await sqlAsync.query(req.db, sqlString);

        // Add a new prop(headAgent) to return data
        data.data = results.map( (row) => ({ ...row, headAgent : `${row.headAgentName}(${row.headAgentAccount})`})  );
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
            headAgentAccount,
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
    
    // Prepare query
    let sqlString =`SELECT * FROM HeadAgentInfo WHERE userAccount=?`; 
    let values = [headAgentAccount];
    sqlString = req.db.format(sqlString, values);
    
    // Get the head agent of the new agent
    // Execute query
    let headAgent;
    try{
        let results = await sqlAsync.query(req.db, sqlString); 

        // Check result
        if(results.length <= 0 ) throw Error(`Cannot find head agent`);
        headAgent = results[0];
    }
    catch(error) {
        console.log(error);
        return res.json({err: true, msg: 'Server 錯誤'});
    }

    // Prepare query
    // Query for insert into UserAccount
    let sqlStringInsert1 = `INSERT INTO UserAccount (account, password, role, email) VALUES (?, ?, ?, ?);`;
    values = [account, password, 'agent', email];
    sqlStringInsert1 = req.db.format(sqlStringInsert1, values);

    // Query for insert into AgentInfo
    let sqlStringInsert2 = `INSERT INTO AgentInfo (
                                uid, headAgentId, userAccount, name, 
                                cash, credit, posRb, negRb, 
                                lineId, wechatId, facebookId, phoneNumber, 
                                bankSymbol, bankName, bankAccount, comment) 
                            VALUES ((SELECT id FROM UserAccount WHERE account=?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
                            ;`;
    values = [  account, headAgent.id, account, name, 
                cash, credit, posRb, negRb,
                lineId, wechatId, facebookId, phoneNumber, 
                bankSymbol, bankName, bankAccount, comment];
    sqlStringInsert2 = req.db.format(sqlStringInsert2, values);

    // Query for update headAgentInfo cash and frozenBalance
    let sqlStringUpdate = ` UPDATE HeadAgentInfo
                            SET cash=cash-?
                            WHERE id=?
                            ;`;
    values = [cash, headAgent.id];
    sqlStringUpdate = req.db.format(sqlStringUpdate, values);

    // Insert new agent
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

    // Prepare query
    // Query for update all agents
    let sqlStringTmp = `UPDATE AgentInfo 
                        SET  name=?, credit=?, posRb=?, negRb=?,
                            lineId=?, wechatId=?, facebookId=?, phoneNumber=?, 
                            bankSymbol=?, bankName=?, bankAccount=?, comment=?
                        WHERE id=?
                        ;`;
    let sqlStringUpdate = '';
    for(let i=0 ; i<updateData.length ; i++) {
        let element = updateData[i];
        let values = [  element.name, element.credit, element.posRb, element.negRb,
                        element.lineId, element.wechatId, element.facebookId, element.phoneNumber,
                        element.bankSymbol, element.bankName, element.bankAccount, element.comment, element.id];
        sqlStringUpdate  += req.db.format(sqlStringTmp, values);
    }

    // Execute all queries
    try{
        await sqlAsync.query(req.db, 'START TRANSACTION');
        let results = await sqlAsync.query(req.db, sqlStringUpdate);
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

    // Prepare query, get head agent for each agent
    let sqlString =`SELECT 
                        A.id AS id, H.id AS headAgentId
                    FROM AgentInfo AS A
                    INNER JOIN HeadAgentInfo AS H 
                        ON A.headAgentId=H.id
                    WHERE A.id IN (?)
                    ;`;
    let values = [ deleteData.map( (obj) => (obj.id) ) ] ; // bind a list of agent id to the sql string
    sqlString = req.db.format(sqlString, values); 

    // Get head agent for each agent
    // Execute query
    let headAgentList;
    try{
        let results = await sqlAsync.query(req.db, sqlString); 

        // Check result
        if(results.length <= 0 ) throw Error(`Cannot find head agent`);

        // Augment headAgentId for each agent in update data 
        deleteData.forEach( function(agent) {
            agent.headAgentId = results.find(  row => row.id === Number(agent.id)  ).headAgentId;
        });

        // Get a distinct list of all involved head agents
        headAgentList = results.map( (row) => ({ id: row.headAgentId}) );
        headAgentList = headAgentList.reduce( function(newList, headAgent){
            if(!newList.find(element => element.id === headAgent.id))  
                newList.push(headAgent);
            return newList;
        }  , []);
    }
    catch(error) {
        console.log(error);
        return res.json({err: true, msg: 'Server 錯誤'});
    }

    console.log({headAgentList});

    // Ready to delete
    // Start Trnasaction first
    try{
        await sqlAsync.query(req.db, 'START TRANSACTION');
        
        // For each head agent, delete its agents
        for(let i=0 ; i<headAgentList.length ; i++){
            let curHeadAgent = headAgentList[i];
            let curAgentList = deleteData.filter(agent => agent.headAgentId === curHeadAgent.id);

            // Prepare query, get total cash of all the agents that pepare to be deleted
            let sqlStringCash =`SELECT SUM(cash) AS totalCash
                                FROM AgentInfo
                                WHERE id IN(?)
                                `;
            values = [ curAgentList.map((agent) => agent.id) ]; // bind a list of agent id to the sql string
            sqlStringCash = req.db.format(sqlStringCash, values);
            
            // Get total cash of all the agents that pepare to be deleted
            // Execute query
            let results = await sqlAsync.query(req.db, sqlStringCash);

            // Check result
            if(results.length <= 0 ) throw Error(`Cannot calculate SUM of all agents' cash`);
            let totalCash = results[0].totalCash;

            console.log({totalCash});

            // Now, delete all agents
            // Prepare query, return cash to headAgent?
            let sqlStringDel = `DELETE Usr
                                FROM UserAccount AS Usr
                                WHERE Usr.id IN (   SELECT A.uid 
                                                    FROM AgentInfo AS A
                                                    WHERE A.id in (?) )
                                ;`;
            values = [ curAgentList.map((agent) => agent.id) ]; // bind a list of agent id to the sql string
            sqlStringDel = req.db.format(sqlStringDel, values);

            let sqlStringUpdate =`  UPDATE HeadAgentInfo
                                    SET cash=cash+?
                                    WHERE id=?
                                    ;`;
            values = [totalCash, curHeadAgent.id];
            sqlStringUpdate = req.db.format(sqlStringUpdate, values);

            // Execute all queries
            await sqlAsync.query(req.db, sqlStringDel +  sqlStringUpdate);
        }

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
            .isLength({ max:20 }).withMessage('帳號長度不可超過 20')
            .isAlphanumeric().withMessage('帳號只能含有數字或英文字母'),
        body('password')
            .isLength({ min:1 }).withMessage('密碼不可為空')
            .isLength({ max:20 }).withMessage('密碼長度不可超過 20')
            .isAlphanumeric().withMessage('密碼只能含有數字或英文字母'),
        body('passwordConfirm')
            .custom( function(data, {req}) { return data === req.body.password; }).withMessage('確認密碼與密碼不相同'),
        body('email')
            .isLength({ min:0, max:40 }).withMessage('信箱長度不可超過 40')
            .optional({ checkFalsy:true }) // Use optional for isInt, this allows input to be "", 0, null and false, however we check whether it is string above, so it is fine
            .isEmail({ min:0 }).withMessage('信箱格式錯誤'), 
        
        body('headAgentAccount')
            .isLength({ min:1 }).withMessage('總代理商不可為空')
            .isLength({ max:20 }).withMessage('總代理商帳號錯誤'),
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

        // Check head agent account against this user
        body('headAgentAccount').custom(async function(data, {req}){

            if(req.user.role === 'headAgent' && req.user.account === data){
                return true;  // Head agent account must equal to the user's account, if that user is a head agent  
            }

            // Prepare query
            // Based on different of this user, we will use different query string
            let sqlString, values;
            if(req.user.role === 'serviceAgent'){
                sqlString =`SELECT *
                            FROM HeadAgentInfo AS H
                            INNER JOIN ServiceAgentInfo AS Ser
                                ON Ser.id=?
                            WHERE H.adminId=Ser.id AND H.userAccount=? 
                            ;`;
            }
            else if(req.user.role === 'admin'){
                sqlString =`SELECT *
                            FROM HeadAgentInfo AS H
                            WHERE H.adminId=? AND H.userAccount=? 
                            ;`;
            }
            else{
                // All other circumstances are invalid
                throw Error('總代理商錯誤');
            }

            values = [req.user.roleId, data];
            sqlString = req.db.format(sqlString, values);

            // Check if this head agent is managed by this user
            let results;
            try {
                results = await sqlAsync.query(req.db, sqlString);
            }
            catch(error) {
                console.log(error);
                throw Error('Server 錯誤');
            }

            if(results.length <= 0) throw Error('新增無效');

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

        body('data.*.credit')
            .isInt({ min:-999999999 , max:999999999}).withMessage('信用額度必須是數字'),
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
            if(req.user.role === 'headAgent'){
                sqlString =`SELECT *
                            FROM AgentInfo AS A
                            WHERE A.headAgentId=? AND A.id=?
                            ;`;
            }
            else if(req.user.role === 'serviceAgent'){
                sqlString =`SELECT *
                            FROM AgentInfo AS A
                            INNER JOIN ServiceAgentInfo AS Ser
                                ON Ser.id=?
                            INNER JOIN HeadAgentInfo AS H
                                ON A.headAgentId=H.id AND H.adminId=Ser.adminId
                            WHERE A.id=?
                            ;`;
            }
            else if(req.user.role === 'admin'){
                sqlString =`SELECT *
                            FROM AgentInfo AS A
                            INNER JOIN HeadAgentInfo AS H
                                ON A.headAgentId=H.id AND H.adminId=?
                            WHERE A.id=?
                            ;`;
            }
            else {
                // Invalid role
                throw Error('更新無效');
            }
            values = [req.user.roleId, data];
            sqlString = req.db.format(sqlString, values);

            // Check if this agent is valid for this user to update
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
            if(req.user.role === 'headAgent'){
                sqlString =`SELECT *
                            FROM AgentInfo AS A
                            WHERE A.headAgentId=? AND A.id=?
                            ;`;
            }
            else if(req.user.role === 'serviceAgent'){
                sqlString =`SELECT *
                            FROM AgentInfo AS A
                            INNER JOIN ServiceAgentInfo AS Ser
                                ON Ser.id=?
                            INNER JOIN HeadAgentInfo AS H
                                ON A.headAgentId=H.id AND H.adminId=Ser.adminId
                            WHERE A.id=?
                            ;`;
            }
            else if(req.user.role === 'admin'){
                sqlString =`SELECT *
                            FROM AgentInfo AS A
                            INNER JOIN HeadAgentInfo AS H
                                ON A.headAgentId=H.id AND H.adminId=?
                            WHERE A.id=?
                            ;`;
            }
            else {
                // Invalid role
                throw Error('刪除無效');
            }
            values = [req.user.roleId, data];
            sqlString = req.db.format(sqlString, values);

            // Check if this agent is valid for this user to delete
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
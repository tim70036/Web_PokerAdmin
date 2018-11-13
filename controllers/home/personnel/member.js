const 
    sqlAsync = require('../../../libs/sqlAsync'),
    { body, validationResult } = require('express-validator/check'),
    { sanitizeBody } = require('express-validator/filter');



// Page rendering
let renderHandler = async function(req,res){

    // Determine all agents managed by this user
    // Prepare query
    let sqlString, values;
    if(req.user.role === 'agent'){
        sqlString =`SELECT name, userAccount
                    FROM AgentInfo
                    WHERE id=?
                    ;`;
    }
    else if(req.user.role === 'headAgent'){
        sqlString =`SELECT name, userAccount
                    FROM AgentInfo
                    WHERE headAgentId=?
                    ;`;
    }
    else if(req.user.role === 'serviceAgent'){
        sqlString =`SELECT A.name, A.userAccount
                    FROM AgentInfo AS A
                    INNER JOIN ServiceAgentInfo AS Ser
                        ON Ser.id=?
                    INNER JOIN HeadAgentInfo AS H
                        ON A.headAgentId=H.id AND H.adminId=Ser.adminId
                    ;`;
    }
    else if(req.user.role === 'admin'){
        sqlString =`SELECT A.name, A.userAccount
                    FROM AgentInfo AS A
                    INNER JOIN HeadAgentInfo AS H
                        ON A.headAgentId=H.id AND H.adminId=?
                    ;`;
    }
    else{
        // Invalid role
        return res.redirect(303, '/');
    }
    values = [req.user.roleId];
    sqlString = req.db.format(sqlString, values);

    // Search all head agents managed by this user
    // Render page with head agents' data
    // Execute query
    try {
        let results = await sqlAsync.query(req.db, sqlString);
        return res.render('home/personnel/member', {layout : 'home', agents : results});
    }
    catch(error) {
        console.log(error);
        return res.render('home/personnel/member', {layout : 'home'});
    }
};

// Datatable ajax read
let readHandler = async function(req,res){

    // Init return data (must suit DataTable's format)
	let data = {
        data : []
    };

    // Determine all members managed by this user
    // Prepare query
    let sqlString, values;
    if(req.user.role === 'agent'){
        sqlString =`SELECT 
                        M.id, M.userAccount, M.name,
                        M.cash, M.credit, M.frozenBalance, M.availBalance, M.totalBalance, M.rb,
                        S.status, A.name AS agentName, A.userAccount AS agentAccount,
                        M.lineId, M.wechatId, M.facebookId, M.phoneNumber, 
                        M.bankSymbol, M.bankName, M.bankAccount,  M.comment,
                        DATE_FORMAT(CONVERT_TZ(M.createtime, 'UTC', 'Asia/Shanghai'),'%Y-%m-%d %H:%i:%s ') AS createtime,
                        DATE_FORMAT(CONVERT_TZ(M.updatetime, 'UTC', 'Asia/Shanghai'),'%Y-%m-%d %H:%i:%s ') AS updatetime
                    FROM MemberInfo AS M
                    INNER JOIN UserAccount AS U
                        ON M.uid=U.id 
                    INNER JOIN Status AS S
                        ON U.statusId=S.id
                    INNER JOIN AgentInfo AS A
                        ON M.agentId=A.id AND A.id=?
                    ;`;
    }
    else if(req.user.role === 'headAgent'){
        sqlString =`SELECT 
                        M.id, M.userAccount, M.name,
                        M.cash, M.credit, M.frozenBalance, M.availBalance, M.totalBalance, M.rb,
                        S.status, A.name AS agentName, A.userAccount AS agentAccount,
                        M.lineId, M.wechatId, M.facebookId, M.phoneNumber, 
                        M.bankSymbol, M.bankName, M.bankAccount,  M.comment,
                        DATE_FORMAT(CONVERT_TZ(M.createtime, 'UTC', 'Asia/Shanghai'),'%Y-%m-%d %H:%i:%s ') AS createtime,
                        DATE_FORMAT(CONVERT_TZ(M.updatetime, 'UTC', 'Asia/Shanghai'),'%Y-%m-%d %H:%i:%s ') AS updatetime
                    FROM MemberInfo AS M
                    INNER JOIN UserAccount AS U
                        ON M.uid=U.id 
                    INNER JOIN Status AS S
                        ON U.statusId=S.id
                    INNER JOIN AgentInfo AS A
                        ON M.agentId=A.id AND A.headAgentId=?
                    ;`;
    }
    else if(req.user.role === 'serviceAgent'){
        sqlString =`SELECT 
                        M.id, M.userAccount, M.name,
                        M.cash, M.credit, M.frozenBalance, M.availBalance, M.totalBalance, M.rb,
                        S.status, A.name AS agentName, A.userAccount AS agentAccount,
                        M.lineId, M.wechatId, M.facebookId, M.phoneNumber, 
                        M.bankSymbol, M.bankName, M.bankAccount,  M.comment,
                        DATE_FORMAT(CONVERT_TZ(M.createtime, 'UTC', 'Asia/Shanghai'),'%Y-%m-%d %H:%i:%s ') AS createtime,
                        DATE_FORMAT(CONVERT_TZ(M.updatetime, 'UTC', 'Asia/Shanghai'),'%Y-%m-%d %H:%i:%s ') AS updatetime
                    FROM MemberInfo AS M
                    INNER JOIN UserAccount AS U
                        ON M.uid=U.id 
                    INNER JOIN Status AS S
                        ON U.statusId=S.id

                    INNER JOIN ServiceAgentInfo AS Ser
                        ON Ser.id=?
                    INNER JOIN AgentInfo AS A
                        ON M.agentId=A.id
                    INNER JOIN HeadAgentInfo AS H
                        ON A.headAgentId=H.id AND H.adminId=Ser.adminId
                    ;`;
    }
    else if(req.user.role === 'admin'){
        sqlString =`SELECT 
                        M.id, M.userAccount, M.name,
                        M.cash, M.credit, M.frozenBalance, M.availBalance, M.totalBalance, M.rb,
                        S.status, A.name AS agentName, A.userAccount AS agentAccount,
                        M.lineId, M.wechatId, M.facebookId, M.phoneNumber, 
                        M.bankSymbol, M.bankName, M.bankAccount,  M.comment,
                        DATE_FORMAT(CONVERT_TZ(M.createtime, 'UTC', 'Asia/Shanghai'),'%Y-%m-%d %H:%i:%s ') AS createtime,
                        DATE_FORMAT(CONVERT_TZ(M.updatetime, 'UTC', 'Asia/Shanghai'),'%Y-%m-%d %H:%i:%s ') AS updatetime
                    FROM MemberInfo AS M
                    INNER JOIN UserAccount AS U
                        ON M.uid=U.id 
                    INNER JOIN Status AS S
                        ON U.statusId=S.id

                    INNER JOIN AgentInfo AS A
                        ON M.agentId=A.id
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

        // Add a new prop(agent) to return data
        data.data = results.map( (row) => ({ ...row, agent : `${row.agentName}(${row.agentAccount})`})  );
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

    console.log(req.body);

    // Gather all required data
    const 
        {   name, 
            account, 
            password, 
            passwordConfirm, 
            email, 
            agentAccount,
            cash,
            credit,
            rb,
            bankSymbol, 
            bankName, 
            bankAccount, 
            phoneNumber, 
            facebookId, 
            lineId, 
            wechatId, 
            comment } = req.body;
    
    // Prepare query
    let sqlString =`SELECT * FROM AgentInfo WHERE userAccount=?`; 
    let values = [agentAccount];
    sqlString = req.db.format(sqlString, values);

    // Get the agent of the new member
    // Execute query
    let agent;
    try{
        let results = await sqlAsync.query(req.db, sqlString); 

        // Check result
        if(results.length <= 0 ) throw Error(`Cannot find agent`);
        agent = results[0];
    }
    catch(error) {
        console.log(error);
        return res.json({err: true, msg: 'Server 錯誤'});
    }

    // Prepare query
    // Query for insert into UserAccount
    let sqlStringInsert1 = `INSERT INTO UserAccount (account, password, role, email) VALUES (?, ?, ?, ?);`;
    values = [account, password, 'member', email];
    sqlStringInsert1 = req.db.format(sqlStringInsert1, values);

    // Query for insert into MemberInfo
    let sqlStringInsert2 = `INSERT INTO MemberInfo (
                                uid, agentId, userAccount, name, 
                                cash, credit, frozenBalance, rb, 
                                lineId, wechatId, facebookId, phoneNumber, 
                                bankSymbol, bankName, bankAccount, comment) 
                            VALUES ((SELECT id FROM UserAccount WHERE account=?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
                            ;`;
    values = [  account, agent.id, account, name, 
                cash, credit, 0, rb,
                lineId, wechatId, facebookId, phoneNumber, 
                bankSymbol, bankName, bankAccount, comment];
    sqlStringInsert2 = req.db.format(sqlStringInsert2, values);

    // Query for update AgentInfo cash 
    let sqlStringUpdate = ` UPDATE AgentInfo
                            SET cash=cash-?
                            WHERE id=?
                            ;`;
    values = [cash, agent.id];
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
    // Query for update all members
    let sqlStringTmp = `UPDATE MemberInfo 
                        SET  name=?, credit=?, rb=?,
                            lineId=?, wechatId=?, facebookId=?, phoneNumber=?, 
                            bankSymbol=?, bankName=?, bankAccount=?, comment=?
                        WHERE id=?
                        ;`;
    let sqlStringUpdate = '';
    for(let i=0 ; i<updateData.length ; i++) {
        let element = updateData[i];
        let values = [  element.name, element.credit, element.rb,
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

    // Prepare query, get agent for each member
    let sqlString =`SELECT 
                        M.id AS id, A.id AS agentId
                    FROM MemberInfo AS M
                    INNER JOIN AgentInfo AS A 
                        ON M.agentId=A.id
                    WHERE M.id IN (?)
                    ;`;
    let values = [ deleteData.map( (obj) => (obj.id) ) ] ; // bind a list of member id to the sql string
    sqlString = req.db.format(sqlString, values); 

    // Get agent for each member
    // Execute query
    let agentList;
    try{
        let results = await sqlAsync.query(req.db, sqlString); 

        // Check result
        if(results.length <= 0 ) throw Error(`Cannot find agent`);

        // Augment agentId for each member in update data 
        deleteData.forEach( function(member) {
            member.agentId = results.find(  row => row.id === Number(member.id)  ).agentId;
        });

        // Get a distinct list of all involved agents
        agentList = results.map( (row) => ({ id: row.agentId}) );
        agentList = agentList.reduce( function(newList, agent){
            if(!newList.find(element => element.id === agent.id))  
                newList.push(agent);
            return newList;
        }  , []);
    }
    catch(error) {
        console.log(error);
        return res.json({err: true, msg: 'Server 錯誤'});
    }

    console.log({agentList});

    // Ready to delete
    // Start Trnasaction first
    try{
        await sqlAsync.query(req.db, 'START TRANSACTION');
        
        // For each agent, delete its members
        for(let i=0 ; i<agentList.length ; i++){
            let curAgent = agentList[i];
            let curMemberList = deleteData.filter(member => member.agentId === curAgent.id);

            // Prepare query, get total cash of all the members that pepare to be deleted
            let sqlStringCash =`SELECT SUM(cash) AS totalCash
                                FROM MemberInfo
                                WHERE id IN(?)
                                `;
            values = [ curMemberList.map((member) => member.id) ]; // bind a list of member id to the sql string
            sqlStringCash = req.db.format(sqlStringCash, values);
            
            // Get total cash of all the members that pepare to be deleted
            // Execute query
            let results = await sqlAsync.query(req.db, sqlStringCash);

            // Check result
            if(results.length <= 0 ) throw Error(`Cannot calculate SUM of all members' cash`);
            let totalCash = results[0].totalCash;

            console.log({totalCash});

            // Now, delete all members
            // Prepare query, return cash to agent?
            let sqlStringDel = `DELETE Usr
                                FROM UserAccount AS Usr
                                WHERE Usr.id IN (   SELECT M.uid 
                                                    FROM MemberInfo AS M
                                                    WHERE M.id in (?) )
                                ;`;
            values = [ curMemberList.map((member) => member.id) ]; // bind a list of member id to the sql string
            sqlStringDel = req.db.format(sqlStringDel, values);

            let sqlStringUpdate =`  UPDATE AgentInfo
                                    SET cash=cash+?
                                    WHERE id=?
                                    ;`;
            values = [totalCash, curAgent.id];
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
        
        body('agentAccount')
            .isLength({ min:1 }).withMessage('代理商不可為空')
            .isLength({ max:20 }).withMessage('代理商帳號錯誤'),
        body('cash')
            .isInt({ min:-999999999 , max:999999999}).withMessage('現金額度必須是數字'),
        body('credit')
            .isInt({ min:-999999999 , max:999999999}).withMessage('信用額度必須是數字'),
        body('rb')
            .isFloat({ min:-100 , max:100}).withMessage('退水必須是小數'),

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

        // Check agent account against this user
        body('agentAccount').custom(async function(data, {req}){

            if(req.user.role === 'agent' && req.user.account === data){
                return true;  // Agent account must equal to the user's account, if that user is a agent  
            }

            // Prepare query
            // Based on different of this user, we will use different query string
            let sqlString, values;
            if(req.user.role === 'headAgent') {
                sqlString =`SELECT *
                            FROM AgentInfo AS A
                            WHERE A.headAgentId=? AND A.userAccount=? 
                            ;`;
            }
            else if(req.user.role === 'serviceAgent') {
                sqlString =`SELECT *
                            FROM AgentInfo AS A
                            INNER JOIN ServiceAgentInfo AS Ser
                                ON Ser.id=?
                            INNER JOIN HeadAgentInfo AS H
                                ON A.headAgentId=H.id AND H.adminId=Ser.adminId
                            WHERE A.userAccount=?
                            ;`;
            }
            else if(req.user.role === 'admin') {
                sqlString =`SELECT *
                            FROM AgentInfo AS A
                            INNER JOIN HeadAgentInfo AS H
                                ON A.headAgentId=H.id AND H.adminId=?
                            WHERE A.userAccount=?
                            ;`;
            }
            else{
                // All other circumstances are invalid
                throw Error('代理商錯誤');
            }

            values = [req.user.roleId, data];
            sqlString = req.db.format(sqlString, values);

            // Check if this agent is managed by this user
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
        body('data.*.rb')
            .isFloat({ min:-100 , max:100}).withMessage('退水必須是小數'),

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
            if(req.user.role === 'agent'){
                sqlString =`SELECT *
                            FROM MemberInfo AS M
                            WHERE M.agentId=? AND M.id=?
                            ;`;
            }
            else if(req.user.role === 'headAgent'){
                sqlString =`SELECT *
                            FROM MemberInfo AS M
                            INNER JOIN AgentInfo AS A
                                ON M.agentId=A.id AND A.headAgentId=?
                            WHERE M.id=?
                            ;`;
            }
            else if(req.user.role === 'serviceAgent'){
                sqlString =`SELECT *
                            FROM MemberInfo AS M
                            INNER JOIN ServiceAgentInfo AS Ser
                                ON Ser.id=?
                            INNER JOIN AgentInfo AS A
                                ON M.agentId=A.id
                            INNER JOIN HeadAgentInfo AS H
                                ON A.headAgentId=H.id AND H.adminId=Ser.adminId
                            WHERE M.id=?
                            ;`;
            }
            else if(req.user.role === 'admin'){
                sqlString =`SELECT *
                            FROM MemberInfo AS M
                            INNER JOIN AgentInfo AS A
                                ON M.agentId=A.id
                            INNER JOIN HeadAgentInfo AS H
                                ON A.headAgentId=H.id AND H.adminId=?
                            WHERE M.id=?
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
            if(req.user.role === 'agent'){
                sqlString =`SELECT *
                            FROM MemberInfo AS M
                            WHERE M.agentId=? AND M.id=?
                            ;`;
            }
            else if(req.user.role === 'headAgent'){
                sqlString =`SELECT *
                            FROM MemberInfo AS M
                            INNER JOIN AgentInfo AS A
                                ON M.agentId=A.id AND A.headAgentId=?
                            WHERE M.id=?
                            ;`;
            }
            else if(req.user.role === 'serviceAgent'){
                sqlString =`SELECT *
                            FROM MemberInfo AS M
                            INNER JOIN ServiceAgentInfo AS Ser
                                ON Ser.id=?
                            INNER JOIN AgentInfo AS A
                                ON M.agentId=A.id
                            INNER JOIN HeadAgentInfo AS H
                                ON A.headAgentId=H.id AND H.adminId=Ser.adminId
                            WHERE M.id=?
                            ;`;
            }
            else if(req.user.role === 'admin'){
                sqlString =`SELECT *
                            FROM MemberInfo AS M
                            INNER JOIN AgentInfo AS A
                                ON M.agentId=A.id
                            INNER JOIN HeadAgentInfo AS H
                                ON A.headAgentId=H.id AND H.adminId=?
                            WHERE M.id=?
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
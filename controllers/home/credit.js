const 
    sqlAsync = require('../../libs/sqlAsync'),
    { body, validationResult } = require('express-validator/check'),
    { sanitizeBody } = require('express-validator/filter');


let transferRenderHandler = async function(req,res){
    
    // Get all accounts managed by this user
    try {
        // Collect all accounts infos managed by this user, including this user itself
        let managedAccounts = await getManagedUsers(req);

        // Add an index to each row for rednering in Select2
        managedAccounts.forEach(function(row, index){
            row.stateColor = (row.cash > 0) ? 'info' : 'danger';
            return;
        });
        //console.log(managedAccounts);
        return res.render('home/credit/transfer', {layout : 'home', managedAccounts : managedAccounts});
    } catch (error) {
        console.log(error);
        return res.render('home/credit/transfer', {layout : 'home'});
    }

};

let historyHandler = function(req,res){
    res.render('home/credit/history', {layout : 'home'});
};

let transferFormHandler = async function(req,res){

    const result = validationResult(req);

    // If the form data is invalid
    if (!result.isEmpty()) {
        // Return the first error to client
        let firstError = result.array()[0].msg;
        return res.json({err: true, msg: firstError});
    }

    // Gather all required data
    const 
        {   accountFrom,
            accountTo,
            amount,
            comment, } = req.body;

    console.log(req.body);
    
    // Collect all accounts infos managed by this user, including this user itself
    let managedAccounts = await getManagedUsers(req);

    // If accountFrom is not found, then sender is invalid
    let sender = managedAccounts.find( row => (row.account === accountFrom));
    if(!sender) return res.json({err: true, msg: '轉帳無效'});
    
    // If accountTo is not found, then receiver is invalid
    let receiver = managedAccounts.find( row => (row.account === accountTo));
    if(!receiver) return res.json({err: true, msg: '轉帳無效'});
    
    // Determine update table for sender and receiver 
    let roleToTable = {
        'admin' : 'AdminInfo',
        'serviceAgent' : 'ServiceAgentInfo',
        'headAgent' : 'HeadAgentInfo',
        'agent' : 'AgentInfo',
        'member' : 'MemberInfo',
    };
    sender.table = roleToTable[sender.role];
    receiver.table = roleToTable[receiver.role];



    console.log(managedAccounts);
    console.log({sender, receiver});

    // Prepare query
    // Query for update sender
    let sqlStringSender = `UPDATE ??
                           SET cash=cash-?
                           WHERE uid=?
                           ;`;
    let values = [sender.table, amount, sender.uid];
    sqlStringSender = req.db.format(sqlStringSender, values);
    // Query for update receiver
    let sqlStringReceiver =`UPDATE ??
                            SET cash=cash+?
                            WHERE uid=?
                            ;`;
    values = [receiver.table, amount, receiver.uid];
    sqlStringReceiver = req.db.format(sqlStringReceiver, values);

    // Execute transaction
    // Transfer cash
    try{
        await sqlAsync.query(req.db, 'START TRANSACTION');
        let results = await sqlAsync.query(req.db, sqlStringSender + sqlStringReceiver);
    }
    catch(error) {
        await sqlAsync.query(req.db, 'ROLLBACK'); // rollback transaction if a statement produce error
        console.log(error);
        return res.json({err: true, msg: 'Server 錯誤'});
    }
    await sqlAsync.query(req.db, 'COMMIT');  // commit transaction only if all statement has executed without error
    
    return res.json({err: false, msg: 'success'});
};


// Determine all accounts managed by this user
// It returns an array contains all account infos managed by this user, including himself
// Special case : all service agents manage their admin's account, they don't have wallet themselves
// Please execute it in try catch 
async function getManagedUsers(req) {
    // Prepare query
    let sqlString, values;
    if(req.user.role === 'agent'){
        sqlString =`(
                        SELECT U.id AS uid, U.account, A.name, A.cash, U.role
                        FROM AgentInfo AS A
                        INNER JOIN UserAccount AS U
                            ON U.id=A.uid
                        WHERE A.id=?
                    )
                    UNION
                    (
                        SELECT U.id AS uid, U.account, M.name, M.cash, U.role
                        FROM MemberInfo AS M
                        INNER JOIN UserAccount AS U
                            ON U.id=M.uid
                        WHERE M.agentId=?
                    )
                    ;`;
        values = [req.user.roleId, req.user.roleId];
        sqlString = req.db.format(sqlString, values);
    }
    else if(req.user.role === 'headAgent'){
        sqlString =`(
                        SELECT U.id AS uid, U.account, H.name, H.cash, U.role 
                        FROM HeadAgentInfo AS H
                        INNER JOIN UserAccount AS U
                            ON U.id=H.uid
                        WHERE H.id=?
                    )
                    UNION
                    (
                        SELECT U.id AS uid, U.account, A.name, A.cash, U.role
                        FROM AgentInfo AS A
                        INNER JOIN UserAccount AS U
                            ON U.id=A.uid
                        WHERE A.headAgentId=?
                    )
                    ;`;
        values = [req.user.roleId, req.user.roleId];
        sqlString = req.db.format(sqlString, values);
    }
    else if(req.user.role === 'serviceAgent'){
        sqlString =`(
                        SELECT U.id AS uid, U.account, Adm.name, Adm.cash, U.role
                        FROM AdminInfo AS Adm
                        INNER JOIN UserAccount AS U
                            ON U.id=Adm.uid

                        INNER JOIN ServiceAgentInfo AS Ser
                            ON Adm.id=Ser.adminId AND Ser.id=?
                    )
                    UNION
                    (
                        SELECT U.id AS uid, U.account, H.name, H.cash, U.role
                        FROM HeadAgentInfo AS H
                        INNER JOIN UserAccount AS U
                            ON U.id=H.uid
                            
                        INNER JOIN ServiceAgentInfo AS Ser
                            ON H.adminId=Ser.adminId AND Ser.id=?
                    )
                    UNION
                    (   
                        SELECT U.id AS uid, U.account, A.name, A.cash, U.role
                        FROM AgentInfo AS A
                        INNER JOIN UserAccount AS U
                            ON U.id=A.uid

                        INNER JOIN HeadAgentInfo AS H
                            ON H.id=A.headAgentId
                        INNER JOIN ServiceAgentInfo AS Ser
                            ON H.adminId=Ser.adminId AND Ser.id=?
                        
                    )
                    UNION
                    (
                        SELECT U.id AS uid, U.account, M.name, M.cash, U.role
                        FROM MemberInfo AS M
                        INNER JOIN UserAccount AS U
                            ON U.id=M.uid

                        INNER JOIN AgentInfo AS A
                            ON A.id=M.agentId
                        INNER JOIN HeadAgentInfo AS H
                            ON H.id=A.headAgentId
                        INNER JOIN ServiceAgentInfo AS Ser
                            ON H.adminId=Ser.adminId AND Ser.id=?
                    )
                    ;`;
        values = [req.user.roleId, req.user.roleId, req.user.roleId, req.user.roleId];
        sqlString = req.db.format(sqlString, values);
    }
    else if(req.user.role === 'admin'){
        sqlString =`(
                        SELECT U.id AS uid, U.account, Adm.name, Adm.cash, U.role
                        FROM AdminInfo AS Adm
                        INNER JOIN UserAccount AS U
                            ON U.id=Adm.uid

                        WHERE Adm.id=?
                    )
                    UNION
                    (
                        SELECT U.id AS uid, U.account, H.name, H.cash, U.role
                        FROM HeadAgentInfo AS H
                        INNER JOIN UserAccount AS U
                            ON U.id=H.uid

                        WHERE H.adminId=?
                    )
                    UNION
                    (   
                        SELECT U.id AS uid, U.account, A.name, A.cash, U.role
                        FROM AgentInfo AS A
                        INNER JOIN UserAccount AS U
                            ON U.id=A.uid

                        INNER JOIN HeadAgentInfo AS H
                            ON H.id=A.headAgentId AND H.adminId=?
                    )
                    UNION
                    (
                        SELECT U.id AS uid, U.account, M.name, M.cash, U.role
                        FROM MemberInfo AS M
                        INNER JOIN UserAccount AS U
                            ON U.id=M.uid

                        INNER JOIN AgentInfo AS A
                            ON A.id=M.agentId
                        INNER JOIN HeadAgentInfo AS H
                            ON H.id=A.headAgentId AND H.adminId=?
                    )
                    ;`;
        values = [req.user.roleId, req.user.roleId, req.user.roleId, req.user.roleId];
        sqlString = req.db.format(sqlString, values);
    }
    else{
        // Invalid role
        throw('Invalid role');
    }

    // Execute query
    let results = await sqlAsync.query(req.db, sqlString);
    return results;
}


// Form data validate generators
// Invoke it to produce a middleware for validating
function transferValidator(){
    return [
        // Check format
        // All values must be string
        body('*')
            .isString().withMessage('Wrong data format'),

        body('accountFrom')
            .isLength({ min:1 }).withMessage('帳號不可為空')
            .isLength({ max:20 }).withMessage('帳號長度不可超過 20')
            .isAlphanumeric().withMessage('帳號只能含有數字或英文字母'),
        body('accountTo')
            .isLength({ min:1 }).withMessage('帳號不可為空')
            .isLength({ max:20 }).withMessage('帳號長度不可超過 20')
            .isAlphanumeric().withMessage('帳號只能含有數字或英文字母')
            .custom( function(data, {req}) { return data !== req.body.accountFrom; }).withMessage('轉入帳號不能跟轉出帳號相同'),
        body('amount')
            .isInt({ min:-999999999 , max:999999999}).withMessage('現金額度必須是數字'),
        body('password')
            .isLength({ min:1 }).withMessage('密碼不可為空')
            .isLength({ max:20 }).withMessage('密碼長度不可超過 20')
            .isAlphanumeric().withMessage('密碼只能含有數字或英文字母'),
        body('comment')
            .isLength({ min:0, max:40 }).withMessage('備註長度不可超過 40'),

        // Sanitize all values 
        sanitizeBody('*')
            .escape() // Esacpe characters to prevent XSS attack, replace <, >, &, ', " and / with HTML entities
            .trim(), // trim white space from both end
        
        // Check password
        body('password').custom(async function(data, {req}){

            // Prepare query
            let sqlString =`SELECT * 
                            FROM UserAccount 
                            WHERE account=? AND password=?;
                            `;
            let values = [req.user.account, data];
            sqlString = req.db.format(sqlString, values);

            // Check if password is correct
            let results;
            try {
                results = await sqlAsync.query(req.db, sqlString);
            }
            catch(error) {
                console.log(error);
                throw Error('Server 錯誤');
            }

            if(results.length <= 0) throw Error('請輸入正確的密碼');
            return true;
        }),
    ];
}

module.exports = {
    transfer : {
        render : transferRenderHandler,
        transfer : transferFormHandler,
        transferValidate : transferValidator(),
    },
    history : historyHandler
};
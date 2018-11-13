const 
    sqlAsync = require('../../../libs/sqlAsync'),
    { body, validationResult } = require('express-validator/check'),
    { sanitizeBody } = require('express-validator/filter');


let transferHandler = function(req,res){

    // Determine all accounts managed by this user
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
        sqlString =`SELECT U.name, U.account
                    FROM UserAccount AS U
                    INNER JOIN HeadAgentInfo AS H
                        ON H.adminId=?
                    INNER JOIN AgentInfo AS A
                        ON A.headAgentId=H.id
                    INNER JOIN MemberInfo AS M
                        ON M.agentId=A.id
                    WHERE U.id=?
                    ;`;
    }
    else{
        // Invalid role
        return res.redirect(303, '/');
    }
    values = [req.user.id];
    sqlString = req.db.format(sqlString, values);

    res.render('home/credit/transfer', {layout : 'home'});
};

let historyHandler = function(req,res){
    res.render('home/credit/history', {layout : 'home'});
};


module.exports = {
    transfer : transferHandler,
    history : historyHandler
};
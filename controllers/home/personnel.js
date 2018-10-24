const 
    credentials = require('../../configs/credentials');

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
/*
let serviceAgentReadHandler = function(req,res){
	var data = {
    	"draw": req.body.draw,
    	"recordsTotal": 0,
    	"recordsFiltered": 0,
    	"data":[]
    };
   
    let sqlString = "SELECT id, name, userAccount, lineId, wechatId, facebookId, phoneNumber, bankSymbol, bankName, bankAccount, quota, credit, comment, createtime FROM ServiceAgentInfo";
    req.db.query(sqlString, function(error, results, fields){
                // error will be an Error if one occurred during the query
                // results will contain the results of the query
                // fields will contain information about the returned results fields (if any)
                let resData = [];

                if(error) { 
                	console.log(error);
                    return res.json(data); 
                }                
                //filter results by search[value]
                if(req.body.search["value"] != ''){
                	resData = results.filter( row => {
                		let flag = false;
                		Object.keys(row).forEach(key => {
                			if(row[key].toString().match(req.body.search["value"])){
                				flag = true;
                				return;
                			}
                		});

                		return flag
                	});
                	data["recordsFiltered"] = resData.length;
                }else{
                	resData = results;
                	data["recordsFiltered"] = results.length;
                }

                data["recordsTotal"] = results.length;


                data["data"] = resData.length < req.body.start +req.body.length ?
						  resData.slice(req.body.start, resData.length) :
						  resData.slice(req.body.start, req.body.start +req.body.length);


                return res.json(data); // result[0] is the user instance in db
            });

    //res.json(data);
}
*/
let serviceAgentReadHandler = function(req,res){
	var data = {
    	"data":[]
    };
   
    let sqlString = `SELECT id, name, userAccount, lineId, wechatId,
    				 	facebookId, phoneNumber, bankSymbol, bankName, 
    				 	bankAccount, quota, credit, comment, createtime 
    				 FROM ServiceAgentInfo`;

    req.db.query(sqlString, function(error, results, fields){
                // error will be an Error if one occurred during the query
                // results will contain the results of the query
                // fields will contain information about the returned results fields (if any)
                if(error) { 
                	console.log(error);
                    res.json(data); 
                }else{
                	data["data"] = results;
                	res.json(data);
                }              
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
	let data = {};

    res.json(data);
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
    
    let updateData = req.body.data;
    
    // Return if data is empty
    if(!updateData)  {
        res.json({err: true, msg: '空白資料'});
        return;
    }
    
    // Produce multiple SQL statements and add them into one query string
    let sqlTemplate = `UPDATE ServiceAgentInfo 
                            SET name=?, lineId=?, wechatId=?, facebookId=?, phoneNumber=?, 
                                bankSymbol=?, bankName=?, bankAccount=?, quota=?, credit=?, comment=?
                            WHERE id=?`;
    let sqlString = '';
	for(let i=0 ; i<updateData.length ; i++){
        let element = updateData[i];
        let values = [element.name, element.lineId, element.wechatId, element.facebookId, element.phone,
            element.bankAccount, element.bankName, element.bankAccount, element.cashQuota, 
            element.creditQuota, element.comment, element.id];

        // Append a statement to query string
        sqlString = sqlString + req.db.format(sqlTemplate, values) + ';'; // use ';' to seperate each SQL statement
    }
    //console.log({sqlString});
    
    // Execute SQL transaction and return response to client
    // PS : notice the 'return' before rollback()
    try{
        
		req.db.beginTransaction(function(err){

            // Something happened when init transaction
			if(err) { 
                return res.json({err: true, msg: err});
                //throw err; 
            }

            // Execute SQL query
            req.db.query(sqlString, function(error, results, fields){

                // Something happend when executing update query
                if(error){
                    return req.db.rollback(function(){
                        return res.json({err: true, msg: err});
                        //throw error;
                    });
                    
                }else if(results.warningCount > 0){
                    return req.db.rollback(function(){
                        return res.json({err: true, msg: '輸入格式錯誤'});
                    });

                }

                // SQL execution succeed, commit transaction
                req.db.commit(function(err){

                    // Something happend when commiting trasaction
                    if(err){
                        return req.db.rollback(function(){
                            return res.json({err: true, msg: err});
                            //throw err;
                        })
                    }

                    // Transaction commit suceed
                    return res.json({err: false, msg: 'success'});
                });
            });
		});

	}catch(err){
		return res.json({err: true, msg: err});
	}
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

    let deleteData = req.body.data;
    
    // Return if data is empty
    if(!deleteData)  {
        res.json({err: true, msg: '空白資料'});
        return;
    }


    // Produce multiple SQL statements and add them into one query string
    let sqlTemplate = `DELETE FROM ServiceAgentInfo WHERE id=?`;
    let sqlString = '';
	for(let i=0 ; i<deleteData.length ; i++){
        let element = deleteData[i];
        let values = [element.id];

        // Append a statement to query string
        sqlString = sqlString + req.db.format(sqlTemplate, values) + ';'; // use ';' to seperate each SQL statement
    }
    //console.log({sqlString});

    // Execute SQL transaction and return response to client
    // PS : notice the 'return' before rollback()
    try{
        
		req.db.beginTransaction(function(err){

            // Something happened when init transaction
			if(err) { 
                return res.json({err: true, msg: err});
                //throw err; 
            }

            // Execute SQL query
            req.db.query(sqlString, function(error, results, fields){

                // Something happend when executing update query
                if(error){
                    return req.db.rollback(function(){
                        return res.json({err: true, msg: err});
                        //throw error;
                    });
                    
                }else if(results.warningCount > 0){
                    return req.db.rollback(function(){
                        return res.json({err: true, msg: '輸入格式錯誤'});
                    });

                }

                // SQL execution succeed, commit transaction
                req.db.commit(function(err){

                    // Something happend when commiting trasaction
                    if(err){
                        return req.db.rollback(function(){
                            return res.json({err: true, msg: err});
                            //throw err;
                        })
                    }

                    // Transaction commit suceed
                    return res.json({err: false, msg: 'success'});
                });
            });
		});

	}catch(err){
		return res.json({err: true, msg: err});
	}
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
    //Delete
    memberDelete : memberDeleteHandler,
    agentDelete : agentDeleteHandler,
    headAgentDelete : headAgentDeleteHandler,
    serviceAgentDelete : serviceAgentDeleteHandler,
};
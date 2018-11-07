const 
    credentials = require('../../configs/credentials'),
    cmsApi = require('../../cms/cmsApi');

let verifyHandler = function(req,res){
    res.render('home/game/verify', {layout : 'home'});
}   

let presentGamesHandler = function(req,res){
	let role = req.user.role;
    //let roleId= req.user.roleId;
    let roleId= 1;

    
    // Prepare query
    let sqlString =`SELECT * 
                    FROM ClubInfo 
                    WHERE ClubInfo.id IN (SELECT AdminClub.clubId 
                                          FROM AdminClub 
                                          WHERE AdminClub.adminId=? )`;
    let values = [roleId];
    sqlString = req.db.format(sqlString, values);
    
    // Search user in database
    req.db.query(sqlString, function(error, results, fields){
        // error will be an Error if one occurred during the query
        // results will contain the results of the query
        // fields will contain information about the returned results fields (if any)
        if(error) { 
            console.log(error);
        }                
        // Not found 
        else if (results.length <= 0) {
            console.log("results is empty");
        }

        // Spilt results into 2 array
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
        console.log(req.user);
    	res.render('home/game/present-games', {layout : 'home'});

    });
}	

let historyHandler = function(req,res){
    res.render('home/game/history', {layout : 'home'});
}

let importHandler = function(req,res){
    res.render('home/game/import', {layout : 'home'});
}

let acceptBuyinHandler  = function(req, res){
	console.log(req.body);
}

let denyBuyinHandler  = function(req, res){
	let clubId = req.body.clubId;
	let data = req.body.data;
	let key = '/token:' + clubId;
	req.redis.get(key, async function(err, reply){
		if(err) {
			return res.json({err: true, msg: err});
		}else if(!reply){
			return res.json({err: false, msg: "no token"});
		}

		let result = await cmsApi.denyBuyin(reply, data);
		
		if(result.iErrCode == 0 && result.result == 0){
			return res.json({err: false, msg: "success"});
		}else{
			return res.json({err:false, msg: "unknown failure"});
		}
	});
}

module.exports = {
    verify : verifyHandler,
    presentGames : presentGamesHandler,
    history : historyHandler,
    acceptBuyin : acceptBuyinHandler,
    denyBuyin : denyBuyinHandler,
    import : importHandler
};
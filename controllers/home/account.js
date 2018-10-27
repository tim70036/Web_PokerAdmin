const 
    credentials = require('../../configs/credentials');

let miscHandler = function(req,res){
    res.render('home/account/misc', {layout : 'home'});
}

let gameHandler = function(req,res){
    res.render('home/account/game', {layout : 'home'});
}

let clubHandler = function(req,res){
    let role = req.user.role;
    let roleId= req.user.roleId;

    
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
            res.render('home/account/club', {layout : 'home'});
            return console.log(error);
        }                
        // Not found 
        else if (results.length <= 0) {
            res.render('home/account/club', {layout : 'home'});
            return console.log("results is empty");
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
        res.render('home/account/club', {layout : 'home'});
    });

    
}


module.exports = {
    misc : miscHandler,
    game : gameHandler,
    club : clubHandler
};
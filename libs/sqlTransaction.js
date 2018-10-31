// Eexecute multi SQL statement(strings in an array) inside a SQL transaction
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

module.exports = sqlTransaction;
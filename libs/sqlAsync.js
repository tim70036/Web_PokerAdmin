// Execute a sql string that allow using async/await
// Ex : 
    // try {
    //     let result = await sqlAsync.query(dbConneciton, sqlString);
    // }
    // catch(error)
    // {

    // }


let query = function( db, sql ) {
    return new Promise(( resolve, reject ) => {
        db.query(sql, ( err, rows) => {
            if ( err ) {
              reject( err )
            } else {
              resolve( rows )
            }
        });
        
    });
}
  
module.exports = { query }
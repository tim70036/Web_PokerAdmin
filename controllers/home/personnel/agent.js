const 
    sqlTransaction = require('../../../libs/sqlTransaction'),
    { body, validationResult } = require('express-validator/check'),
    { sanitizeBody } = require('express-validator/filter');



// Page rendering
let renderHandler = function(req,res){
    res.render('home/personnel/agent', {layout : 'home'});
}

// Datatable ajax read
let readHandler = function(req,res){
    res.json({});
}

// Datatable ajax create
let createHandler = function(req,res){
    res.json({});
}

// Datatable ajax update
let updateHandler = function(req,res){
    res.json({});
}

// Datatable ajax delete
let deleteHandler = function(req,res){
    res.json({});
}


// Form data validate generators
// Invoke it to produce a middleware for validating
function createValidator(){
    return [

    ];
}

function updateValidator(){
    return [

    ];
}

function deleteValidator(){
    return [

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
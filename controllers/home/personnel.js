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

module.exports = {
    member : memberHandler,
    agent : agentHandler,
    headAgent : headAgentHandler,
    serviceAgent : serviceAgentHandler
};
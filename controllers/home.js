// Handlers for home page

function index (req, res) {
    res.render('home/index', {layout : 'main'});
}

function add (req, res) {
    res.render('home/add', {layout : 'main'});

}

function login (req, res) {
    res.render('home/login', {layout : false});

}

function presentgames(req, res) {
    res.render('home/presentgames', {layout : 'main'});
}

module.exports = {
    index: index,
    add: add,
    login: login,
    presentgames : presentgames
};
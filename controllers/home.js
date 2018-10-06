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

function authorize(req, res, next){

    // User not login, just redirect
    if(!req.isAuthenticated()) {
        console.log('not authorized');
        res.redirect(303, '/home/login');
        return;
    }

    // User has logined, moving forward
    return next();
}

module.exports = {
    index: index,
    add: add,
    login: login,
    presentgames : presentgames,
    authorize : authorize
};

// ----------------------------------------------------- //


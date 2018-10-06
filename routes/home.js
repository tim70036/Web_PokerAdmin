// Export a router that is set with custom routes
// Import handlers for routes
const
    express = require('express'),
    homeController = require('../controllers/home');

let router = express.Router();

// Register routes to a router
router.get('/', homeController.authorize,homeController.index);
router.get('/add', homeController.authorize, homeController.add);
router.get('/presentgames', homeController.authorize, homeController.presentgames);

router.get('/login', homeController.login);

module.exports = router;
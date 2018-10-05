// Export a router that is set with custom routes
// Import handlers for routes
const
    express = require('express'),
    homeController = require('../controllers/home');

let router = express.Router();

// Register routes to a router
router.get('/', homeController.index);
router.get('/add', homeController.add);
router.get('/login', homeController.login);
router.get('/presentgames', homeController.presentgames);

module.exports = router;
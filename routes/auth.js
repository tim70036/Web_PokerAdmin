// Export a router that is set with custom routes
// Import handlers for routes
const
    express = require('express'),
    authController = require('../controllers/auth');

let router = express.Router();

// Register routes to a router
router.post('/cognito', authController.cognito);
router.get('/logout', authController.logout)

module.exports = router;
// Export a router that is set with custom routes
// Import handlers for routes
const
    express = require('express'),
    homeController = require('../controllers/home');

let router = express.Router();

// Register routes to a router
// Dashboard routes
router.get('/', homeController.authorize, homeController.index);

// Personnel management routes
router.get('/personnel/member', homeController.authorize, homeController.personnel.member);
router.get('/personnel/agent', homeController.authorize, homeController.personnel.agent);
router.get('/personnel/head-agent', homeController.authorize, homeController.personnel.headAgent);
router.get('/personnel/service-agent', homeController.authorize, homeController.personnel.serviceAgent);

// Credit management routes
router.get('/credit/transfer', homeController.authorize, homeController.credit.transfer);
router.get('/credit/history', homeController.authorize, homeController.credit.history);

// Game management routes
router.get('/game/verify', homeController.authorize, homeController.game.verify);
router.get('/game/present-games', homeController.authorize, homeController.game.presentGames);
router.get('/game/history', homeController.authorize, homeController.game.history);
router.get('/game/import', homeController.authorize, homeController.game.import);

// Account management routes
router.get('/account/misc', homeController.authorize, homeController.account.misc);
router.get('/account/game', homeController.authorize, homeController.account.game);
router.get('/account/club', homeController.authorize, homeController.account.club);

// Authorization routes
router.get('/login', homeController.login);

module.exports = router;
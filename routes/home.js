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

// Personnel CRUD ajax
router.get('/personnel/member/read', homeController.authorize, homeController.personnel.memberRead);
router.get('/personnel/agent/read', homeController.authorize, homeController.personnel.agentRead);
router.get('/personnel/head-agent/read', homeController.authorize, homeController.personnel.headAgentRead);
router.get('/personnel/service-agent/read', homeController.authorize, homeController.personnel.serviceAgentRead);

router.post('/personnel/member/create', homeController.authorize, homeController.personnel.memberCreate);
router.post('/personnel/agent/create', homeController.authorize, homeController.personnel.agentCreate);
router.post('/personnel/head-agent/create', homeController.authorize, homeController.personnel.headAgentCreate);
router.post('/personnel/service-agent/create', homeController.authorize, homeController.personnel.serviceAgentCreateValidate, homeController.personnel.serviceAgentCreate);

router.post('/personnel/member/update', homeController.authorize, homeController.personnel.memberUpdate);
router.post('/personnel/agent/update', homeController.authorize, homeController.personnel.agentUpdate);
router.post('/personnel/head-agent/update', homeController.authorize, homeController.personnel.headAgentUpdate);
router.post('/personnel/service-agent/update', homeController.authorize, homeController.personnel.serviceAgentUpdateValidate, homeController.personnel.serviceAgentUpdate);

router.post('/personnel/member/delete', homeController.authorize, homeController.personnel.memberDelete);
router.post('/personnel/agent/delete', homeController.authorize, homeController.personnel.agentDelete);
router.post('/personnel/head-agent/delete', homeController.authorize, homeController.personnel.headAgentDelete);
router.post('/personnel/service-agent/delete', homeController.authorize, homeController.personnel.serviceAgentDeleteValidate,  homeController.personnel.serviceAgentDelete);

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
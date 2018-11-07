// Export a router that is set with custom routes
// Import handlers for routes
const
    express = require('express');

let router = express.Router();


// Extract handlers
const {index, personnel, credit, game, account, login, authorize} = require('../controllers/home');


// Authorize route
router.use(/\/(dashboard|personnel|credit|game|account).*/, authorize); // used on all pages, except login

// Dashboard routes
router.get('/dashboard', index);

// Login routes
router.get('/login', login);

// Personnel management routes
const {serviceAgent, headAgent, agent, member} = personnel;

router.get('/personnel/service-agent', serviceAgent.render);
router.get('/personnel/head-agent', headAgent.render);
router.get('/personnel/agent', agent.render);
router.get('/personnel/member', member.render);

router.get('/personnel/service-agent/read', serviceAgent.read);
router.get('/personnel/head-agent/read', headAgent.read);
router.get('/personnel/agent/read', agent.read);
router.get('/personnel/member/read', member.read);

router.post('/personnel/service-agent/create', serviceAgent.createValidate, serviceAgent.create);
router.post('/personnel/head-agent/create', headAgent.createValidate, headAgent.create);
router.post('/personnel/agent/create', agent.createValidate, agent.create);
router.post('/personnel/member/create', member.createValidate, member.create);

router.post('/personnel/service-agent/update', serviceAgent.updateValidate, serviceAgent.update);
router.post('/personnel/head-agent/update', headAgent.updateValidate, headAgent.update);
router.post('/personnel/agent/update', agent.updateValidate, agent.update);
router.post('/personnel/member/update', member.updateValidate, member.update);

router.post('/personnel/service-agent/delete', serviceAgent.deleteValidate,  serviceAgent.delete);
router.post('/personnel/head-agent/delete', headAgent.deleteValidate, headAgent.delete);
router.post('/personnel/agent/delete', agent.deleteValidate, agent.delete);
router.post('/personnel/member/delete', member.deleteValidate, member.delete);

// Credit management routes
router.get('/credit/transfer', credit.transfer);
router.get('/credit/history', credit.history);

// Game management routes
router.get('/game/verify', game.verify);
router.get('/game/present-games', game.presentGames);
router.get('/game/history', game.history);
router.get('/game/import', game.import);

router.post('/game/verify/acceptBuyin', game.acceptBuyin);
router.post('/game/verify/denyBuyin', game.denyBuyin);

// Account management routes
router.get('/account/misc', account.misc);
router.get('/account/game', account.game);
router.get('/account/club', account.club);



module.exports = router;
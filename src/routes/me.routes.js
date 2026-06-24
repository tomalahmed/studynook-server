const express = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

/** Protected probe — verifies JWT only; no Better Auth on Express. */
router.get('/', authMiddleware, (req, res) => {
	res.json({ user: req.user });
});

module.exports = router;

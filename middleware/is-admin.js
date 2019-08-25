module.exports = (req, res, next) => {
	if (req.session.isAuthenticated && req.session.isVerified && req.session.isAdmin) {
		return next();
	}
	return res.redirect('/');
};

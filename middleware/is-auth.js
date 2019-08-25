module.exports = (req, res, next) => {
	if (!req.session.isAuthenticated) {
		return res.redirect('/login');
	} else if (!req.session.isVerified) {
		req.flash('error', 'Please verify your Email');
		return res.redirect('/login');
	}
	next();
};

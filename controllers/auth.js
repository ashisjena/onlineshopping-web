const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator/check');

const User = require('../models/user');

const transporter = nodemailer.createTransport(
	sendgridTransport({
		auth: {
			api_key: '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'
		}
	})
);

exports.getLogin = (req, res, next) => {
	console.log(req.get('Cookie'));
	const message = req.flash('error')[0];
	res.render('auth/login', {
		path: '/login',
		pageTitle: 'Login',
		errorMessage: message,
		oldInput: {
			email: '',
			password: ''
		},
		validationErrors: []
	});
};

exports.getSignup = (req, res, next) => {
	res.render('auth/signup', {
		path: '/signup',
		pageTitle: 'Signup',
		errorMessage: req.flash('error')[0]
	});
};

exports.postLogin = (req, res, next) => {
	const { email, password } = req.body;

	loginErrorHandler();

	function loginErrorHandler(errorObj) {
		const errors = validationResult(req);
		console.log(errorObj);
		if (!errors.isEmpty() || errorObj) {
			return res.status(422).render('auth/login', {
				path: '/login',
				pageTitle: 'login',
				errorMessage: errorObj ? errorObj.msg : errors.array().reduce((acc, element) => acc + '\n' + element.msg, ''),
				oldInput: {
					email
				},
				validationErrors: errorObj ? [errorObj] : errors.array()
			});
		}
	}

	User.findByEmail(email)
		.then(user => {
			if (!user) {
				req.flash('error', 'Invalid Email');
				return res.redirect('/login');
			}

			bcrypt
				.compare(password, user.password)
				.then(doMatch => {
					if (doMatch && user.isVerified) {
						req.session.userEmail = user.email;
						req.session.isAuthenticated = true;
						req.session.isVerified = true;
						req.session.isAdmin = user.isAdmin;
						//Session save happens automatically, but save grantees that it is saved before you proceed.
						return req.session.save(err => {
							res.redirect('/');
						});
					} else if (doMatch && !user.isVerified) {
						req.flash('error', 'Visit the email sent during signup to Verify Email or click the below button to resend an Email');
						return res.render('auth/resend-token', {
							path: '/resend-token',
							pageTitle: 'Account Verification',
							token: user.resetToken,
							errorMessage: req.flash('error')[0]
						});
					}
					/* req.flash('error', 'Invalid Password');
					res.redirect('/login'); */
					loginErrorHandler({ param: 'password', msg: 'Invalid Password' });
				})
				.catch(err => {
					console.log(err);
					req.flash('error', err.toString());
					res.redirect('/login');
				});
		})
		.catch(err => {
			err.httpStatusCode = 500;
			return next(err);
		});
};

exports.postSignup = (req, res, next) => {
	let { email, password, name, confirmPassword } = req.body;
	const errors = validationResult(req);
	// console.log(errors.array());
	if (!errors.isEmpty()) {
		if (errors.array().filter(ele => ele.msg.isNotVerified).length > 0) {
			return res.status(432).render('auth/resend-token', {
				path: '/resend-token',
				token: errors.array()[0].msg.token,
				pageTitle: 'Resend Verification Email',
				errorMessage: errors.array()[0].msg.errMsg
			});
		}
		return res.status(422).render('auth/signup', {
			path: '/signup',
			pageTitle: 'Signup',
			errorMessage: errors.array().reduce((acc, element) => acc + '\n' + element.msg, '')
		});
	}

	bcrypt
		.hash(password, 12)
		.then(hashedPassword => {
			crypto.randomBytes(32, (err, buffer) => {
				if (err) {
					req.flash('err', err.toString());
					return res.redirect('/');
				}
				const expiryTimeStamp = new Date();
				expiryTimeStamp.setHours(new Date().getHours() + 1);
				const user = new User(email, hashedPassword, name, null, buffer.toString('hex'), expiryTimeStamp);
				user.save().then(result => {
					res.redirect('/login');
					transporter.sendMail({
						to: email,
						from: 'no-reply@ajcart.com',
						subject: 'Signup succeeded',
						html: `<h1>You successfully signed up!</h1>
									 <p>Click this <a href="http://localhost:3000/verify/${buffer.toString('hex')}">link</a> to verify your account.</p>`
					});
				});
			});
		})
		.catch(err => {
			err.httpStatusCode = 500;
			return next(err);
		});
};

exports.postResendToken = (req, res, next) => {
	User.findByToken(req.body.token)
		.then(user => {
			return crypto.randomBytes(32, (err, buffer) => {
				if (err) {
					req.flash('err', err.toString());
					return res.redirect('/');
				}
				const expiryTimeStamp = new Date();
				expiryTimeStamp.setHours(new Date().getHours() + 1);
				user.resetToken = buffer.toString('hex');
				user.resetTokenExpiration = expiryTimeStamp;
				return user.save().then(() => {
					res.redirect('/login');
					return transporter.sendMail({
						to: user.email,
						from: 'no-reply@ajcart.com',
						subject: 'Password verification link',
						html: `<h1>You are already signed up!</h1>
							 		 <p>Click this <a href="http://localhost:3000/verify/${user.resetToken}">link</a> to verify your account.</p>`
					});
				});
			});
		})
		.catch(err => {
			err.httpStatusCode = 500;
			return next(err);
		});
};

exports.postLogout = (req, res, next) => {
	req.session.destroy(err => {
		if (err) {
			const err = new Error('Error during logout');
			err.httpStatusCode = 500;
			return next(err);
		}
		res.redirect('/');
	});
};

exports.getVerify = (req, res, next) => {
	User.findByToken(req.params.token)
		.then(user => {
			if (user) {
				if (new Date(Date.UTC(user.resetTokenExpiration)) < new Date()) {
					req.flash('error', 'Link expired');
					return res.render('auth/resend-token', {
						path: '/resend-token',
						token: user.resetToken,
						pageTitle: 'Resend Verification Email',
						errorMessage: req.flash('error')[0]
					});
				}
				user.isVerified = true;
				user.resetToken = null;
				user.resetTokenExpiration = null;
				return user.save().then(() => {
					return res.redirect('/login');
				});
			} else {
				return res.redirect('/login');
			}
		})
		.catch(err => {
			err.httpStatusCode = 500;
			return next(err);
		});
};

exports.getReset = (req, res, next) => {
	const message = req.flash('error')[0];
	res.render('auth/reset', {
		path: '/reset',
		pageTitle: 'Reset Password',
		errorMessage: message
	});
};

exports.postReset = (req, res, next) => {
	crypto.randomBytes(32, (err, buffer) => {
		if (err) {
			req.flash('error', err.toString());
			return res.redirect('/reset');
		}
		const token = buffer.toString('hex');
		User.findByEmail(req.body.email)
			.then(user => {
				if (!user) {
					req.flash('error', `No account with the email: ${req.body.email} found`);
					return res.redirect('/signup');
				} else {
					const expiryTimeStamp = new Date();
					expiryTimeStamp.setHours(new Date().getHours() + 1);
					user.resetToken = token;
					user.resetTokenExpiration = expiryTimeStamp.toUTCString();
					return user.save();
				}
			})
			.then(result => {
				if (result) {
					transporter.sendMail({
						to: req.body.email,
						from: 'no-reply@ajcart.com',
						subject: 'Password reset',
						html: `
					<p>You requested a password reset</p>
					<p>Click this <a href="http://localhost:3000/reset/${token}">link</a> link to set a new password</p>
					`
					});
					res.redirect('/login');
				}
			})
			.catch(err => {
				err.httpStatusCode = 500;
				return next(err);
			});
	});
};

exports.getNewPassword = (req, res, next) => {
	const token = req.params.token;
	User.findByToken(token)
		.then(user => {
			if (user && new Date(Date.UTC(user.resetTokenExpiration) > new Date())) {
				res.render('auth/new-password', {
					path: '/new-password',
					pageTitle: 'New Password',
					errorMessage: req.flash('error')[0],
					email: user.email,
					passwordToken: token
				});
			} else {
				res.redirect('/login');
			}
		})
		.catch(err => {
			err.httpStatusCode = 500;
			return next(err);
		});
};

exports.postNewPassword = (req, res, next) => {
	const newPassword = req.body.password;
	const email = req.body.email;
	const passwordToken = req.body.passwordToken;

	let resetUser;
	User.findByToken(passwordToken)
		.then(user => {
			resetUser = user;
			if (user.email === email && new Date(Date.UTC(user.resetTokenExpiration)) > new Date()) {
				return bcrypt.hash(newPassword, 12);
			}
		})
		.then(hashedPassword => {
			if (resetUser) {
				resetUser.password = hashedPassword;
				resetUser.resetToken = null;
				resetUser.resetTokenExpiration = null;
				return resetUser.save();
			}
		})
		.then(() => {
			res.redirect('/login');
		})
		.catch(err => {
			err.httpStatusCode = 500;
			return next(err);
		});
};

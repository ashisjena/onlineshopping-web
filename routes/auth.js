const express = require('express');
const { check, body } = require('express-validator/check');

const authController = require('../controllers/auth');

const router = express.Router();

const User = require('../models/user');

router.get('/login', authController.getLogin);
router.get('/signup', authController.getSignup);
router.post(
	'/login',
	[
		body('email')
			.isEmail()
			.normalizeEmail()
			.withMessage('Please enter a valid email'),
		body('password', 'Password entered is invalid')
			.isLength({ min: 5 })
			.isAlphanumeric()
			.trim()
	],
	authController.postLogin
);
router.post(
	'/signup',
	[
		check('email')
			.isEmail()
			.withMessage('Please enter a valid email')
			.normalizeEmail()
			.custom((value, { req, res }) => {
				if (value === 'test@test.com') {
					throw new Error('This email address is forbidden');
				}
				return User.findByEmail(value).then(user => {
					if (user && user.isVerified) {
						return Promise.reject('E-Mail already registered');
					} else if (user && !user.isVerified) {
						return Promise.reject({ isNotVerified: true, token: user.resetToken, errMsg: 'Visit the email sent during signup to Verify Email' });
					}
				});
			}),
		body('password', 'Please enter a password with only numbers and text with at-least 6 characters')
			.isLength({ min: 6 })
			.isAlphanumeric()
			.trim(),
		body('confirmPassword').trim().custom((value, { req }) => {
			if (value !== req.body.password) {
				throw new Error('Passwords have to match!');
			}
			return true;
		})
	],
	authController.postSignup
);
router.post('/logout', authController.postLogout);
router.get('/reset', authController.getReset);
router.get('/reset/:token', authController.getNewPassword);
router.post('/reset', authController.postReset);
router.get('/verify/:token', authController.getVerify);
router.post('/resend-token', authController.postResendToken);
router.post('/new-password', authController.postNewPassword);

module.exports = router;

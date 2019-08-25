const path = require('path');

const { check, body } = require('express-validator/check');

const express = require('express');

const adminController = require('../controllers/admin');
const isAdmin = require('../middleware/is-admin');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', isAdmin, adminController.getAddProduct);

// /admin/products => GET
router.get('/products', isAdmin, adminController.getProducts);

// /admin/add-product => POST
router.post(
	'/add-product',
	[
		body('title')
			.trim()
			.isLength({ min: 3 })
			.isString(),
		body('price').isCurrency(),
		body('description')
			.trim()
			.isLength({ min: 5, max: 400 })
	],
	isAdmin,
	adminController.postAddProduct
);

router.get('/edit-product/:productId', isAdmin, adminController.getEditProduct);

router.post(
	'/edit-product/:productId',
	[
		body('title')
			.trim()
			.isLength({ min: 3 })
			.isString(),
		body('price').isCurrency(),
		body('description')
			.trim()
			.isLength({ min: 5, max: 400 })
	],
	isAdmin,
	adminController.postEditProduct
);

// router.post('/delete-product', isAdmin, adminController.postDeleteProduct);
router.delete('/product/:productId', isAdmin, adminController.deleteProduct);

module.exports = router;

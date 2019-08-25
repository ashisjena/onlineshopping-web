const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator/check');

const fileUtils = require('../utils/fileUtils');
const Product = require('../models/product');
const getAddProduct = (req, res, next) => {
	/* console.log('This is add-product middleware');
  res.send('<form action="/admin/product" method="POST"><input type="text" name="title"><button type="submit">Add Product</button></form>'); */
	// res.sendFile(path.join(rootDir, 'views', 'add-product.html'));
	res.render('admin/edit-product', {
		pageTitle: 'Add Product',
		path: '/admin/add-product',
		editing: false,
		hasError: false,
		errorMessage: null
	});
};

const getEditProduct = (req, res, next) => {
	const editMode = req.query.edit;
	if (editMode === 'false') {
		return res.redirect('/');
	}
	const prodId = req.params.productId;
	Product.findById(prodId).then(product => {
		if (!product) {
			return res.redirect('/');
		}
		res.render('admin/edit-product', {
			pageTitle: 'Edit Product',
			path: '/admin/edit-product',
			editing: true,
			product: product,
			hasError: false,
			errorMessage: null
		});
	});
};

const postEditProduct = (req, res, next) => {
	const type = req.body.type;
	const updatedTitle = req.body.title;
	let updatedImageUrl = req.body.imgUrl;
	const image = req.file;
	if (image) {
		updatedImageUrl = path.join('/', image.path);
	}
	const updatedPrice = req.body.price;
	const updatedDescription = req.body.description;
	const productId = req.body.productId;
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		if (image) {
			console.log('Deleted the image: ', image.path);
			fileUtils.deleteFile(path.join('.', image.path));
		}
		return res.status(422).render('admin/edit-product', {
			pageTitle: 'Add Product',
			path: '/admin/edit-product',
			editing: true,
			hasError: true,
			product: {
				productId,
				title: updatedTitle,
				type,
				// imgUrl: updatedImageUrl,
				price: updatedPrice,
				description: updatedDescription
			},
			errorMessage: errors.array()[0].msg
		});
	}
	// const product = new Product(req.params.productId, title, imageUrl, price, description);
	const updatedProduct = new Product(type, updatedTitle, updatedImageUrl, updatedPrice, updatedDescription, productId);
	updatedProduct
		.update()
		.then(() => {
			if (image) {
				fileUtils.deleteFile(path.join('.', updatedImageUrl));
			}
			return res.redirect('/admin/products');
		})
		.catch(err => {
			if (image) {
				fileUtils.deleteFile(path.join('.', image.path));
			}
			console.error(err);
			err.httpStatusCode = 500;
			next(err);
		});
};

/* const postDeleteProduct = (req, res, next) => {
	Product.deleteById(req.body.productId).then(prod => {
		fileUtils.deleteFile(path.join('.', prod.imgUrl));
		res.redirect('/admin/products');
	});
}; */

const deleteProduct = (req, res, next) => {
	Product.deleteById(req.params.productId)
		.then(prod => {
			fileUtils.deleteFile(path.join('.', prod.imgUrl));
			res.status(200).json({ message: 'Success!' });
		})
		.catch(err => {
			res.status(500).json({ message: 'Deleting Product failed.' });
		});
};

const postAddProduct = (req, res, next) => {
	const title = req.body.title;
	const type = req.body.type;
	const image = req.file;
	let imageUrl;
	if (image) {
		imageUrl = path.join('/', image.path);
	}
	const price = req.body.price;
	const description = req.body.description;

	const errors = validationResult(req);
	if (!errors.isEmpty() || !image) {
		return res.status(422).render('admin/edit-product', {
			pageTitle: 'Add Product',
			path: '/admin/edit-product',
			editing: false,
			hasError: true,
			product: {
				title,
				type,
				price,
				description
			},
			errorMessage: !image ? 'No Image selected' : errors.array()[0].msg
		});
	}

	const product = new Product(type, title, imageUrl, price, description);
	product
		.save()
		.then(result => {
			console.log('Saved Result : ', result.first()); // This will return null as Save doesn't return anything.
			res.redirect('/');
		})
		.catch(err => {
			console.error(err);
			err.httpStatusCode = 500;
			return next(err);
		});
};

const getProducts = (req, res, next) => {
	Product.fetchAll()
		.then(results => {
			res.render('admin/products', {
				prods: results.toArray(),
				pageTitle: 'Admin Products',
				path: 'admin/products'
			});
		})
		.catch(err => {
			console.error(err);
			err.httpStatusCode = 500;
			return next(err);
		});
};

module.exports = {
	getAddProduct,
	postAddProduct,
	getEditProduct,
	postEditProduct,
	// postDeleteProduct,
	deleteProduct,
	getProducts
};

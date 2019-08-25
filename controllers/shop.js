const fs = require('fs');
const path = require('path');
const os = require('os');

const PDFDocument = require('pdfkit');
const stripe = require('stripe')(process.env.STRIPE_KEY);

const Product = require('../models/product');
const User = require('../models/user');
const Cart = require('../models/cart');
const Order = require('../models/order');

const ITEMS_PER_PAGE = 2;

exports.getProducts = (req, res, next) => {
	/* console.log('In the Middleware');
  res.send('<h1>Hello from Express!</h1>'); */
	/* console.log('shop.js', adminData.products);
  res.sendFile(path.join(rootDir, 'views', 'shop.html')); */
	Product.fetchAll().then(results => {
		res.render('shop/product-list', {
			prods: results.toArray(),
			pageTitle: 'All Products',
			path: '/products'
		});
	});
};

exports.getProduct = (req, res, next) => {
	const prodId = req.params.productId; // accessing the request PARAMETER "productId"
	Product.findById(prodId).then(product => {
		res.render('shop/product-detail', {
			product: product,
			pageTitle: product.title,
			path: '/products'
		});
	});
};

exports.getIndex = (req, res, next) => {
	let pageStack, page;
	pageStack = req.body.pageStateStack ? req.body.pageStateStack.split(',') : [];
	// console.log('pageStack :', pageStack);
	if (req.body.button === 'prev') {
		pageStack = pageStack.slice(0, -2);
	}
	page = pageStack[pageStack.length - 1];

	let promise;
	if (page === '') {
		promise = Promise.resolve([]);
		pageStack = undefined;
	} else {
		promise = Product.fetchAll(ITEMS_PER_PAGE, page).then(results => {
			pageStack.push(results.pageState);
			return results.toArray();
		});
	}

	promise
		.then(prods => {
			res.render('shop/index', {
				prods,
				pageStack,
				pageTitle: 'Shop',
				path: '/'
			});
		})
		.catch(err => {
			err.httpStatusCode = 500;
			next(err);
		});
};

exports.getCart = (req, res, next) => {
	User.findByEmail(req.session.userEmail)
		.then(user => (user ? user.cartItems : null))
		.then(items =>
			Promise.all(
				items
					? Object.keys(items).map(id =>
							Product.findById(id)
								.then(prod => ({ product: prod, qty: items[id].qty, price: prod.price }))
								.catch(err => console.log(err))
					  )
					: []
			).then(cartProducts => {
				res.render('shop/cart', {
					pageTitle: 'Your Cart',
					path: '/cart',
					cartProducts: cartProducts
				});
			})
		);

	/* Cart.getProducts(cart => {
		Product.fetchAll(products => {
			const cartProducts = [];
			for (let prod of products) {
				const cartProdData = cart.products.find(product => product.id === prod.id);
				if (cartProdData) {
					cartProducts.push({ productData: prod, qty: cartProdData.qty });
				}
			}
			res.render('shop/cart', {
				pageTitle: 'Your Cart',
				path: '/cart',
				cartProducts: cartProducts
			});
		});
	}); */
};

exports.postCart = (req, res, next) => {
	User.findByEmail(req.session.userEmail)
		.then(user => user.addToCart(req.body.productId, req.body.price))
		.then(() => res.redirect('./cart'))
		.catch(err => {
			err.httpStatusCode = 500;
			next(err);
		});
	/* Product.findById(prodId, product => {
		Cart.addProduct(prodId, product.price);
		res.redirect('./cart');
	}); */
};

exports.postCartDeleteProduct = (req, res, next) => {
	User.findByEmail(req.session.userEmail)
		.then(user => user.removeFromCart(req.body.productId))
		.then(() => res.redirect('./cart'))
		.catch(err => {
			err.httpStatusCode = 500;
			next(err);
		});
	/* 	Product.findById(req.body.productId, product => {
		Cart.deleteProduct(product.id, product.price);
		res.redirect('./cart');
	}); */
};

exports.getOrders = (req, res, next) => {
	User.findByEmail(req.session.userEmail)
		.then(user => (user ? Order.getOrders(user.email) : []))
		.then(orders =>
			orders.map(order => ({
				id: order.id.toString(),
				prodDetails: Object.keys(order.orderItems).map(prodId => {
					const { qty, price } = order.orderItems[prodId];
					return Product.findById(prodId)
						.then(prod => ({ product: prod, qty, price }))
						.catch(err => {
							err.httpStatusCode = 500;
							next(err);
						});
				})
			}))
		)
		.then(orderDetailsPromArr =>
			orderDetailsPromArr.map(orderDetailsProm =>
				Promise.all(orderDetailsProm.prodDetails)
					.then(prodDetails => ({
						id: orderDetailsProm.id,
						prodDetails: prodDetails
					}))
					.catch(err => {
						err.httpStatusCode = 500;
						next(err);
					})
			)
		)
		.then(orderDetailsPromArr => {
			Promise.all(orderDetailsPromArr)
				.then(orderDetails => {
					res.render('shop/orders', {
						pageTitle: 'Your Orders',
						path: '/orders',
						orders: orderDetails
					});
				})
				.catch(err => {
					err.httpStatusCode = 500;
					next(err);
				});
		})
		.catch(err => {
			err.httpStatusCode = 500;
			next(err);
		});
};

exports.getCheckout = (req, res, next) => {
	User.findByEmail(req.session.userEmail)
		.then(user => (user ? user.cartItems : null))
		.then(items =>
			Promise.all(
				items
					? Object.keys(items).map(id =>
							Product.findById(id)
								.then(prod => ({ product: prod, qty: items[id].qty, price: items[id].price }))
								.catch(err => console.log(err))
					  )
					: []
			).then(cartProducts => {
				res.render('shop/checkout', {
					path: '/checkout',
					pageTitle: 'Checkout',
					cartProducts: cartProducts,
					totalSum: cartProducts.reduce((sum, prod) => (sum += prod.qty * prod.price), 0)
				});
			})
		);
};

exports.postOrder = (req, res, next) => {
	// Token is created using Checkout or Elements!
	// Get the payment token ID submitted by the form:
	const token = req.body.stripeToken; // Using Express

	/* (async () => {
		const charge = await stripe.charges.create({
			amount: 999,
			currency: 'usd',
			description: 'Example charge',
			source: token
		});
	})(); */

	User.findByEmail(req.session.userEmail)
		.then(user => user.addOrder())
		.then(order => {
			if (!order) {
				return res.redirect('/cart');
			}
			const charge = stripe.charges.create({
				amount: Object.keys(order.orderItems).reduce((acc, id) => (acc += order.orderItems[id].qty * order.orderItems[id].price), 0) * 100,
				currency: 'inr',
				description: 'Demo Order',
				source: token,
				metadata: { order_id: order.id.toString() }
			});
			res.redirect('/orders');
		})
		.catch(err => {
			err.httpStatusCode = 500;
			next(err);
		});
};

exports.getInvoice = (req, res, next) => {
	const orderId = req.params.orderId;
	let order;
	Order.getOrders(req.session.userEmail).then(orders => {
		if (
			orders &&
			orders.find(odr => {
				if (odr.id.toString() === orderId && odr.email === req.session.userEmail) {
					order = odr;
					return true;
				}
				return false;
			})
		) {
			const invoiceName = 'invoice-' + orderId + '.pdf';
			const invoicePath = path.join('data', 'invoices', invoiceName);

			const pdfDoc = new PDFDocument();
			pdfDoc.pipe(fs.createWriteStream(invoicePath));
			pdfDoc.pipe(res);

			pdfDoc.fontSize(26).text('Invoice', {
				underline: true
			});
			pdfDoc.text('------------------------------------------------');
			pdfDoc.fontSize(13);
			Object.keys(order.orderItems).forEach(key => pdfDoc.text(key + '  -  ' + JSON.stringify(order.orderItems[key])));

			pdfDoc.end();
			res.setHeader('Content-Type', 'application/pdf');
			res.setHeader('Content-Disposition', `inline; filename=${invoiceName}`);
			/* fs.readFile(invoicePath, (err, data) => {
				if (err) {
					return next(err);
				}
				res.send(data);
			}); */
			/* const file = fs.createReadStream(invoicePath);
			file.pipe(res); */
		} else {
			next(new Error('Unauthorized access!'));
		}
	});
};

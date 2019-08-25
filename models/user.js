const modelName = require('./db/dbModalNames').USERS;
const _db = require('./../utils/database');
const Order = require('./order');
const Product = require('./product');

module.exports = class User {
	constructor(email, password, name, cartItems = {}, resetToken, resetTokenExpiration, isAdmin, isVerified) {
		this.email = email;
		this.password = password;
		this.name = name;
		this.cartItems = cartItems;
		this.resetToken = resetToken;
		this.resetTokenExpiration = resetTokenExpiration;
		this.isAdmin = isAdmin;
		this.isVerified = isVerified;
	}

	static getModel() {
		return _db.getDbModel(modelName);
	}
	static build(usr, isResultFromQuery) {
		if (isResultFromQuery) {
			return usr
				? new User(
						usr.email,
						usr.password,
						usr.name,
						usr.cart_items ? usr.cart_items : undefined,
						usr.reset_token,
						usr.reset_token_expiration,
						usr.is_admin,
						usr.is_verified
				  )
				: null;
		} else {
			return usr
				? new User(
						usr.email,
						usr.password,
						usr.name,
						usr.cartItems ? usr.cartItems : undefined,
						usr.resetToken,
						usr.resetTokenExpiration,
						usr.isAdmin,
						usr.isVerified
				  )
				: null;
		}
	}

	save() {
		return User.getModel()
			.insert(this)
			.then(() => true)
			.catch(err => {
				console.log(err);
				throw err;
			});
	}

	addToCart(prodId, price) {
		const qty = this.cartItems[prodId] ? this.cartItems[prodId].qty : 0;
		this.cartItems[prodId] = { qty: +qty + 1, price: +price };
		return User.getModel()
			.update(this)
			.then()
			.catch(err => console.log(err));
	}

	removeFromCart(prodId) {
		let qty = this.cartItems[prodId];
		if (--qty) {
			this.cartItems[prodId] = qty;
		} else {
			delete this.cartItems[prodId];
		}
		return User.getModel()
			.update(this)
			.then()
			.catch(err => console.log(err));
	}

	refreshCartItemPrice() {
		const promArr = Object.keys(this.cartItems).map(prodId => {
			const { qty } = this.cartItems[prodId];
			return Product.findById(prodId).then(prod => {
				const res = {};
				res[prodId] = { qty, price: prod.price };
				return res;
			});
		});

		Promise.all(promArr).then(cartItems => {
			this.cartItems = cartItems.reduce((acc, cartItem) => {
				acc = { ...acc, ...cartItem };
				return acc;
			}, {});
		});
	}

	addOrder() {
		// this.refreshCartItemPrice();
		const order = new Order(this.email, this.cartItems);
		return Object.keys(order).length > 0
			? order
					.save()
					.then(() => {
						this.cartItems = {};
						User.getModel()
							.update(this)
							.then(() => true)
							.catch(err => console.log(err));
						return order;
					})
					.catch(err => console.log(err))
			: Promise.resolve(false);
	}

	static findByEmail(email) {
		return email
			? User.getModel()
					.get({ email })
					.then(usr => User.build(usr))
					.catch(err => Promise.reject(err))
			: Promise.resolve(null);
	}

	static findByToken(resetToken) {
		const query = 'SELECT * FROM users WHERE reset_token = ?';
		return _db
			.getDbClient()
			.execute(query, [resetToken], { prepare: true })
			.then(resSet => User.build(resSet.first(), true))
			.catch(err => console.log(err));
	}
};

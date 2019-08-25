const uuid = require('uuid/v4');

const modelName = require('./db/dbModalNames').ORDERS;
const _db = require('./../utils/database');

module.exports = class Order {
	constructor(email, orderItems, id = uuid()) {
		this.email = email;
		this.orderItems = orderItems;
		this.id = id;
	}

	static getModel() {
		return _db.getDbModel(modelName);
	}

	save() {
		return Order.getModel()
			.insert(this)
			.then()
			.catch(err => console.log(err));
	}

	static getOrders(email) {
		return Order.getModel()
			.find({ email })
			.then(orders => orders.toArray())
			.catch(err => console.log(err));
	}
};

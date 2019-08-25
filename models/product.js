const fs = require('fs');
const path = require('path');
const uuidv4 = require('uuid/v4');

const { ExecutionOptions } = require('cassandra-driver');

const rootDir = require('../utils/path');

const productsFilePath = path.join(rootDir, 'data', 'products.json');

const dbModelName = require('./db/dbModalNames').PRODUCTS;
const _db = require('./../utils/database');

/* const getProductsFromFile = callback => {
  fs.readFile(productsFilePath, (err, fileContent) => {
    if (err) {
      callback([]);
    } else {
      callback(JSON.parse(fileContent));
    }
  });
}; */

module.exports = class Product {
	constructor(type, title, imgUrl, price, description, id = uuidv4()) {
		this.id = id;
		this.type = type;
		this.title = title;
		this.price = price;
		this.imgUrl = imgUrl;
		this.description = description;
	}

	static build(prod) {
		return prod ? new Product(prod.type, prod.name, prod.img_url, prod.price, prod.description, prod.id.toString()) : prod;
	}

	static getModel() {
		return _db.getDbModel(dbModelName);
	}

	save() {
		return Product.getModel()
			.insert(this)
			.then(result => {
				console.log('Save wasApplied : ', result.wasApplied());
				return result;
			})
			.catch(err => {
				console.log(err);
				throw err;
			});
	}

	update() {
		return Product.getModel()
			.update(this)
			.then(result => console.log('Update wasApplied : ', result.wasApplied()))
			.catch(err => {
				console.log(err);
				throw err;
			});
	}
	/* save() {
    getProductsFromFile(products => {
      if (this.id) {
        const oldProductIndex = products.findIndex(prod => prod.id === this.id);
        products[oldProductIndex] = this;
      } else {
        this.id = uuidv1();
        products.push(this);
      }
      fs.writeFile(productsFilePath, JSON.stringify(products), err => {
        err ? console.log(err) : null;
      });
    });
  } */

	static deleteById(productId) {
		return Product.findById(productId).then(prod => {
			if (!prod) {
				return;
			}
			const { type, title, id } = prod;
			return Product.getModel()
				.remove({ type, title, id })
				.then(res => {
					console.log('Deleted wasApplied :', res.wasApplied());
					return prod;
				})
				.catch(err => console.log(err));
		});
		/* getProductsFromFile(products => {
			const deleteProduct = products.find(prod => prod.id === productId);
			const updatedProducts = products.filter(prod => prod.id !== productId);
			fs.writeFile(productsFilePath, JSON.stringify(updatedProducts), err => {
				if (!err) {
					Cart.deleteProduct(productId, deleteProduct.price);
				}
			});
		}); */
	}

	static fetchAll(itemsPerPage, pageState) {
		// getProductsFromFile(callback);
		try {
			const executionOptions = new ExecutionOptions();
			executionOptions.fetchSize = itemsPerPage;
			executionOptions.pageState = pageState;

			return Product.getModel()
				.findAll(null, executionOptions)
				.then(results => results)
				.catch(err => {
					return Promise.reject(err);
				});
		} catch (err) {
			return Promise.reject(err);
		}
	}

	static findById(id) {
		const query = 'SELECT * FROM products WHERE id = ?';
		return _db
			.getDbClient()
			.execute(query, [id], { prepare: true })
			.then(resSet => Product.build(resSet.first()))
			.catch(err => console.log(err));
	}

	/* getProductsFromFile(products => {
		const product = products.find(p => p.id === id);
		callback(product);
	}); */
};

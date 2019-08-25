const fs = require('fs');
const path = require('path');

const p = path.join(path.dirname(process.mainModule.filename), 'data', 'cart.json');

module.exports = class Cart {
  static addProduct(id, productPrice) {
    // Fetch the previous Cart
    let cart = { products: [], totalPrice: 0 };
    fs.readFile(p, (err, fileContent) => {
      if (!err) {
        cart = JSON.parse(fileContent);
      }

      // Analyze the cart => Find existing addProduct
      const existingProduct = cart.products.find(prod => prod.id === id);

      // Add new product/ increase quantity
      if (existingProduct) {
        existingProduct.qty++;
      } else {
        const newProduct = { id: id, qty: 1 };
        cart.products = [...cart.products, newProduct];
      }
      cart.totalPrice = cart.totalPrice + +productPrice;

      fs.writeFile(p, JSON.stringify(cart), err => {
        console.log(err);
      });
    });
  }

  static deleteProduct(id, productPrice) {
    fs.readFile(p, (err, fileContent) => {
      if (err) {
        return;
      }
      const cart = JSON.parse(fileContent);
      const index = cart.products.findIndex(product => product.id === id);
      const deleteProduct = cart.products[index];
      if (!deletedProduct) {
        return;
      }
      cart.totalPrice = cart.totalPrice - productPrice * deletedProduct.qty;
      cart.products.splice(index, 1);
      fs.writeFile(p, JSON.stringify(cart), err => {
        console.log(err);
      });
    });
  }

  static getProducts(callback) {
    fs.readFile(p, (err, fileContent) => {
      if (err) {
        callback(null);
        return;
      }
      const cart = JSON.parse(fileContent);
      callback(cart);
    });
  }
};

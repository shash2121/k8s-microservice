const { v4: uuidv4 } = require('uuid');

class Product {
  constructor(name, description, price, category, image, stock = 0, rating = 0, reviews = 0) {
    this.id = uuidv4();
    this.name = name;
    this.description = description;
    this.price = price;
    this.category = category;
    this.image = image;
    this.stock = stock;
    this.rating = rating;
    this.reviews = reviews;
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  update(data) {
    Object.assign(this, data, { updatedAt: new Date().toISOString() });
  }
}

module.exports = Product;

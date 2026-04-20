const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

class Address {
  constructor(userId, addressLine1, addressLine2, city, state, zipCode, country, isDefault = false) {
    this.id = uuidv4();
    this.userId = userId;
    this.addressLine1 = addressLine1;
    this.addressLine2 = addressLine2;
    this.city = city;
    this.state = state;
    this.zipCode = zipCode;
    this.country = country;
    this.isDefault = isDefault;
  }

  async save() {
    const query = `
      INSERT INTO user_addresses 
      (address_id, user_id, address_line1, address_line2, city, state, zip_code, country, is_default) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const addressLine2 = this.addressLine2 ?? null;
  const values = [this.id, this.userId, this.addressLine1, addressLine2, this.city, this.state, this.zipCode, this.country, this.isDefault];
    console.log('Saving address to DB:', values);
    await db.execute(query, values);
  }

  static async findByUserId(userId) {
    const [rows] = await db.execute('SELECT * FROM user_addresses WHERE user_id = ?', [userId]);
    return rows;
  }

  static async create(data) {
    const address = new Address(
      data.userId,
      data.addressLine1,
      data.addressLine2,
      data.city,
      data.state,
      data.zipCode,
      data.country,
      data.isDefault || false
    );
    await address.save();
    return address;
  }

  static async setDefault(userId, addressId) {
    // First, unset all defaults for the user
    await db.execute('UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?', [userId]);
    // Set the specific address as default
    await db.execute('UPDATE user_addresses SET is_default = TRUE WHERE address_id = ? AND user_id = ?', [addressId, userId]);
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      addressLine1: this.addressLine1,
      addressLine2: this.addressLine2,
      city: this.city,
      state: this.state,
      zipCode: this.zipCode,
      country: this.country,
      isDefault: this.isDefault
    };
  }
}

module.exports = { Address };

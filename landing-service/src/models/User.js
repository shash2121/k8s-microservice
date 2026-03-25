const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { getPool, getUsersMap, isConnected } = require('../config/database');

class User {
  constructor(name, email, password) {
    this.id = uuidv4();
    this.name = name;
    this.email = email;
    this.password = password;
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  async hashPassword() {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.updatedAt = new Date().toISOString();
  }

  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Save user to database
  async save() {
    if (!isConnected()) {
      getUsersMap().set(this.email, this);
      return;
    }
    
    const pool = getPool();
    const query = `
      INSERT INTO users (id, name, email, password_hash)
      VALUES (?, ?, ?, ?)
    `;
    await pool.execute(query, [this.id, this.name, this.email, this.password]);
  }

  // Find user by email
  static async findByEmail(email) {
    if (!isConnected()) {
      return getUsersMap().get(email) || null;
    }
    
    const pool = getPool();
    const query = 'SELECT * FROM users WHERE email = ?';
    const [rows] = await pool.execute(query, [email]);
    if (rows.length === 0) return null;
    
    const row = rows[0];
    const user = new User(row.name, row.email, row.password_hash);
    user.id = row.id;
    user.createdAt = row.created_at;
    user.updatedAt = row.updated_at;
    return user;
  }

  // Find user by ID
  static async findById(id) {
    if (!isConnected()) {
      for (const user of getUsersMap().values()) {
        if (user.id === id) return user;
      }
      return null;
    }
    
    const pool = getPool();
    const query = 'SELECT * FROM users WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    if (rows.length === 0) return null;
    
    const row = rows[0];
    const user = new User(row.name, row.email, row.password_hash);
    user.id = row.id;
    user.createdAt = row.created_at;
    user.updatedAt = row.updated_at;
    return user;
  }
}

module.exports = { User };

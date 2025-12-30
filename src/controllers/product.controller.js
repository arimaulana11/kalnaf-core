const db = require('../config/database');

exports.getAll = async (req, res) => {
  const result = await db.query(
    'SELECT id, name, description FROM products ORDER BY id DESC'
  );

  res.json(result.rows);
};

exports.create = async (req, res) => {
  const { name, description } = req.body;

  const result = await db.query(
    `INSERT INTO products (name, description)
     VALUES ($1, $2)
     RETURNING *`,
    [name, description]
  );

  res.status(201).json(result.rows[0]);
};

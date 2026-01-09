// src/controllers/product.controller.js
import db from '../config/database.js'; // pastikan .js karena ESM
import { google } from "googleapis";

// ==========================
// GET ALL PRODUCTS
// ==========================
export const getAll = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, description FROM products ORDER BY id DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET ALL PRODUCTS ERROR:', err);
    res.status(500).json({
      status: 'error',
      message: err.message,
      requestId: req.requestId
    });
  }
};

// ==========================
// CREATE PRODUCT
// ==========================
export const create = async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({
      status: 'error',
      message: 'Product name is required',
      requestId: req.requestId
    });
  }

  try {
    const result = await db.query(
      `INSERT INTO products (name, description)
       VALUES ($1, $2)
       RETURNING *`,
      [name, description || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('CREATE PRODUCT ERROR:', err);
    res.status(500).json({
      status: 'error',
      message: err.message,
      requestId: req.requestId
    });
  }
};


export const importSheet = async (req, res) => {
  try {
    const { sheetsName, dataX, dataY } = req.body;
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({
      version: "v4",
      auth,
    });

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // ⬇️ Ambil semua kolom (A–F)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetsName}!${dataX}:${dataY}`,
    });

    const values = response.data.values || [];

    if (values.length < 2) {
      return res.status(200).json({
        message: "Tidak ada data",
        data: [],
      });
    }

    // Baris pertama = header
    const headers = values[0].map(h =>
      h.toLowerCase().replace(/\s+/g, "_")
    );

    // Baris data
    const rows = values.slice(1);

    const data = rows
      .filter(row => row[0]) // skip row kosong
      .map(row => {
        const obj = {};

        headers.forEach((header, index) => {
          obj[header] = row[index] ?? null;
        });

        return {
          sku: obj.sku,
          name: obj.name,
          category: obj.category,
          unit: obj.unit,
          price: Number(obj.price),
          stock: Number(obj.stock),
          description: obj.description,
          createdAt: parseSheetDate(obj.created_at),
          updatedAt: parseSheetDate(obj.updated_at),
        };
      });

    return res.status(200).json({
      message: "Data berhasil diambil",
      total: data.length,
      data,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error.message || "Internal server error",
    });
  }
};

/**
 * Convert "27/11/2025, 14:00:25" → Date
 */
function parseSheetDate(value) {
  if (!value) return null;

  const [datePart, timePart] = value.split(", ");
  const [day, month, year] = datePart.split("/");

  return new Date(`${year}-${month}-${day}T${timePart}`);
}
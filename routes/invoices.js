"use strict";

const express = require("express");
const db = require("../db");
const { NotFoundError, BadRequestError } = require("../expressError");

const router = new express.Router();

/** GET "/""
 * Return info on invoices: like {invoices: [{id, comp_code}, ...]}
 * */
router.get("/", async function (req, res, next) {
  const results = await db.query(
    `SELECT id, comp_code
        FROM invoices`
  );
  const invoices = results.rows;

  return res.json({ invoices });
});


/** GET /[id]
 * Return obj on given invoice: {invoices: [{id, comp_code}, ...]}
 *
 * If the invoice cannot be found, return a 404 status response.
*/
router.get("/:id", async function (req, res, next) {
  const id = req.params.id;

  const invoiceResults = await db.query(
    `SELECT id, amt, paid, add_date, paid_date
        FROM invoices
        WHERE id = $1`,
    [id]
  );

  const getCompCode = await db.query(
    `SELECT comp_code
        FROM invoices
        WHERE id = $1`,
    [id]
  )

  if (invoiceResults.rows[0] === undefined){
    throw new NotFoundError(`No matching invoice id: ${id}`)
  }

  const compCode = getCompCode.rows[0].comp_code

  const company = await db.query(
    `SELECT code, name, description
        FROM companies
        WHERE code = $1`,
    [compCode]
    );

  const invoice = invoiceResults.rows[0];
  invoice.company = company.rows[0]

  return res.json({ invoice });
});


/**POST /
 * Adds an invoice with posted JSON.
 * ex => {comp_code, amt}
 *
 * Returns {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
*/
router.post("/", async function (req, res, next) {
  if (req.body === undefined) throw new BadRequestError();

  const iResults = await db.query(
    `INSERT INTO invoices (comp_code, amt)
        VALUES ($1, $2)
        RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [req.body.comp_code, req.body.amt]
  );

  // const cResults = await db.query(
  //   `SELECT code, name, description
  //       FROM companies
  //       WHERE code = $1`,
  //   [req.body.comp_code]
  //   );

  // if (cResults.rows[0] === undefined){
  //   throw new BadRequestError(`Cannot create invoice for: ${req.body.comp_code}`)
  // }

  const invoice = iResults.rows[0];

  return res.status(201).json({ invoice });
});


/**PUT /[id]
 * Updates an invoice with existing invoice.
 * ex => {amt}
 *
 * Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 * Returns 404 if invoice not found.
*/
router.put("/:id", async function (req, res, next) {
  if (req.body === undefined || (!(+req.body.amt))){
    throw new BadRequestError();
  }

  const id = req.params.id;
  const results = await db.query(
    `UPDATE invoices
        SET amt=$1
        WHERE id=$2
        RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [req.body.amt, id]
  );

  const invoice = results.rows[0];
  if (invoice === undefined) {
    throw new NotFoundError(`No matching invoice with id: ${id}`);
  }


  return res.json({ invoice });
});


/**
 * DELETE /[code]
 * Deletes company.
 * Returns 404 if company cannot be found.
 * Returns {status: "deleted"}
 */

router.delete("/:code", async function (req, res, next) {
  const code = req.params.code;

  const results = await db.query(
    `DELETE
        FROM companies
        WHERE code=$1
        RETURNING code`,
    [code]
  );

  if (results.rows.length === 0) {
    throw new NotFoundError(`No matching company: ${code}`);
  }

  // const deletedCompany = results.rows[0];
  // console.log("deletedCompany", deletedCompany);

  return res.json({ status: "deleted" });
});


module.exports = router;





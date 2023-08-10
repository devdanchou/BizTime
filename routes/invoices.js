"use strict";

const express = require("express");
const db = require("../db")
const { NotFoundError, BadRequestError } = require("../expressError");

const router = new express.Router();

/** GET "/""
 * Return info on invoices: like {invoices: [{id, comp_code}, ...]}
 * */

router.get("/", async function(req, res, next) {
  const results = await db.query(
    `SELECT id, comp_code
        FROM invoices`
    );
  const invoices = results.rows;

  return res.json({ invoices });
})


/** GET /[id]
 * Return obj on given invoice: {invoices: [{id, comp_code}, ...]}
 *
 * If the invoice cannot be found, return a 404 status response.
*/
router.get("/:id", async function(req, res, next) {
  const id = req.params.id;
  const results = await db.query(
    `SELECT id, comp_code
        FROM invoices
        WHERE id = $1`,
    [id]
    );

  const invoice = results.rows[0];
  if (invoice === undefined){
    throw new NotFoundError(`No matching invoice: ${id}`)
  }

  return res.json({ invoice });
})


/**POST /
 * Adds a company with posted JSON.
 * ex => {code, name, description}
 *
 * Returns obj of new company: {company: {code, name, description}}
*/
router.post("/", async function(req, res, next) {
  if (req.body === undefined) throw new BadRequestError();

  const results = await db.query(
    `INSERT INTO companies
        VALUES ($1, $2, $3)
        RETURNING code, name, description`,
    [req.body.code, req.body.name, req.body.description]
  );
  const company = results.rows[0];

  return res.status(201).json({ company })
})


/**PUT /[code]
 * Edit existing company with posted JSON.
 * ex => {name, description}
 *
 * Returns updated company: {company: {code, name, description}}
 * Returns 404 if company cannot be found.
*/
router.put("/:code", async function(req, res, next) {
  if (req.body === undefined ||
      req.body.code ||
      req.body.name === undefined ||
      req.body.description === undefined){
        throw new BadRequestError();
  }

  const code = req.params.code;
  const results = await db.query(
    `UPDATE companies
        SET name=$1,
            description=$2
        WHERE code=$3
        RETURNING code, name, description`,
    [req.body.name, req.body.description, code]
  )

  if (results.rows.length === 0) {
    throw new NotFoundError(`No matching company: ${code}`)
  }

  const updatedCompany = results.rows[0]

  return res.json({ updatedCompany }); // company: updatedCompany
})


/**
 * DELETE /[code]
 * Deletes company.
 * Returns 404 if company cannot be found.
 * Returns {status: "deleted"}
 */

router.delete("/:code", async function(req, res, next) {
  const code = req.params.code;

  const results = await db.query(
    `DELETE
        FROM companies
        WHERE code=$1
        RETURNING code`,
    [code]
  )

  if (results.rows.length === 0) {
    throw new NotFoundError(`No matching company: ${code}`)
  }

  // const deletedCompany = results.rows[0];
  // console.log("deletedCompany", deletedCompany);

  return res.json({status: "deleted"});
})


module.exports = router;





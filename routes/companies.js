"use strict";

const express = require("express");
const db = require("../db")
const { NotFoundError, BadRequestError } = require("../expressError");

const router = new express.Router();


/** GET "/""
 * Returns list of companies, like {companies: [{code, name}, ...]}
 * */

router.get("/", async function(req, res, next) {
  const results = await db.query(
    `SELECT code, name
        FROM companies`
    );
  const companies = results.rows;

  return res.json({ companies });
})


/** GET /[code]
 * Return obj of company: {company: {code, name, description}}
 *
 * If the company given cannot be found, return a 404 status response.
*/
router.get("/:code", async function(req, res, next) {
  const code = req.params.code;
  const results = await db.query(
    `SELECT code, name, description
        FROM companies
        WHERE code = $1`,
    [code]
    );

  if (results.rows.length === 0){
    throw new NotFoundError(`No matching company: ${code}`)
  }

  const company = results.rows[0];

  return res.json({ company });
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
      req.body.description === undefined){throw new BadRequestError()};

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

  return res.json({ updatedCompany });
})



// DELETE /companies/[code]
// Deletes company.

// Should return 404 if company cannot be found.

// Returns {status: "deleted"}


module.exports = router;


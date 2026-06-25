#!/usr/bin/env node
// validate-catalog.js -- Validates games.sample.json against the game catalog JSON Schema.
// Usage: node scripts/validate-catalog.js

const fs = require('fs');
const path = require('path');

const Ajv = require('ajv');

const schemaPath = path.join(__dirname, '..', 'docs', 'schema', 'game-catalog.schema.json');
const dataPath = path.join(__dirname, '..', 'content', 'games.sample.json');

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(schema);

const valid = validate(data);

if (valid) {
  console.log(`PASS: games.sample.json validates against game-catalog.schema.json`);
  console.log(`  ${data.length} games validated successfully.`);
  process.exit(0);
} else {
  console.error('FAIL: Validation errors found:');
  for (const err of validate.errors) {
    console.error(`  - ${err.instancePath || '/'}: ${err.message}`);
    if (err.params) console.error(`    params: ${JSON.stringify(err.params)}`);
  }
  process.exit(1);
}

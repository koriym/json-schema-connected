const sqlSchema = require('./sql-schema');

const multipleJsonSchemas = [
    `
  {
    "$id": "customer.json",
    "type": "object",
    "properties": {
      "customerId": { "type": "integer" },
      "name": { "type": "string" },
      "email": { "type": "string" },
      "phone": { "type": "string" },
      "addressId": { "$ref": "address.json" }
    },
    "required": ["customerId", "name", "email"]
  }
  `,
    `
  {
    "$id": "address.json",
    "type": "object",
    "properties": {
      "addressId": { "type": "integer" },
      "street": { "type": "string" },
      "city": { "type": "string" },
      "state": { "type": "string" },
      "postalCode": { "type": "string" }
    },
    "required": ["addressId"]
  }
  `
];

const expectedCreateTableSQL = `
CREATE TABLE customer (
  customer_id INT NOT NULL,
  name STRING NOT NULL,
  email STRING NOT NULL,
  phone STRING,
  address_id STRING
);

CREATE TABLE address (
  address_id INT NOT NULL,
  street STRING,
  city STRING,
  state STRING,
  postal_code STRING
);
`.trim();

test('jsonSchemasToCreateTables should convert JSON Schemas with $ref to SQL CREATE statements', () => {
    const result = sqlSchema.jsonSchemasToCreateTables(multipleJsonSchemas);
    expect(result).toBe(expectedCreateTableSQL);
});

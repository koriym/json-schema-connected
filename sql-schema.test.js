const sqlSchema = require('./sql-schema');

describe('SQL Schema Converter', () => {
    const multipleJsonSchemas = `
    {
      "$id": "customer.json",
      "type": "object",
      "properties": {
        "customerId": { "type": "integer" },
        "name": { "type": "string" },
        "address": { "$ref": "address.json" }
      }
    }
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
    }`;

    const expectedCreateTableSQL = `
CREATE TABLE customer (
  customer_id INT,
  name STRING,
  address_id INT,
  FOREIGN KEY (address_id) REFERENCES address(address_id)
);

CREATE TABLE address (
  address_id INT NOT NULL,
  street STRING,
  city STRING,
  state STRING,
  postal_code STRING
);`.trim();

    test('jsonSchemasToCreateTables should convert JSON Schemas with $ref to SQL CREATE statements', () => {
        sqlSchema.extractJsonSchemas(multipleJsonSchemas).forEach(schema => {
            const parsedSchema = JSON.parse(schema);
            sqlSchema.registerJsonSchema(parsedSchema.$id, parsedSchema);
        });
        const result = sqlSchema.convertJsonSchemasToCreateTables(multipleJsonSchemas);
        expect(result).toBe(expectedCreateTableSQL);
    });

    const singleJsonSchema = `
    {
      "$id": "order.json",
      "type": "object",
      "properties": {
        "orderId": { "type": "integer" },
        "orderDate": { "type": "string" },
        "customer": { "$ref": "customer.json" }
      }
    }`;

    const expectedSingleCreateTableSQL = `
CREATE TABLE order (
  order_id INT,
  order_date STRING,
  customer_id INT,
  FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
);`.trim();

    test('jsonSchemasToCreateTables should convert a single JSON Schema to SQL CREATE statement', () => {
        sqlSchema.extractJsonSchemas(singleJsonSchema).forEach(schema => {
            const parsedSchema = JSON.parse(schema);
            sqlSchema.registerJsonSchema(parsedSchema.$id, parsedSchema);
        });
        const result = sqlSchema.convertJsonSchemasToCreateTables(singleJsonSchema);
        expect(result).toBe(expectedSingleCreateTableSQL);
    });
});

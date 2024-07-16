const sqlSchema = require('../schema-sql');

describe('SQL Schema Converter', () => {
    const multipleJsonSchemas = `
    {
      "$id": "customer.json",
      "type": "object",
      "properties": {
        "customerId": { "type": "integer", "format": "id" },
        "name": { "type": "string" },
        "address": { "$ref": "address.json" }
      }
    }
    {
      "$id": "address.json",
      "type": "object",
      "properties": {
        "addressId": { "type": "integer", "format": "id" },
        "street": { "type": "string" },
        "city": { "type": "string" },
        "state": { "type": "string" },
        "postalCode": { "type": "string" }
      },
      "required": ["street", "city", "state"]
    }`;

    const expectedCreateTableSQL = `
CREATE TABLE customer (
  customer_id INT AUTO_INCREMENT PRIMARY KEY,
  name TEXT,
  address_id INT,
  FOREIGN KEY (address_id) REFERENCES address(address_id)
);

CREATE INDEX idx_customer_address_id ON customer(address_id);

CREATE TABLE address (
  address_id INT AUTO_INCREMENT PRIMARY KEY,
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT
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
        "orderId": { "type": "integer", "format": "id" },
        "orderDate": { "type": "string", "format": "date" },
        "customer": { "$ref": "customer.json" }
      }
    }`;

    const expectedSingleCreateTableSQL = `
CREATE TABLE order (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  order_date DATE,
  customer_id INT,
  FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
);

CREATE INDEX idx_order_customer_id ON order(customer_id);`.trim();

    test('jsonSchemasToCreateTables should convert a single JSON Schema to SQL CREATE statement', () => {
        sqlSchema.extractJsonSchemas(singleJsonSchema).forEach(schema => {
            const parsedSchema = JSON.parse(schema);
            sqlSchema.registerJsonSchema(parsedSchema.$id, parsedSchema);
        });
        const result = sqlSchema.convertJsonSchemasToCreateTables(singleJsonSchema);
        expect(result).toBe(expectedSingleCreateTableSQL);
    });
});

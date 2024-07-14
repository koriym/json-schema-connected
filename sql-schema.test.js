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
      "addressId": { "type": "string" }
    },
    "required": ["customerId", "name", "email"]
  }
  `,
    `
  {
    "$id": "address.json",
    "type": "object",
    "properties": {
      "addressId": { "type": "string" },
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
  address_id STRING NOT NULL,
  street STRING,
  city STRING,
  state STRING,
  postal_code STRING
);
`.trim();

const singleJsonSchema = `
{
  "$id": "product.json",
  "type": "object",
  "properties": {
    "productId": { "type": "integer" },
    "productName": { "type": "string" },
    "price": { "type": "number" },
    "manufacturer": { "type": "string" }
  },
  "required": ["productId", "productName", "price"]
}
`;

const expectedSingleCreateTableSQL = `
CREATE TABLE product (
  product_id INT NOT NULL,
  product_name STRING NOT NULL,
  price DECIMAL NOT NULL,
  manufacturer STRING
);
`.trim();

const nestedRefJsonSchemas = [
    `
  {
    "$id": "order.json",
    "type": "object",
    "properties": {
      "orderId": { "type": "integer" },
      "orderDate": { "type": "string" },
      "customer": { "$ref": "customer.json" },
      "items": { "type": "array", "items": { "$ref": "item.json" } },
      "totalAmount": { "type": "number" }
    },
    "required": ["orderId", "orderDate", "customer", "items", "totalAmount"]
  }
  `,
    `
  {
    "$id": "customer.json",
    "type": "object",
    "properties": {
      "customerId": { "type": "integer" },
      "name": { "type": "string" },
      "email": { "type": "string" }
    },
    "required": ["customerId", "name", "email"]
  }
  `,
    `
  {
    "$id": "item.json",
    "type": "object",
    "properties": {
      "itemId": { "type": "integer" },
      "productName": { "type": "string" },
      "quantity": { "type": "integer" },
      "price": { "type": "number" }
    },
    "required": ["itemId", "productName", "quantity", "price"]
  }
  `
];

const expectedNestedCreateTableSQL = `
CREATE TABLE order (
  order_id INT NOT NULL,
  order_date STRING NOT NULL,
  customer JSON NOT NULL,
  items JSON NOT NULL,
  total_amount DECIMAL NOT NULL
);

CREATE TABLE customer (
  customer_id INT NOT NULL,
  name STRING NOT NULL,
  email STRING NOT NULL
);

CREATE TABLE item (
  item_id INT NOT NULL,
  product_name STRING NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL NOT NULL
);
`.trim();

const complexNestedRefJsonSchemas = [
    `
  {
    "$id": "company.json",
    "type": "object",
    "properties": {
      "companyId": { "type": "integer" },
      "name": { "type": "string" },
      "departments": { "type": "array", "items": { "$ref": "department.json" } }
    },
    "required": ["companyId", "name"]
  }
  `,
    `
  {
    "$id": "department.json",
    "type": "object",
    "properties": {
      "departmentId": { "type": "integer" },
      "name": { "type": "string" },
      "manager": { "$ref": "person.json" },
      "employees": { "type": "array", "items": { "$ref": "person.json" } }
    },
    "required": ["departmentId", "name"]
  }
  `,
    `
  {
    "$id": "person.json",
    "type": "object",
    "properties": {
      "personId": { "type": "integer" },
      "firstName": { "type": "string" },
      "lastName": { "type": "string" },
      "address": { "$ref": "address.json" },
      "email": { "type": "string" }
    },
    "required": ["personId", "firstName", "lastName"]
  }
  `,
    `
  {
    "$id": "address.json",
    "type": "object",
    "properties": {
      "addressId": { "type": "string" },
      "street": { "type": "string" },
      "city": { "type": "string" },
      "state": { "type": "string" },
      "postalCode": { "type": "string" }
    },
    "required": ["addressId"]
  }
  `
];

const expectedComplexNestedCreateTableSQL = `
CREATE TABLE company (
  company_id INT NOT NULL,
  name STRING NOT NULL,
  departments JSON
);

CREATE TABLE department (
  department_id INT NOT NULL,
  name STRING NOT NULL,
  manager JSON,
  employees JSON
);

CREATE TABLE person (
  person_id INT NOT NULL,
  first_name STRING NOT NULL,
  last_name STRING NOT NULL,
  address JSON,
  email STRING
);

CREATE TABLE address (
  address_id STRING NOT NULL,
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

test('jsonSchemasToCreateTables should convert a single JSON Schema to SQL CREATE statement', () => {
    const result = sqlSchema.jsonSchemasToCreateTables([singleJsonSchema]);
    expect(result).toBe(expectedSingleCreateTableSQL);
});

test('jsonSchemasToCreateTables should handle nested $refs correctly', () => {
    const result = sqlSchema.jsonSchemasToCreateTables(nestedRefJsonSchemas);
    expect(result).toBe(expectedNestedCreateTableSQL);
});

test('jsonSchemasToCreateTables should handle complex nested $refs correctly', () => {
    const result = sqlSchema.jsonSchemasToCreateTables(complexNestedRefJsonSchemas);
    expect(result).toBe(expectedComplexNestedCreateTableSQL);
});

const arrayShape = require('./schema-array-shape');

describe('JSON Schema Converter', () => {
    // ... (previous test cases remain the same)

    const nestedSchemaWithRef = `
{
  "$id": "person.json",
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "contact": {
      "type": "object",
      "properties": {
        "phone": { "type": "string" },
        "address": { "$ref": "address.json" }
      }
    }
  }
}
{
  "$id": "address.json",
  "type": "object",
  "properties": {
    "street": { "type": "string" },
    "city": { "type": "string" }
  }
}`;

    test('should correctly handle nested schemas with $ref', () => {
        const result = arrayShape.convertJsonSchemasToArrayShapes(nestedSchemaWithRef);
        expect(result).toEqual([
            "array{name:string,contact:array{phone:string,address:Address}}",
            "array{street:string,city:string}"
        ]);
    });

    const schemaWithArray = `
{
  "$id": "arraySchema.json",
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "scores": {
      "type": "array",
      "items": { "type": "integer" }
    }
  }
}`;

    test('should correctly handle arrays', () => {
        const result = arrayShape.convertJsonSchemasToArrayShapes(schemaWithArray);
        expect(result).toEqual(["array{name:string,scores:array<int>}"]);
    });
});

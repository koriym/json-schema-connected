const arrayShape = require('./array-shape');

describe('JSON Schema Converter', () => {
    const simpleSchema = `
{
  "$id": "simple.json",
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "integer" },
    "isStudent": { "type": "boolean" }
  }
}`;

    test('should correctly convert simple schema', () => {
        const result = arrayShape.convertJsonSchemasToArrayShapes(simpleSchema);
        expect(result).toEqual(["array{name:string,age:int|float,isStudent:bool}"]);
    });

    const schemaWithRef = `
{
  "$id": "schema1.json",
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "address": { "$ref": "address.json" }
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

    test('should correctly resolve $ref in schema', () => {
        const result = arrayShape.convertJsonSchemasToArrayShapes(schemaWithRef);
        expect(result).toEqual([
            "array{name:string,address:array{street:string,city:string}}",
            "array{street:string,city:string}"
        ]);
    });

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
            "array{name:string,contact:array{phone:string,address:array{street:string,city:string}}}",
            "array{street:string,city:string}"
        ]);
    });
});

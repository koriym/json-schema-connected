const { registerJsonSchema, resolveJsonSchemaRef, jsonSchemaToArrayShape, extractJsonSchemas, convertJsonSchemasToArrayShapes } = require('./array-shape');

describe('JSON Schema Converter', () => {
    beforeAll(() => {
        document.body.innerHTML = `
      <textarea id="jsonSchemas"></textarea>
      <pre id="result"></pre>
    `;
    });

    test('should correctly convert simple schema', () => {
        const schema = `{
      "$id": "simple.json",
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "age": { "type": "integer" }
      }
    }`;

        document.getElementById('jsonSchemas').value = schema;
        convertJsonSchemasToArrayShapes();

        const result = document.getElementById('result').textContent;
        expect(result).toBe('array{name:string,age:int}');
    });

    test('should correctly resolve $ref in schema', () => {
        const schemas = `{
      "$id": "address.json",
      "type": "object",
      "properties": {
        "street": { "type": "string" },
        "city": { "type": "string" }
      }
    }
    {
      "$id": "person.json",
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "address": { "$ref": "address.json" }
      }
    }`;

        document.getElementById('jsonSchemas').value = schemas;
        convertJsonSchemasToArrayShapes();

        const result = document.getElementById('result').textContent;
        expect(result).toBe('array{street:string,city:string}\narray{name:string,address:array{street:string,city:string}}');
    });

    test('should correctly handle nested schemas with $ref', () => {
        const schemas = `{
      "$id": "product.json",
      "type": "object",
      "properties": {
        "product_id": { "type": "string" },
        "manufacturer": { "$ref": "manufacturer.json" }
      }
    }
    {
      "$id": "manufacturer.json",
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

        document.getElementById('jsonSchemas').value = schemas;
        convertJsonSchemasToArrayShapes();

        const result = document.getElementById('result').textContent;
        expect(result).toBe(
            'array{product_id:string,manufacturer:array{name:string,address:array{street:string,city:string}}}\n' +
            'array{name:string,address:array{street:string,city:string}}\n' +
            'array{street:string,city:string}'
        );
    });

    test('should extract JSON objects from text', () => {
        const text = `{
      "type": "object",
      "properties": {
        "name": { "type": "string" }
      }
    }{
      "type": "object",
      "properties": {
        "age": { "type": "integer" }
      }
    }`;

        const jsonObjects = extractJsonSchemas(text);
        expect(jsonObjects.length).toBe(2);
        expect(JSON.parse(jsonObjects[0])).toEqual({
            type: 'object',
            properties: {
                name: { type: 'string' }
            }
        });
        expect(JSON.parse(jsonObjects[1])).toEqual({
            type: 'object',
            properties: {
                age: { type: 'integer' }
            }
        });
    });
});

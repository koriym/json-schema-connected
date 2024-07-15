const { jsonSchemaToMarkdown, convertJsonSchemasToMarkdowns } = require('./schema-markdown');

describe('JSON Schema to Markdown Converter', () => {
    const schemaRegistry = {};

    beforeEach(() => {
        // テスト用のスキーマを登録
        schemaRegistry['customer.json'] = {
            $id: 'customer.json',
            type: 'object',
            properties: {
                id: { type: 'integer', description: 'Customer ID', format: 'id' },
                name: { type: 'string', description: 'Customer name', minLength: 1, maxLength: 100 },
                email: { type: 'string', description: 'Customer email', format: 'email' },
                address: { $ref: 'address.json' }
            },
            required: ['id', 'name', 'email']
        };

        schemaRegistry['address.json'] = {
            $id: 'address.json',
            type: 'object',
            properties: {
                street: { type: 'string', description: 'Street address' },
                city: { type: 'string', description: 'City name' },
                zipCode: { type: 'string', description: 'Zip code', pattern: '^\\d{5}$' }
            },
            required: ['street', 'city']
        };

        global.schemaRegistry = schemaRegistry;
    });

    test('jsonSchemaToMarkdown should generate correct markdown for a single schema', () => {
        const expectedMarkdown = `## customer

| Property | Type    | Description | Required | Constraints |
|----------|---------|-------------|----------|-------------|
| id | integer | Customer ID | Yes | format: id |
| name | string | Customer name | Yes | minLength: 1, maxLength: 100 |
| email | string | Customer email | Yes | format: email |
| address | object | Embedded: [address](#address) | No | |`;

        const result = jsonSchemaToMarkdown(schemaRegistry['customer.json'], '');
        expect(result.trim()).toBe(expectedMarkdown);
    });

    test('convertJsonSchemasToMarkdowns should generate correct markdown for multiple schemas', () => {
        const expectedMarkdown = `## customer

| Property | Type    | Description | Required | Constraints |
|----------|---------|-------------|----------|-------------|
| id | integer | Customer ID | Yes | format: id |
| name | string | Customer name | Yes | minLength: 1, maxLength: 100 |
| email | string | Customer email | Yes | format: email |
| address | object | Embedded: [address](#address) | No | |


## address

| Property | Type    | Description | Required | Constraints |
|----------|---------|-------------|----------|-------------|
| street | string | Street address | Yes |  |
| city | string | City name | Yes |  |
| zipCode | string | Zip code | No | pattern: ^\\d{5}$ |`;

        const result = convertJsonSchemasToMarkdowns(Object.values(schemaRegistry), '');
        expect(result.trim()).toBe(expectedMarkdown);
    });

    test('jsonSchemaToMarkdown should handle schemas without properties', () => {
        const emptySchema = {
            $id: 'empty.json',
            type: 'object'
        };

        const expectedMarkdown = `## empty`;

        const result = jsonSchemaToMarkdown(emptySchema, '');
        expect(result.trim()).toBe(expectedMarkdown.trim());
    });

    test('convertJsonSchemasToMarkdowns should handle circular references', () => {
        schemaRegistry['circular1.json'] = {
            $id: 'circular1.json',
            type: 'object',
            properties: {
                ref2: { $ref: 'circular2.json' }
            }
        };

        schemaRegistry['circular2.json'] = {
            $id: 'circular2.json',
            type: 'object',
            properties: {
                ref1: { $ref: 'circular1.json' }
            }
        };

        const expectedMarkdown = `## circular1

| Property | Type    | Description | Required | Constraints |
|----------|---------|-------------|----------|-------------|
| ref2 | object | Embedded: [circular2](#circular2) | No | |


## circular2

| Property | Type    | Description | Required | Constraints |
|----------|---------|-------------|----------|-------------|
| ref1 | object | Embedded: [circular1](#circular1) | No | |`;

        const result = convertJsonSchemasToMarkdowns([schemaRegistry['circular1.json'], schemaRegistry['circular2.json']], '');
        expect(result.trim()).toBe(expectedMarkdown);
    });
});

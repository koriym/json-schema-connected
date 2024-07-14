const arrayShapeSchemaRegistry = {};

function registerJsonSchema(id, schema) {
    arrayShapeSchemaRegistry[id] = schema;
}

function resolveJsonSchemaRef(ref, baseUrl) {
    const parts = ref.split('#');
    const id = parts[0] ? (parts[0].startsWith('/') ? baseUrl + parts[0] : parts[0]) : baseUrl;
    const path = parts[1] ? parts[1].split('/').slice(1) : [];

    if (!arrayShapeSchemaRegistry[id]) {
        console.error(`Schema with id ${id} not found in registry`);
        return null;
    }

    let schema = arrayShapeSchemaRegistry[id];
    for (let part of path) {
        if (!schema[part]) {
            console.error(`Property ${part} not found in schema ${id}`);
            return null;
        }
        schema = schema[part];
    }
    return schema;
}

function jsonSchemaToArrayShape(schema, baseUrl) {
    let shape = {};

    if (schema.$ref) {
        schema = resolveJsonSchemaRef(schema.$ref, baseUrl);
        if (!schema) {
            return 'undefined';
        }
    }

    if (schema.type) {
        if (schema.type === 'object' && schema.properties) {
            for (let key in schema.properties) {
                shape[key] = jsonSchemaToArrayShape(schema.properties[key], baseUrl);
            }
        } else if (schema.type === 'array' && schema.items) {
            shape = 'array<' + jsonSchemaToArrayShape(schema.items, baseUrl) + '>';
        } else if (schema.type === 'string') {
            shape = 'string';
        } else if (schema.type === 'number' || schema.type === 'integer') {
            shape = 'int|float';
        } else if (schema.type === 'boolean') {
            shape = 'bool';
        } else if (schema.type === 'null') {
            shape = 'null';
        }
    }

    if (typeof shape === 'object') {
        let shapeString = 'array{';
        shapeString += Object.keys(shape).map(key => `${key}:${shape[key]}`).join(',');
        shapeString += '}';
        return shapeString;
    } else {
        return shape;
    }
}

function extractJsonSchemas(text) {
    const jsonSchemas = [];
    let stack = [];
    let startIndex = null;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (char === '{') {
            if (stack.length === 0) {
                startIndex = i;
            }
            stack.push(char);
        } else if (char === '}') {
            if (stack.length === 1) {
                jsonSchemas.push(text.slice(startIndex, i + 1));
            }
            stack.pop();
        }
    }

    return jsonSchemas;
}

function convertJsonSchemasToArrayShapes(jsonSchemasText) {
    const schemas = extractJsonSchemas(jsonSchemasText).map(schemaText => JSON.parse(schemaText.trim()));

    schemas.forEach((schema) => {
        registerJsonSchema(schema.$id, schema);
    });

    const baseUrl = typeof window !== 'undefined' ? window.location.href : '';
    return schemas.map(schema => jsonSchemaToArrayShape(schema, baseUrl));
}

// グローバル変数として公開（ブラウザ環境）
if (typeof window !== 'undefined') {
    window.arrayShape = {
        registerJsonSchema,
        resolveJsonSchemaRef,
        jsonSchemaToArrayShape,
        extractJsonSchemas,
        convertJsonSchemasToArrayShapes
    };
}

// モジュールエクスポート（Node.js環境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        registerJsonSchema,
        resolveJsonSchemaRef,
        jsonSchemaToArrayShape,
        extractJsonSchemas,
        convertJsonSchemasToArrayShapes
    };
}

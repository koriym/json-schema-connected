const schemaRegistry = {};

// Function to register a JSON schema in the registry
function registerJsonSchema(id, schema) {
    schemaRegistry[id] = schema;
}

// Function to resolve a JSON schema reference
function resolveJsonSchemaRef(ref, baseUrl) {
    const parts = ref.split('#');
    const id = parts[0] ? (parts[0].startsWith('/') ? baseUrl + parts[0] : parts[0]) : baseUrl;
    const path = parts[1] ? parts[1].split('/').slice(1) : [];

    if (!schemaRegistry[id]) {
        console.error(`Schema with id ${id} not found in registry`);
        return null;
    }

    let schema = schemaRegistry[id];
    for (let part of path) {
        if (!schema[part]) {
            console.error(`Property ${part} not found in schema ${id}`);
            return null;
        }
        schema = schema[part];
    }
    return schema;
}

// Function to convert a JSON schema to array-shape format
function jsonSchemaToArrayShape(schema, baseUrl) {
    if (schema.$ref) {
        schema = resolveJsonSchemaRef(schema.$ref, baseUrl);
        if (!schema) {
            return 'undefined';
        }
    }

    if (schema.type) {
        switch (schema.type) {
            case 'object':
                if (schema.properties) {
                    let shape = {};
                    for (let key in schema.properties) {
                        shape[key] = jsonSchemaToArrayShape(schema.properties[key], baseUrl);
                    }
                    let shapeString = 'array{';
                    shapeString += Object.keys(shape).map(key => `${key}:${shape[key]}`).join(',');
                    shapeString += '}';
                    return shapeString;
                }
                break;
            case 'array':
                if (schema.items) {
                    return 'array<' + jsonSchemaToArrayShape(schema.items, baseUrl) + '>';
                }
                break;
            case 'string':
                return 'string';
            case 'number':
                return 'int|float';
            case 'integer':
                return 'int';
            case 'boolean':
                return 'bool';
            case 'null':
                return 'null';
            default:
                return 'mixed';
        }
    }
    return 'undefined';
}

// Function to extract JSON schemas from text
function extractJsonSchemas(text) {
    const jsonObjects = [];
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
                jsonObjects.push(text.slice(startIndex, i + 1));
            }
            stack.pop();
        }
    }

    return jsonObjects;
}

// Main function to convert JSON schemas to array-shapes
function convertJsonSchemasToArrayShapes() {
    const jsonSchemasText = document.getElementById('jsonSchemas').value;
    const schemas = extractJsonSchemas(jsonSchemasText).map(schemaText => JSON.parse(schemaText.trim()));

    schemas.forEach((schema) => {
        registerJsonSchema(schema.$id, schema);
    });

    const baseUrl = window.location.href;
    const arrayShapeStrings = schemas.map(schema => jsonSchemaToArrayShape(schema, baseUrl));
    document.getElementById('result').textContent = arrayShapeStrings.join('\n');
}

module.exports = {
    registerJsonSchema,
    resolveJsonSchemaRef,
    jsonSchemaToArrayShape,
    extractJsonSchemas,
    convertJsonSchemasToArrayShapes
};

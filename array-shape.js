const schemaRegistry = {};

function registerSchema(id, schema) {
    schemaRegistry[id] = schema;
}

function resolveRef(ref, baseUrl) {
    const parts = ref.split('#');
    const id = parts[0] ? (parts[0].startsWith('/') ? baseUrl + parts[0] : parts[0]) : baseUrl;
    const path = parts[1] ? parts[1].split('/').slice(1) : [];
    let schema = schemaRegistry[id];
    for (let part of path) {
        schema = schema[part];
    }
    return schema;
}

function generateArrayShapeString(schema, baseUrl) {
    let shape = {};

    if (schema.$ref) {
        schema = resolveRef(schema.$ref, baseUrl);
    }

    if (schema.type) {
        if (schema.type === 'object' && schema.properties) {
            for (let key in schema.properties) {
                shape[key] = generateArrayShapeString(schema.properties[key], baseUrl);
            }
        } else if (schema.type === 'array' && schema.items) {
            shape = 'array<' + generateArrayShapeString(schema.items, baseUrl) + '>';
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

function extractJsonObjects(text) {
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

function convertJsonSchemas() {
    const jsonSchemasText = document.getElementById('jsonSchemas').value;
    const schemas = extractJsonObjects(jsonSchemasText).map(schemaText => JSON.parse(schemaText.trim()));

    schemas.forEach((schema, index) => {
        registerSchema(`schema${index}`, schema);
    });

    const baseUrl = window.location.href;
    const arrayShapeString = generateArrayShapeString(schemas[0], baseUrl);
    document.getElementById('result').textContent = arrayShapeString;
}

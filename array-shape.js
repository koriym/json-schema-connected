const arrayShapeSchemaRegistry = {};

function registerJsonSchema(id, schema) {
    arrayShapeSchemaRegistry[id] = schema;
}

function getSchemaName(schema, fallbackName) {
    return schema.$id ? schema.$id.split('/').pop().split('.')[0] :
        schema.title ? schema.title.replace(/\s+/g, '') :
            fallbackName;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function jsonSchemaToArrayShape(schema, baseUrl, schemaName, visited = new Set()) {
    if (typeof schema !== 'object' || schema === null) {
        return 'undefined';
    }

    const schemaId = schema.$id || baseUrl;
    if (visited.has(schemaId)) {
        return capitalizeFirstLetter(getSchemaName(schema, schemaName));
    }
    visited.add(schemaId);

    let shape = {};

    if (schema.$ref) {
        const refParts = schema.$ref.split('/');
        const refName = refParts[refParts.length - 1].split('.')[0];
        return capitalizeFirstLetter(refName);
    }

    if (schema.type) {
        if (schema.type === 'object' && schema.properties) {
            for (let key in schema.properties) {
                shape[key] = jsonSchemaToArrayShape(schema.properties[key], baseUrl, key, new Set(visited));
            }
        } else if (schema.type === 'array' && schema.items) {
            const itemSchemaName = getSchemaName(schema.items, `${schemaName}Item`);
            shape = `array<${jsonSchemaToArrayShape(schema.items, baseUrl, itemSchemaName, new Set(visited))}>`;
        } else if (schema.type === 'string') {
            shape = 'string';
        } else if (schema.type === 'number' || schema.type === 'integer') {
            shape = 'int';
        } else if (schema.type === 'boolean') {
            shape = 'bool';
        } else if (schema.type === 'null') {
            shape = 'null';
        }
    } else {
        // If type is not specified, treat it as an object
        shape = capitalizeFirstLetter(getSchemaName(schema, schemaName));
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
        registerJsonSchema(schema.$id || schema.title || 'unnamed_schema', schema);
    });

    const baseUrl = '';
    return schemas.map(schema => {
        const schemaName = getSchemaName(schema, 'UnnamedSchema');
        return jsonSchemaToArrayShape(schema, baseUrl, schemaName, new Set());
    });
}

// グローバル変数として公開（ブラウザ環境）
if (typeof window !== 'undefined') {
    window.arrayShape = {
        registerJsonSchema,
        jsonSchemaToArrayShape,
        extractJsonSchemas,
        convertJsonSchemasToArrayShapes
    };
}

// モジュールエクスポート（Node.js環境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        registerJsonSchema,
        jsonSchemaToArrayShape,
        extractJsonSchemas,
        convertJsonSchemasToArrayShapes
    };
}

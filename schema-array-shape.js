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

function jsonSchemaToArrayShape(schema, schemaName) {
    if (typeof schema !== 'object' || schema === null) {
        return 'undefined';
    }

    if (schema.$ref) {
        const refParts = schema.$ref.split('/');
        const refName = refParts[refParts.length - 1].split('.')[0];
        return capitalizeFirstLetter(refName);
    }

    if (schema.type === 'object' && schema.properties) {
        let shape = {};
        for (let key in schema.properties) {
            shape[key] = jsonSchemaToArrayShape(schema.properties[key], key);
        }
        let shapeString = 'array{';
        shapeString += Object.keys(shape).map(key => `${key}:${shape[key]}`).join(',');
        shapeString += '}';
        return shapeString;
    } else if (schema.type === 'array' && schema.items) {
        const itemSchemaName = getSchemaName(schema.items, `${schemaName}Item`);
        return `array<${jsonSchemaToArrayShape(schema.items, itemSchemaName)}>`;
    } else if (schema.type === 'string') {
        return 'string';
    } else if (schema.type === 'number') {
        return 'float';
    } else if (schema.type === 'integer') {
        return 'int';
    } else if (schema.type === 'boolean') {
        return 'bool';
    } else if (schema.type === 'null') {
        return 'null';
    } else {
        return capitalizeFirstLetter(getSchemaName(schema, schemaName));
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

    return schemas.map(schema => {
        const schemaName = getSchemaName(schema, 'UnnamedSchema');
        return jsonSchemaToArrayShape(schema, schemaName);
    });
}

// グローバル変数として公開（ブラウザ環境）
if (typeof window !== 'undefined') {
    window.arrayShape = {
        jsonSchemaToArrayShape,
        convertJsonSchemasToArrayShapes
    };
}

// モジュールエクスポート（Node.js環境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        jsonSchemaToArrayShape,
        convertJsonSchemasToArrayShapes
    };
}

const sqlSchemaRegistry = {};

function registerJsonSchema(id, schema) {
    sqlSchemaRegistry[id] = schema;
}

function resolveJsonSchemaRef(ref) {
    const parts = ref.split('#');
    const id = parts[0];
    const path = parts[1] ? parts[1].split('/').slice(1) : [];

    if (!sqlSchemaRegistry[id]) {
        console.error(`Schema with id ${id} not found in registry`);
        return null;
    }

    let schema = sqlSchemaRegistry[id];
    for (let part of path) {
        if (!schema[part]) {
            console.error(`Property ${part} not found in schema ${id}`);
            return null;
        }
        schema = schema[part];
    }
    return schema;
}

function getColumnType(property) {
    if (property.$ref) {
        return "REFERENCE";
    } else {
        switch (property.type) {
            case "integer": return "INT";
            case "number": return "DECIMAL";
            case "boolean": return "BOOLEAN";
            case "array": return "JSON";
            case "object": return "JSON";
            default: return "VARCHAR(255)";
        }
    }
}

function jsonSchemaToCreateTable(jsonSchema, tableName) {
    const schema = typeof jsonSchema === 'string' ? JSON.parse(jsonSchema) : jsonSchema;
    const properties = schema.properties || {};
    const required = schema.required || [];
    const foreignKeys = [];
    const columns = [];

    for (const [prop, propertySchema] of Object.entries(properties)) {
        const columnName = camelToSnake(prop);
        let columnType = getColumnType(propertySchema);

        if (columnType === "REFERENCE") {
            const refSchema = resolveJsonSchemaRef(propertySchema.$ref);
            const refTableName = propertySchema.$ref.split('.')[0];
            const refColumnName = Object.keys(refSchema.properties).find(key => key.toLowerCase().includes('id')) || 'id';
            foreignKeys.push(`FOREIGN KEY (${columnName}_id) REFERENCES ${refTableName}(${camelToSnake(refColumnName)})`);
            columns.push(`${columnName}_id INT${required.includes(prop) ? ' NOT NULL' : ''}`);
        } else {
            columns.push(`${columnName} ${columnType}${required.includes(prop) ? ' NOT NULL' : ''}`);
        }
    }

    if (foreignKeys.length > 0) {
        columns.push(...foreignKeys);
    }

    return `CREATE TABLE ${tableName} (\n  ${columns.join(',\n  ')}\n);`;
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

function convertJsonSchemasToCreateTables(jsonSchemasText) {
    const jsonSchemas = extractJsonSchemas(jsonSchemasText);
    const createStatements = [];

    jsonSchemas.forEach(schemaText => {
        const schema = JSON.parse(schemaText.trim());
        registerJsonSchema(schema.$id, schema);
    });

    jsonSchemas.forEach(schemaText => {
        const schema = JSON.parse(schemaText.trim());
        const tableName = schema.$id.replace('.json', '');
        createStatements.push(jsonSchemaToCreateTable(schema, tableName));
    });

    return createStatements.join('\n\n');
}

function camelToSnake(camelStr) {
    return camelStr.replace(/([A-Z])/g, '_$1').toLowerCase();
}

// グローバル変数として公開（ブラウザ環境）
if (typeof window !== 'undefined') {
    window.sqlSchema = {
        registerJsonSchema,
        resolveJsonSchemaRef,
        jsonSchemaToCreateTable,
        extractJsonSchemas,
        convertJsonSchemasToCreateTables
    };
}

// モジュールエクスポート（Node.js環境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        registerJsonSchema,
        resolveJsonSchemaRef,
        jsonSchemaToCreateTable,
        extractJsonSchemas,
        convertJsonSchemasToCreateTables
    };
}

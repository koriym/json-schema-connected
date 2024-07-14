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
        const refSchema = resolveJsonSchemaRef(property.$ref);
        return refSchema && refSchema.type ? refSchema.type.toUpperCase() : "STRING";
    } else {
        return property.type ? property.type.toUpperCase() : "STRING";
    }
}

function jsonSchemaToCreateTable(jsonSchema, tableName) {
    const schema = JSON.parse(jsonSchema);
    const properties = schema.properties || {};
    const required = schema.required || [];
    const foreignKeys = [];

    const columns = Object.keys(properties).map(prop => {
        const columnName = camelToSnake(prop);
        let columnType = getColumnType(properties[prop]);

        switch (columnType) {
            case "INTEGER":
                columnType = "INT";
                break;
            case "NUMBER":
                columnType = "DECIMAL";
                break;
            case "BOOLEAN":
                columnType = "BOOLEAN";
                break;
            case "NULL":
                columnType = "NULL";
                break;
            case "ARRAY":
                columnType = "JSON";
                break;
            case "OBJECT":
                if (properties[prop].$ref) {
                    const refSchema = resolveJsonSchemaRef(properties[prop].$ref);
                    const refTableName = properties[prop].$ref.split('.')[0];
                    const refColumnName = Object.keys(refSchema.properties).find(key => key.includes('Id'));
                    foreignKeys.push(`FOREIGN KEY (${columnName}_id) REFERENCES ${refTableName}(${camelToSnake(refColumnName)})`);
                    return `${columnName}_id INT`;
                } else {
                    columnType = "JSON";
                }
                break;
            default:
                columnType = "STRING";
        }
        const columnDef = `${columnName} ${columnType}${required.includes(prop) ? ' NOT NULL' : ''}`;
        return columnDef;
    }).filter(col => col !== null);

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
    const schemaRegistry = {};
    const createStatements = [];

    jsonSchemas.forEach(schemaText => {
        const schema = JSON.parse(schemaText.trim());
        schemaRegistry[schema.$id] = schema;
    });

    jsonSchemas.forEach(schemaText => {
        const schema = JSON.parse(schemaText.trim());
        const tableName = schema.$id.replace('.json', '');
        createStatements.push(jsonSchemaToCreateTable(JSON.stringify(schema), tableName));
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

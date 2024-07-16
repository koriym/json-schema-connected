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
            case "integer":
                return property.format === "id" ? "INT AUTO_INCREMENT PRIMARY KEY" :
                    property.format === "int64" ? "BIGINT" : "INT";
            case "number": return property.format === "float" ? "FLOAT" : "DECIMAL";
            case "boolean": return "BOOLEAN";
            case "array": return "JSON -- Consider normalization";
            case "object": return "JSON -- Consider normalization";
            case "string":
                if (property.format === "date") return "DATE";
                if (property.format === "date-time") return "TIMESTAMP";
                if (property.maxLength) return `VARCHAR(${property.maxLength})`;
                return "TEXT";
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
    const indices = [];
    const uniques = [];

    let primaryKey = null;

    for (const [prop, propertySchema] of Object.entries(properties)) {
        const columnName = camelToSnake(prop);
        let columnType = getColumnType(propertySchema);
        let columnDef = `${columnName} ${columnType}`;

        if (required.includes(prop)) {
            columnDef += ' NOT NULL';
        }

        if (propertySchema.default !== undefined) {
            columnDef += ` DEFAULT ${JSON.stringify(propertySchema.default)}`;
        }

        if (columnType.includes("PRIMARY KEY")) {
            primaryKey = columnName;
        }

        if (columnType === "REFERENCE") {
            const refSchema = resolveJsonSchemaRef(propertySchema.$ref);
            const refTableName = propertySchema.$ref.split('.')[0];
            const refColumnName = Object.keys(refSchema.properties).find(key =>
                refSchema.properties[key].type === "integer" && refSchema.properties[key].format === "id"
            ) || 'id';
            foreignKeys.push(`FOREIGN KEY (${columnName}_id) REFERENCES ${refTableName}(${camelToSnake(refColumnName)})`);
            columns.push(`${columnName}_id INT${required.includes(prop) ? ' NOT NULL' : ''}`);
            indices.push(`CREATE INDEX idx_${tableName}_${columnName}_id ON ${tableName}(${columnName}_id);`);
        } else {
            columns.push(columnDef);
        }

        if (propertySchema.pattern === "UNIQUE") {
            uniques.push(`UNIQUE (${columnName})`);
        }
    }

    if (!primaryKey) {
        columns.unshift('id INT AUTO_INCREMENT PRIMARY KEY');
        primaryKey = 'id';
    }

    if (foreignKeys.length > 0) {
        columns.push(...foreignKeys);
    }

    if (uniques.length > 0) {
        columns.push(...uniques);
    }

    let createTableStatement = `CREATE TABLE ${tableName} (\n  ${columns.join(',\n  ')}\n);`;

    if (indices.length > 0) {
        createTableStatement += '\n\n' + indices.join('\n');
    }

    return createTableStatement;
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
        jsonSchemaToCreateTable,
        extractJsonSchemas,
        convertJsonSchemasToCreateTables
    };
}

// モジュールエクスポート（Node.js環境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        registerJsonSchema,
        jsonSchemaToCreateTable,
        extractJsonSchemas,
        convertJsonSchemasToCreateTables
    };
}

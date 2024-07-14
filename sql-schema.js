const sqlSchema = {};

// スネークケースをキャメルケースに変換する関数
function snakeToCamel(snakeStr) {
    return snakeStr.replace(/(_\w)/g, matches => matches[1].toUpperCase());
}

// キャメルケースをスネークケースに変換する関数
function camelToSnake(camelStr) {
    return camelStr.replace(/([A-Z])/g, '_$1').toLowerCase();
}

// $refを再帰的に解決する関数
function resolveRef(ref, schemaRegistry) {
    const refSchemaId = ref.replace('#', '').replace('/', '');
    const refSchema = schemaRegistry[refSchemaId];

    if (refSchema && refSchema.$ref) {
        return resolveRef(refSchema.$ref, schemaRegistry);
    }

    return refSchema;
}

// プロパティの型を取得する関数
function getColumnType(property, schemaRegistry) {
    if (property.$ref) {
        const refSchema = resolveRef(property.$ref, schemaRegistry);
        return refSchema && refSchema.type ? refSchema.type.toUpperCase() : "STRING";
    } else {
        return property.type ? property.type.toUpperCase() : "STRING";
    }
}

// JSONスキーマからSQLのCREATE文を生成する関数
function jsonSchemaToCreateTable(jsonSchema, tableName, schemaRegistry) {
    const schema = JSON.parse(jsonSchema);
    const properties = schema.properties || {};
    const required = schema.required || [];

    const columns = Object.keys(properties).map(prop => {
        const columnName = camelToSnake(prop);
        let columnType = getColumnType(properties[prop], schemaRegistry);

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
                columnType = "JSON";
                break;
            default:
                columnType = "STRING";
        }
        const columnDef = `${columnName} ${columnType}${required.includes(prop) ? ' NOT NULL' : ''}`;
        return columnDef;
    }).filter(col => col !== null);

    return `CREATE TABLE ${tableName} (\n  ${columns.join(',\n  ')}\n);`;
}

// $refを解決し、複数のSQL CREATE文を生成する関数
sqlSchema.jsonSchemasToCreateTables = function(jsonSchemas) {
    const schemaRegistry = {};
    const createStatements = [];

    // スキーマをレジストリに登録
    jsonSchemas.forEach(schemaText => {
        const schema = JSON.parse(schemaText.trim());
        schemaRegistry[schema.$id] = schema;
    });

    // スキーマを処理してSQL CREATE文を生成
    jsonSchemas.forEach(schemaText => {
        const schema = JSON.parse(schemaText.trim());
        const tableName = schema.$id.replace('.json', '');
        createStatements.push(jsonSchemaToCreateTable(JSON.stringify(schema), tableName, schemaRegistry));
    });

    return createStatements.join('\n\n');
};

module.exports = sqlSchema;

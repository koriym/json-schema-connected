const sqlSchema = {};

// スネークケースをキャメルケースに変換する関数
function snakeToCamel(snakeStr) {
    return snakeStr.replace(/(_\w)/g, matches => matches[1].toUpperCase());
}

// キャメルケースをスネークケースに変換する関数
function camelToSnake(camelStr) {
    return camelStr.replace(/([A-Z])/g, '_$1').toLowerCase();
}

// JSONスキーマからSQLのCREATE文を生成する関数
function jsonSchemaToCreateTable(jsonSchema, tableName, schemaRegistry) {
    const schema = JSON.parse(jsonSchema);
    const properties = schema.properties || {};
    const required = schema.required || [];

    const columns = Object.keys(properties).map(prop => {
        const columnName = camelToSnake(prop);
        let columnType;

        if (properties[prop].$ref) {
            const refSchemaId = properties[prop].$ref.replace('#', '').replace('/', '');
            const refSchema = schemaRegistry[refSchemaId];
            columnType = refSchema ? refSchema.type.toUpperCase() : "STRING";
        } else {
            columnType = properties[prop].type ? properties[prop].type.toUpperCase() : "STRING";
        }

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
            case "OBJECT":
                return null; // SQLでは直接的にサポートされないためスキップ
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

const fs = require('fs');
const path = require('path');

// 各ライブラリをインポート
const { convertJsonSchemasToArrayShapes } = require('../schema-array-shape');
const { jsonSchemaToCreateTable, convertJsonSchemasToCreateTables } = require('../schema-sql');
const { jsonSchemaToMarkdown, convertJsonSchemasToMarkdowns } = require('../schema-markdown');

// JSONスキーマを読み込む関数
function loadSchema(filename) {
    const filePath = path.join(__dirname, filename);
    const schemaContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(schemaContent);
}

// スキーマファイルを読み込む
const customerSchema = loadSchema('customer.json');
const addressSchema = loadSchema('address.json');

console.log("1. Array Shape Generation:");
const customerArrayShape = convertJsonSchemasToArrayShapes(customerSchema);
console.log(JSON.stringify(customerArrayShape, null, 2));

console.log("\n2. SQL Generation:");
// 単一のスキーマからSQLを生成
// const customerSql = jsonSchemaToCreateTable(customerSchema, 'customer');
// console.log(customerSql);

// 複数のスキーマからSQLを生成
const allSchemas = [customerSchema, addressSchema];
const allSchemasJson = JSON.stringify(allSchemas);
const allSchemasSql = convertJsonSchemasToCreateTables(allSchemasJson);
console.log(allSchemasSql);

console.log("\n3. Markdown Generation:");
// 単一のスキーマからMarkdownを生成
const customerMarkdown = jsonSchemaToMarkdown(customerSchema, __dirname);
console.log(customerMarkdown);

// 複数のスキーマからMarkdownを生成
const allSchemasMarkdown = convertJsonSchemasToMarkdowns(allSchemas, __dirname);
console.log(allSchemasMarkdown);

// 生成したMarkdownをファイルに保存
fs.writeFileSync('schemas.md', allSchemasMarkdown);
console.log("\nMarkdown has been saved to schemas.md");

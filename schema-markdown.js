const fs = require('fs');
const path = require('path');

// JSONスキーマをMarkdownに変換する関数
function jsonSchemaToMarkdown(schema, baseDir, parentSchemaId = null) {
    let md = `### Schema: ${schema.$id || 'Unknown'}\n\n`;

    if (schema.properties) {
        md += '#### Properties\n\n';
        md += '| Property | Type    | Description | Required | Constraints |\n';
        md += '|----------|---------|-------------|----------|-------------|\n';

        for (let [key, value] of Object.entries(schema.properties)) {
            if (value.$ref) {
                const refSchema = resolveRef(value.$ref, baseDir);
                const refSchemaId = value.$ref.replace('.json', '');
                const refMarkdown = jsonSchemaToMarkdown(refSchema, baseDir, refSchemaId);
                md += `| ${key} | [object](#embedded-${refSchemaId})  | Embedded: ${key} | No | |\n`;
                if (!parentSchemaId) {
                    md += `\n${refMarkdown.replace('### Schema:', '### Embedded: ')}\n`;
                }
            } else {
                const type = value.type || 'object';
                const description = value.description || '';
                const required = (schema.required && schema.required.includes(key)) ? 'Yes' : 'No';
                const constraints = getConstraints(value);
                md += `| ${key} | ${type} | ${description} | ${required} | ${constraints} |\n`;
            }
        }
    }

    return md;
}

// 制約を取得する関数
function getConstraints(property) {
    const constraints = [];
    if (property.minimum !== undefined) constraints.push(`min: ${property.minimum}`);
    if (property.maximum !== undefined) constraints.push(`max: ${property.maximum}`);
    if (property.minLength !== undefined) constraints.push(`minLength: ${property.minLength}`);
    if (property.maxLength !== undefined) constraints.push(`maxLength: ${property.maxLength}`);
    if (property.pattern !== undefined) constraints.push(`pattern: ${property.pattern}`);
    return constraints.join(', ');
}

// $refを解決する関数
function resolveRef(ref, baseDir) {
    const refPath = path.resolve(baseDir, ref);
    const refSchema = JSON.parse(fs.readFileSync(refPath, 'utf8'));
    return refSchema;
}

// グローバル変数として公開（ブラウザ環境）
if (typeof window !== 'undefined') {
    window.schemaMarkdown = {
        jsonSchemaToMarkdown,
        resolveRef
    };
}

// モジュールエクスポート（Node.js環境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        jsonSchemaToMarkdown,
        resolveRef
    };
}

function getConstraints(property) {
    const constraints = [];
    if (property.minimum !== undefined) constraints.push(`min: ${property.minimum}`);
    if (property.maximum !== undefined) constraints.push(`max: ${property.maximum}`);
    if (property.minLength !== undefined) constraints.push(`minLength: ${property.minLength}`);
    if (property.maxLength !== undefined) constraints.push(`maxLength: ${property.maxLength}`);
    if (property.pattern !== undefined) constraints.push(`pattern: ${property.pattern}`);
    if (property.format !== undefined) constraints.push(`format: ${property.format}`);
    return constraints.join(', ');
}

function resolveJsonSchemaRef(ref, baseDir) {
    const parts = ref.split('#');
    const id = parts[0];
    const path = parts[1] ? parts[1].split('/').slice(1) : [];

    if (!schemaRegistry[id]) {
        console.error(`Schema with id ${id} not found in registry`);
        return null;
    }

    let schema = schemaRegistry[id];
    for (let part of path) {
        if (!schema[part]) {
            console.error(`Property ${part} not found in schema ${id}`);
            return null;
        }
        schema = schema[part];
    }
    return schema;
}

function jsonSchemaToMarkdown(schema, baseDir, parentSchemaId = null, seenSchemas = new Set()) {
    const isEmbedded = !!parentSchemaId;
    const schemaId = schema.$id || 'Unknown';

    if (seenSchemas.has(schemaId)) {
        return ''; // 既に処理済みのスキーマはスキップ
    }
    seenSchemas.add(schemaId);

    let md = `### ${isEmbedded ? 'Embedded' : 'Schema'}: ${schemaId}\n\n`;

    if (schema.properties) {
        md += '#### Properties\n\n';
        md += '| Property | Type    | Description | Required | Constraints |\n';
        md += '|----------|---------|-------------|----------|-------------|\n';

        for (let [key, value] of Object.entries(schema.properties)) {
            if (value.$ref) {
                const refSchema = resolveJsonSchemaRef(value.$ref, baseDir);
                const refSchemaId = value.$ref.replace('.json', '');
                md += `| ${key} | [object](#embedded-${refSchemaId})  | Embedded: ${key} | No | |\n`;
                if (!isEmbedded) {
                    md += `\n${jsonSchemaToMarkdown(refSchema, baseDir, refSchemaId, seenSchemas)}\n`;
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

// グローバル変数として公開（ブラウザ環境）
if (typeof window !== 'undefined') {
    window.schemaMarkdown = {
        jsonSchemaToMarkdown
    };
}

// モジュールエクスポート（Node.js環境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        jsonSchemaToMarkdown
    };
}

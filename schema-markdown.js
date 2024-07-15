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

function jsonSchemaToMarkdown(schema, baseDir, isSubSchema = false, seenSchemas = new Set()) {
    const schemaId = schema.$id || 'Unknown';

    if (seenSchemas.has(schemaId)) {
        return ''; // 既に処理済みのスキーマはスキップ
    }
    seenSchemas.add(schemaId);

    let md = isSubSchema ? '' : `## ${schemaId.replace('.json', '')}\n\n`;

    if (schema.properties) {
        md += '| Property | Type    | Description | Required | Constraints |\n';
        md += '|----------|---------|-------------|----------|-------------|\n';

        for (let [key, value] of Object.entries(schema.properties)) {
            if (value.$ref) {
                const refSchemaId = value.$ref.replace('.json', '');
                md += `| ${key} | object | Embedded: [${refSchemaId}](#${refSchemaId}) | ${(schema.required && schema.required.includes(key)) ? 'Yes' : 'No'} | |\n`;
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

function generateFullMarkdown(schemas, baseDir) {
    let fullMd = '';
    const processedSchemas = new Set();

    for (const schema of schemas) {
        if (!processedSchemas.has(schema.$id)) {
            fullMd += jsonSchemaToMarkdown(schema, baseDir, false, processedSchemas);
            fullMd += '\n\n';
        }
    }

    return fullMd.trim();
}

// グローバル変数として公開（ブラウザ環境）
if (typeof window !== 'undefined') {
    window.schemaMarkdown = {
        jsonSchemaToMarkdown,
        generateFullMarkdown
    };
}

// モジュールエクスポート（Node.js環境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        jsonSchemaToMarkdown,
        generateFullMarkdown
    };
}

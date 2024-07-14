function generateArrayShapeString(schema) {
    let shape = {};

    if (schema.type) {
        if (schema.type === 'object' && schema.properties) {
            for (let key in schema.properties) {
                shape[key] = generateArrayShapeString(schema.properties[key]);
            }
        } else if (schema.type === 'array' && schema.items) {
            shape = 'array<' + generateArrayShapeString(schema.items) + '>';
        } else if (schema.type === 'string') {
            shape = 'string';
        } else if (schema.type === 'number' || schema.type === 'integer') {
            shape = 'int|float';
        } else if (schema.type === 'boolean') {
            shape = 'bool';
        } else if (schema.type === 'null') {
            shape = 'null';
        }
    }

    if (typeof shape === 'object') {
        let shapeString = 'array{';
        shapeString += Object.keys(shape).map(key => `${key}:${shape[key]}`).join(',');
        shapeString += '}';
        return shapeString;
    } else {
        return shape;
    }
}

function convertJsonSchema() {
    const jsonSchemaText = document.getElementById('jsonSchema').value;
    const jsonSchema = JSON.parse(jsonSchemaText);
    document.getElementById('result').textContent = generateArrayShapeString(jsonSchema);
}

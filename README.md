# json-schema-connected
[![Node.js CI](https://github.com/koriym/json-schema-connected/actions/workflows/nodejs.yml/badge.svg)](https://github.com/koriym/json-schema-to-array-shape/actions/workflows/nodejs.yml)

<img src="images/json-schema-connected.png" width="250px" alt="logo">

`json-schema-connected` is a JavaScript library for converting JSON Schemas to PHP array shapes and SQL CREATE statements. It helps in defining the structure and format of your JSON data and generating corresponding representations in PHP and SQL.

## Features

- Convert JSON Schemas to PHP array shapes.
- Convert JSON Schemas to SQL CREATE statements, including resolving `$ref` references.
- Supports nested schemas and references.

## Online Service

You can use the online version of this converter without installing anything on your local machine. Visit the following URL:

[JSON Schema to Array Shape Converter](https://koriym.github.io/json-schema-connected/)

## Installation

### Using CDN

You can include the library directly in your HTML via the following URL:

```html
<script src="https://koriym.github.io/json-schema-connected/array-shape.js"></script>
<script src="https://koriym.github.io/json-schema-connected/sql-schema.js"></script>
```

## Usage

### JSON Schema to PHP Array Shape and SQL CREATE Statements

Include the array-shape.js and sql-schema.js scripts and use the provided functions to convert JSON Schemas to PHP array shapes and SQL CREATE statements.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>JSON Schema to Array Shape Converter</title>
</head>
<body>
<textarea id="jsonSchemas" rows="10" cols="50">
{
  "$id": "person.json",
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "address": { "$ref": "address.json" }
  }
}
{
  "$id": "address.json",
  "type": "object",
  "properties": {
    "street": { "type": "string" },
    "city": { "type": "string" }
  }
}
</textarea>
<button onclick="convertJsonSchemasToArrayShapes()">Convert to Array Shape</button>
<button onclick="convertJsonSchemasToCreateTables()">Convert to SQL</button>
<pre id="result"></pre>

<script src="https://koriym.github.io/json-schema-to-array-shape/array-shape.js"></script>
<script src="https://koriym.github.io/json-schema-to-array-shape/sql-schema.js"></script>
<script>
    function convertJsonSchemasToArrayShapes() {
        const jsonSchemasText = document.getElementById('jsonSchemas').value;
        const arrayShapes = window.arrayShape.convertJsonSchemasToArrayShapes(jsonSchemasText);
        document.getElementById('result').textContent = arrayShapes.join('\n');
    }

    function convertJsonSchemasToCreateTables() {
        const jsonSchemasText = document.getElementById('jsonSchemas').value;
        const createTables = window.sqlSchema.convertJsonSchemasToCreateTables(jsonSchemasText);
        document.getElementById('result').textContent = createTables;
    }
</script>
</body>
</html>
```

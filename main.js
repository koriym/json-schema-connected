document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.getElementById('jsonSchemas');
    const convertArrayShapeBtn = document.getElementById('convertArrayShape');
    const convertSQLBtn = document.getElementById('convertSQL');
    const convertMarkdownBtn = document.getElementById('convertMarkdown');
    const exampleLink = document.getElementById('exampleLink');
    const option1Toggle = document.getElementById('option1Toggle');
    const option2Toggle = document.getElementById('option2Toggle');

    autoResize(textarea);
    textarea.addEventListener('input', () => autoResize(textarea));

    convertArrayShapeBtn.addEventListener('click', convertJsonSchemasToArrayShapes);
    convertSQLBtn.addEventListener('click', convertJsonSchemasToSQL);
    convertMarkdownBtn.addEventListener('click', convertJsonSchemasToMarkdown);
    exampleLink.addEventListener('click', (e) => {
        e.preventDefault();
        switchExample();
    });

    option1Toggle.addEventListener('click', () => toggleView('option1'));
    option2Toggle.addEventListener('click', () => toggleView('option2'));

    switchExample();
});

function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

const schemaRegistry = {};

function registerSchemas(schemas) {
    schemas.forEach(schema => {
        if (schema.$id) {
            schemaRegistry[schema.$id] = schema;
        } else {
            console.error('Schema missing $id:', schema);
        }
    });
}

async function loadAndRegisterSchemas(schemaTexts) {
    const schemas = schemaTexts.map(text => JSON.parse(text.trim()));
    registerSchemas(schemas);
    return schemas;
}

async function convertJsonSchemasToArrayShapes() {
    const jsonSchemasText = document.getElementById('jsonSchemas').value;
    const schemaTexts = extractJsonSchemas(jsonSchemasText);

    try {
        await loadAndRegisterSchemas(schemaTexts);
        const arrayShapes = window.arrayShape.convertJsonSchemasToArrayShapes(jsonSchemasText);
        const flatResult = arrayShapes.join('\n');
        const indentedResult = arrayShapes.map(shape => indentArrayShape(shape)).join('\n\n');

        document.getElementById('result').textContent = flatResult;
        document.getElementById('option2Content').innerHTML = `<pre>${indentedResult}</pre>`;

        showToggle('Flat', 'Indented');
        toggleView('option1');
    } catch (error) {
        console.error('Error converting schemas to array shapes:', error);
        showError('Failed to convert schemas to array shapes. Please check your input.');
    }
}

async function convertJsonSchemasToSQL() {
    const jsonSchemasText = document.getElementById('jsonSchemas').value;
    const schemaTexts = extractJsonSchemas(jsonSchemasText);

    try {
        await loadAndRegisterSchemas(schemaTexts);
        const createTableSQL = window.sqlSchema.convertJsonSchemasToCreateTables(jsonSchemasText);
        document.getElementById('result').textContent = createTableSQL + "\n\n -- Note: Adjust schema as needed for your specific requirements and database system.\n"
        hideToggle();
    } catch (error) {
        console.error('Error converting schemas to SQL:', error);
        showError('Failed to convert schemas to SQL. Please check your input.');
    }
}

async function convertJsonSchemasToMarkdown() {
    const jsonSchemasText = document.getElementById('jsonSchemas').value;
    const schemaTexts = extractJsonSchemas(jsonSchemasText);

    try {
        const schemas = await loadAndRegisterSchemas(schemaTexts);
        const baseDir = '';
        const rawMarkdown = schemas.map(schema => window.schemaMarkdown.jsonSchemaToMarkdown(schema, baseDir)).join('\n\n');

        document.getElementById('result').textContent = rawMarkdown;

        const renderedMarkdown = marked.parse(rawMarkdown);
        document.getElementById('option2Content').innerHTML = renderedMarkdown;

        showToggle('Raw', 'Preview', );
        toggleView('option2');
    } catch (error) {
        console.error('Error converting schemas to Markdown:', error);
        showError('Failed to convert schemas to Markdown. Please check your input.');
    }
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

function showToggle(option1, option2) {
    const toggleContainer = document.getElementById('toggleContainer');
    const option1Toggle = document.getElementById('option1Toggle');
    const option2Toggle = document.getElementById('option2Toggle');

    toggleContainer.classList.remove('hidden');
    option1Toggle.textContent = option1;
    option2Toggle.textContent = option2;

    option1Toggle.onclick = () => toggleView('option1');
    option2Toggle.onclick = () => toggleView('option2');
}

function hideToggle() {
    document.getElementById('toggleContainer').classList.add('hidden');
    document.getElementById('result').style.display = 'block';
    document.getElementById('option2Content').style.display = 'none';
}

function toggleView(option) {
    const result = document.getElementById('result');
    const option2Content = document.getElementById('option2Content');
    const option1Toggle = document.getElementById('option1Toggle');
    const option2Toggle = document.getElementById('option2Toggle');

    if (option === 'option1') {
        result.style.display = 'block';
        option2Content.style.display = 'none';
        option1Toggle.classList.add('active');
        option2Toggle.classList.remove('active');
    } else {
        result.style.display = 'none';
        option2Content.style.display = 'block';
        option1Toggle.classList.remove('active');
        option2Toggle.classList.add('active');
    }
}

function indentArrayShape(shape) {
    return shape.replace(/,/g, ',\n  ')
        .replace(/{/g, '{\n  ')
        .replace(/}/g, '\n}');
}

const examples = [
    'examples/simple_schema.json.txt',
    'examples/medium_schema.json.txt',
    'examples/complex_schema.json.txt',
    'examples/mini_amazon_ja.json.txt',
];
let currentExampleIndex = -1;

function switchExample() {
    document.getElementById('result').textContent = '';
    document.getElementById('option2Content').innerHTML = '';
    hideToggle();
    currentExampleIndex = (currentExampleIndex + 1) % examples.length;
    fetch(examples[currentExampleIndex])
        .then(response => response.text())
        .then(data => {
            document.getElementById('jsonSchemas').value = data;
            autoResize(document.getElementById('jsonSchemas'));
        })
        .catch(error => {
            console.error('Error loading example:', error);
            showError('Failed to load example. Please try again.');
        });
}

function showError(message) {
    const resultContainer = document.getElementById('resultContainer');
    resultContainer.innerHTML = `<div class="error-message">${message}</div>`;
}

const fs = require('fs');
const path = require('path');

const rawPath = path.join(__dirname, 'src', 'data', 'clientes_brutos.txt');
const outPath = path.join(__dirname, 'src', 'data', 'clientes.json');

const content = fs.readFileSync(rawPath, 'utf8');
const lines = content.split('\n');

const clientsMap = new Map();

lines.forEach(line => {
    // Skip empty lines or comments
    if (!line.trim() || line.startsWith('#')) return;

    // Split based on tabs since the pasted data is tab-separated: "ZHOU DINGXI    J400612543"
    const parts = line.split('\t');

    if (parts.length >= 2) {
        let name = parts[0].trim();
        let cedulaRaw = parts[1].trim();

        // Remove known exact patterns like "-001", "-002" etc from cedulas at the end
        cedulaRaw = cedulaRaw.replace(/-\d{3}$/, '');

        // If we haven't seen this stripped cedula, or we prefer not to overwrite with duplicates, store it.
        // The map key is the clean base cedula to avoid inserting G200005530-001 and G200005530 as separate
        if (!clientsMap.has(cedulaRaw)) {
            clientsMap.set(cedulaRaw, name);
        }
    }
});

const result = Array.from(clientsMap.entries()).map(([cedula, nombre]) => ({
    cedula,
    nombre
}));

fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
console.log(`Successfully parsed ${result.length} clients! Saved to ${outPath}`);

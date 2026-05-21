const fs = require('fs');
const readline = require('readline');

async function readLogs() {
    const filePath = 'C:\\\\Users\\\\user\\\\.gemini\\\\antigravity-ide\\\\brain\\\\794c3113-af34-4208-9164-5b2791cf2094\\\\.system_generated\\\\logs\\\\transcript.jsonl';
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let index = 0;
    for await (const line of rl) {
        index++;
        if (line.includes('generate_image') && (line.includes('tshirt') || line.includes('yoga'))) {
            console.log(`Line ${index}: ${line.substring(0, 1000)}...`);
        }
    }
}

readLogs().catch(console.error);

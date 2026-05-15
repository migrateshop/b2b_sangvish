const fs = require('fs');
const { translate } = require('@vitalets/google-translate-api');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');
const enFile = fs.readFileSync(path.join(localesDir, 'en.tsx'), 'utf8');

// Extract keys
const keyValRegex = /'([a-zA-Z0-9_]+)':\s*'((?:\\'|[^'])*)'/g;
let match;
const enDict = {};

while ((match = keyValRegex.exec(enFile)) !== null) {
    enDict[match[1]] = match[2];
}

const files = fs.readdirSync(localesDir);

// delay helper
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// retry helper
async function translateWithRetry(text, toLang, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await translate(text, { to: toLang });
            return res.text;
        } catch (err) {
            if (err.message.includes('Too Many Requests')) {
                console.log(`⏳ Rate limited. Retry ${i + 1}...`);
                await sleep(3000);
            } else {
                throw err;
            }
        }
    }
    return text; // fallback
}

(async () => {
    for (const file of files) {
        if (!file.endsWith('.tsx') || file === 'en.tsx') continue;

        const filePath = path.join(localesDir, file);
        let content = fs.readFileSync(filePath, 'utf8');

        const fileDict = {};
        keyValRegex.lastIndex = 0;

        while ((match = keyValRegex.exec(content)) !== null) {
            fileDict[match[1]] = match[2];
        }

        const missingKeys = Object.keys(enDict).filter(k => !(k in fileDict));

        if (missingKeys.length === 0) {
            console.log(`✅ ${file} already complete`);
            continue;
        }

        console.log(`🌐 Translating ${missingKeys.length} keys for ${file}...`);

        let toLang = file.replace('.tsx', '');

        if (toLang === 'zh') toLang = 'zh-cn';
        if (toLang === 'he') toLang = 'iw';

        const newEntries = [];
        const batchSize = 15;

        try {
            for (let i = 0; i < missingKeys.length; i += batchSize) {
                const batchKeys = missingKeys.slice(i, i + batchSize);

                console.log(`➡️ Batch ${i + 1} - ${i + batchKeys.length}`);

                for (const key of batchKeys) {
                    const originalText = enDict[key];

                    try {
                        let translatedText = await translateWithRetry(originalText, toLang);
                        translatedText = translatedText.replace(/'/g, "\\'");

                        newEntries.push(`    '${key}': '${translatedText}'`);
                        console.log(`✔ ${key}`);
                    } catch (err) {
                        console.error(`❌ Failed ${key}:`, err.message);
                        newEntries.push(`    '${key}': '${originalText}'`);
                    }

                    // small delay between each request
                    await sleep(800);
                }

                // delay between batches
                await sleep(3000);
            }

            // insert into file
            const lines = content.split('\n');

            let braceIndex = -1;
            for (let i = lines.length - 1; i >= 0; i--) {
                if (lines[i].includes('}')) {
                    braceIndex = i;
                    break;
                }
            }

            if (braceIndex !== -1) {
                if (
                    braceIndex > 0 &&
                    lines[braceIndex - 1].trim().length > 0 &&
                    !lines[braceIndex - 1].trim().endsWith(',')
                ) {
                    lines[braceIndex - 1] += ',';
                }

                lines.splice(braceIndex, 0, newEntries.join(',\n'));
                fs.writeFileSync(filePath, lines.join('\n'), 'utf8');

                console.log(`✅ Updated ${file}\n`);
            }

        } catch (err) {
            console.error(`❌ Error processing ${file}:`, err.message);
        }

        // delay between languages
        await sleep(5000);
    }

    console.log("🎉 All translations completed!");
})();
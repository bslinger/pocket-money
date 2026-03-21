/**
 * Converts raw V8 coverage snapshots collected during Playwright tests into
 * an Istanbul HTML report + JSON summary.
 *
 * Run after tests:  node --import tsx/esm tests/e2e/coverage-report.mts
 * Or via npm:       npm run coverage:e2e
 */

import v8ToIstanbul from 'v8-to-istanbul';
import libCoverage from 'istanbul-lib-coverage';
import libReport from 'istanbul-lib-report';
import reports from 'istanbul-reports';
import path from 'path';
import fs from 'fs';

const RAW_DIR    = path.join(process.cwd(), 'storage/coverage/e2e/raw');
const OUTPUT_DIR = path.join(process.cwd(), 'storage/coverage/e2e/html');
const SRC_ROOT   = path.join(process.cwd(), 'resources/js');

if (!fs.existsSync(RAW_DIR)) {
    console.error('No raw coverage directory found at', RAW_DIR);
    process.exit(1);
}

const files = fs.readdirSync(RAW_DIR).filter(f => f.endsWith('.json'));

if (files.length === 0) {
    console.error('No coverage snapshots found in', RAW_DIR);
    process.exit(1);
}

console.log(`Merging ${files.length} coverage snapshot(s)…`);

const map = libCoverage.createCoverageMap({});

for (const file of files) {
    const entries: any[] = JSON.parse(fs.readFileSync(path.join(RAW_DIR, file), 'utf-8'));

    for (const entry of entries) {
        // Only include source files from our JS source root
        const url = entry.url as string;
        if (!url.includes('/resources/js/') && !url.includes('/@fs/')) continue;

        // Resolve the source path from the Vite URL
        let sourcePath = url
            .replace(/^.*\/resources\/js\//, path.join(SRC_ROOT, '/'))
            .replace(/\?.*$/, '');  // strip query strings

        if (!fs.existsSync(sourcePath)) continue;

        try {
            const converter = v8ToIstanbul(sourcePath, 0, { source: fs.readFileSync(sourcePath, 'utf-8') });
            await converter.load();
            converter.applyCoverage(entry.functions);
            map.merge(converter.toIstanbul());
        } catch {
            // Skip files that can't be instrumented (e.g. node_modules chunks)
        }
    }
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const context = libReport.createContext({
    dir: OUTPUT_DIR,
    defaultSummarizer: 'nested',
    coverageMap: map,
});

(reports.create('html') as any).execute(context);
(reports.create('json-summary') as any).execute(context);
(reports.create('lcovonly') as any).execute(context);
(reports.create('text-summary') as any).execute(context);

console.log('Coverage report written to', OUTPUT_DIR);

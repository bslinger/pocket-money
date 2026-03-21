<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use SebastianBergmann\CodeCoverage\CodeCoverage;
use SebastianBergmann\CodeCoverage\Data\RawCodeCoverageData;
use SebastianBergmann\CodeCoverage\Driver\XdebugDriver;
use SebastianBergmann\CodeCoverage\Filter;
use SebastianBergmann\CodeCoverage\Report\Html\Facade as HtmlFacade;
use SebastianBergmann\CodeCoverage\Report\Clover;

class GenerateCoverage extends Command
{
    protected $signature   = 'coverage:generate
                                {--dir=coverage/e2e : Output directory relative to storage/ path}';
    protected $description = 'Merge per-request Xdebug coverage data from E2E runs into an HTML report';

    public function handle(): int
    {
        $rawDir = storage_path('coverage/raw');

        if (!is_dir($rawDir)) {
            $this->error('No raw coverage directory found at ' . $rawDir);
            return self::FAILURE;
        }

        $files = glob($rawDir . '/cov_*.php');

        if (empty($files)) {
            $this->error('No coverage files found in ' . $rawDir);
            return self::FAILURE;
        }

        $this->info('Merging ' . count($files) . ' coverage snapshot(s)…');

        // Merge all per-request coverage arrays into one
        $merged = [];

        foreach ($files as $file) {
            $data = unserialize((string) file_get_contents($file));

            if (!is_array($data)) {
                continue;
            }

            foreach ($data as $sourceFile => $lines) {
                if (!is_array($lines)) {
                    continue;
                }

                if (!isset($merged[$sourceFile])) {
                    $merged[$sourceFile] = $lines;
                } else {
                    foreach ($lines as $line => $status) {
                        // Keep the "most covered" status (1 > -1 > -2)
                        if (!array_key_exists($line, $merged[$sourceFile])
                            || $status > $merged[$sourceFile][$line]) {
                            $merged[$sourceFile][$line] = $status;
                        }
                    }
                }
            }
        }

        $filter = new Filter();
        $appFiles = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator(app_path(), \FilesystemIterator::SKIP_DOTS)
        );
        foreach ($appFiles as $file) {
            if ($file->getExtension() === 'php') {
                $filter->includeFile($file->getRealPath());
            }
        }

        $coverage = new CodeCoverage(new XdebugDriver($filter), $filter);
        $rawData  = RawCodeCoverageData::fromXdebugWithoutPathCoverage($merged);
        $coverage->append($rawData, 'e2e-suite');

        $outputDir  = storage_path($this->option('dir'));

        if (!is_dir($outputDir)) {
            mkdir($outputDir, 0755, true);
        }

        $this->info('Writing HTML report → ' . $outputDir);
        (new HtmlFacade())->process($coverage, $outputDir);

        $cloverPath = storage_path('coverage/e2e-clover.xml');
        $this->info('Writing Clover XML → ' . $cloverPath);
        (new Clover())->process($coverage, $cloverPath);

        $this->info('Done.');
        return self::SUCCESS;
    }
}

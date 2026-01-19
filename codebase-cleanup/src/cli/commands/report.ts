/**
 * Report Command
 * 
 * Generates a report from previously saved analysis results.
 */

import { Command } from 'commander';
import { resolve } from 'path';
import { readFile, writeFile } from 'fs/promises';
import { createReportGenerator } from '../../reporter/index.js';
import { handleError } from '../utils/error-handler.js';
import type { AnalysisResult, ClassifiedIssues, Issue } from '../../types.js';

interface ReportOptions {
  input: string;
  output?: string;
  format?: 'markdown' | 'json' | 'both';
}

export const reportCommand = new Command('report')
  .description('Generate a report from saved analysis results')
  .requiredOption('-i, --input <path>', 'Path to analysis results JSON file')
  .option('-o, --output <path>', 'Output file path (default: ./cleanup-report)')
  .option('-f, --format <format>', 'Output format: markdown, json, or both', 'markdown')
  .action(async (options: ReportOptions) => {
    try {
      console.log('📄 Generating report from analysis results...\n');

      // Resolve paths
      const inputPath = resolve(options.input);
      const outputPath = options.output ? resolve(options.output) : resolve('./cleanup-report');

      // Load analysis results
      console.log(`Loading analysis results from: ${inputPath}`);
      const fileContent = await readFile(inputPath, 'utf-8');
      const data = JSON.parse(fileContent);

      // Validate data structure
      if (!data.summary || !data.issues) {
        throw new Error('Invalid analysis results file. Expected JSON with "summary" and "issues" fields.');
      }

      // Reconstruct AnalysisResult and ClassifiedIssues
      const analysisResult: AnalysisResult = {
        totalFiles: data.summary.totalFiles || 0,
        analyzedFiles: data.summary.analyzedFiles || 0,
        totalIssues: data.summary.totalIssues || 0,
        issuesByType: new Map(),
        issuesByCategory: new Map(),
        issuesBySeverity: new Map(),
        analysisTimestamp: new Date(data.summary.analysisTimestamp || Date.now()),
        analysisDuration: data.summary.analysisDuration || 0,
      };

      const classified: ClassifiedIssues = {
        critical: data.issues.filter((i: Issue) => i.severity === 'critical'),
        high: data.issues.filter((i: Issue) => i.severity === 'high'),
        medium: data.issues.filter((i: Issue) => i.severity === 'medium'),
        low: data.issues.filter((i: Issue) => i.severity === 'low'),
        patterns: data.patterns || [],
      };

      // Generate report
      const reporter = createReportGenerator();
      const format = options.format || 'markdown';

      if (format === 'markdown' || format === 'both') {
        const markdownReport = reporter.generateMarkdownReport(analysisResult, classified);
        const mdPath = `${outputPath}.md`;
        await writeFile(mdPath, markdownReport, 'utf-8');
        console.log(`✅ Markdown report saved to: ${mdPath}`);
      }

      if (format === 'json' || format === 'both') {
        const jsonReport = reporter.generateJsonReport(analysisResult, classified);
        const jsonPath = `${outputPath}.json`;
        await writeFile(jsonPath, JSON.stringify(jsonReport, null, 2), 'utf-8');
        console.log(`✅ JSON report saved to: ${jsonPath}`);
      }

      console.log('\n✅ Report generation complete!\n');

    } catch (error) {
      handleError(error, 'report');
    }
  });

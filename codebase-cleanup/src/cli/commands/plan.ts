/**
 * Plan Command
 * 
 * Generates a cleanup plan from analysis results.
 */

import { Command } from 'commander';
import { resolve } from 'path';
import { readFile, writeFile } from 'fs/promises';
import { CleanupPlanner } from '../../planner/index.js';
import { handleError } from '../utils/error-handler.js';
import type { ClassifiedIssues, Issue, CleanupPlan, CleanupPhase, CleanupTask } from '../../types.js';

interface PlanOptions {
  input: string;
  output?: string;
  format?: 'markdown' | 'json' | 'both';
}

export const planCommand = new Command('plan')
  .description('Generate a cleanup plan from analysis results')
  .requiredOption('-i, --input <path>', 'Path to analysis results JSON file')
  .option('-o, --output <path>', 'Output file path (default: ./cleanup-plan)')
  .option('-f, --format <format>', 'Output format: markdown, json, or both', 'markdown')
  .action(async (options: PlanOptions) => {
    try {
      console.log('📋 Generating cleanup plan from analysis results...\n');

      // Resolve paths
      const inputPath = resolve(options.input);
      const outputPath = options.output ? resolve(options.output) : resolve('./cleanup-plan');

      // Load analysis results
      console.log(`Loading analysis results from: ${inputPath}`);
      const fileContent = await readFile(inputPath, 'utf-8');
      const data = JSON.parse(fileContent);

      // Validate data structure
      if (!data.issues) {
        throw new Error('Invalid analysis results file. Expected JSON with "issues" field.');
      }

      // Reconstruct ClassifiedIssues
      const classified: ClassifiedIssues = {
        critical: data.issues.filter((i: Issue) => i.severity === 'critical'),
        high: data.issues.filter((i: Issue) => i.severity === 'high'),
        medium: data.issues.filter((i: Issue) => i.severity === 'medium'),
        low: data.issues.filter((i: Issue) => i.severity === 'low'),
        patterns: data.patterns || [],
      };

      // Generate cleanup plan
      console.log('Generating cleanup plan...');
      const planner = new CleanupPlanner();
      const plan = planner.generatePlan(classified, classified.patterns);

      // Display summary
      console.log('\n📊 Cleanup Plan Summary:');
      console.log('─'.repeat(50));
      console.log(`Total Tasks: ${plan.tasks.length}`);
      console.log(`Phases: ${plan.phases.length}`);
      console.log(`Estimated Duration: ${plan.estimatedDuration}`);
      console.log(`Overall Risk: ${plan.riskAssessment.overallRisk}`);
      console.log('─'.repeat(50));

      // Generate output
      const format = options.format || 'markdown';

      if (format === 'markdown' || format === 'both') {
        const markdown = generateMarkdownPlan(plan);
        const mdPath = `${outputPath}.md`;
        await writeFile(mdPath, markdown, 'utf-8');
        console.log(`✅ Markdown plan saved to: ${mdPath}`);
      }

      if (format === 'json' || format === 'both') {
        const jsonPath = `${outputPath}.json`;
        await writeFile(jsonPath, JSON.stringify(plan, null, 2), 'utf-8');
        console.log(`✅ JSON plan saved to: ${jsonPath}`);
      }

      console.log('\n✅ Cleanup plan generation complete!\n');

    } catch (error) {
      handleError(error, 'plan');
    }
  });

/**
 * Generate markdown representation of cleanup plan
 */
function generateMarkdownPlan(plan: CleanupPlan): string {
  let markdown = '# Codebase Cleanup Plan\n\n';

  // Summary
  markdown += '## Summary\n\n';
  markdown += `- **Total Tasks**: ${plan.tasks.length}\n`;
  markdown += `- **Phases**: ${plan.phases.length}\n`;
  markdown += `- **Estimated Duration**: ${plan.estimatedDuration}\n`;
  markdown += `- **Overall Risk**: ${plan.riskAssessment.overallRisk}\n\n`;

  // Risk Assessment
  if (plan.riskAssessment.highRiskTasks.length > 0) {
    markdown += '## Risk Assessment\n\n';
    markdown += `**High Risk Tasks**: ${plan.riskAssessment.highRiskTasks.length}\n\n`;
    
    if (plan.riskAssessment.mitigationStrategies.length > 0) {
      markdown += '**Mitigation Strategies**:\n';
      plan.riskAssessment.mitigationStrategies.forEach((strategy: string) => {
        markdown += `- ${strategy}\n`;
      });
      markdown += '\n';
    }
  }

  // Phases
  markdown += '## Execution Phases\n\n';
  plan.phases.forEach((phase: CleanupPhase) => {
    markdown += `### Phase ${phase.phaseNumber}: ${phase.phaseName}\n\n`;
    markdown += `${phase.description}\n\n`;
    markdown += `**Tasks in this phase**: ${phase.tasks.length}\n\n`;

    phase.tasks.forEach((task: CleanupTask) => {
      markdown += `#### ${task.title}\n\n`;
      markdown += `- **ID**: ${task.id}\n`;
      markdown += `- **Category**: ${task.category}\n`;
      markdown += `- **Effort**: ${task.estimatedEffort}\n`;
      markdown += `- **Risk**: ${task.riskLevel}\n`;
      markdown += `- **Requires Tests**: ${task.requiresTests ? 'Yes' : 'No'}\n`;
      
      if (task.dependencies.length > 0) {
        markdown += `- **Dependencies**: ${task.dependencies.join(', ')}\n`;
      }
      
      markdown += `\n**Description**: ${task.description}\n\n`;
      
      if (task.actionSteps.length > 0) {
        markdown += '**Action Steps**:\n';
        task.actionSteps.forEach((step: string, index: number) => {
          markdown += `${index + 1}. ${step}\n`;
        });
        markdown += '\n';
      }
      
      if (task.affectedFiles.length > 0) {
        markdown += '**Affected Files**:\n';
        task.affectedFiles.slice(0, 10).forEach((file: string) => {
          markdown += `- ${file}\n`;
        });
        if (task.affectedFiles.length > 10) {
          markdown += `- ... and ${task.affectedFiles.length - 10} more files\n`;
        }
        markdown += '\n';
      }
      
      markdown += '---\n\n';
    });
  });

  return markdown;
}

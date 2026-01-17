/**
 * Unit Tests for Report Generator
 * 
 * Tests report generation functionality including:
 * - Markdown report generation
 * - JSON report generation
 * - Summary generation
 * - Formatting and structure
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createReportGenerator } from '../../src/reporter/report-generator';
import type {
  AnalysisResult,
  ClassifiedIssues,
  Issue,
  IssuePattern,
  Severity,
  IssueCategory,
  IssueType,
} from '../../src/types';

describe('ReportGenerator', () => {
  let mockAnalysisResult: AnalysisResult;
  let mockClassifiedIssues: ClassifiedIssues;


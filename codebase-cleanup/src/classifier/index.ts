/**
 * Issue Classifier Module
 * 
 * Exports issue classification functionality for categorizing,
 * prioritizing, and detecting patterns in detected issues.
 */

export {
  IssueClassifierImpl,
  createIssueClassifier,
  type PatternDetectionConfig,
} from './issue-classifier';

export type {
  IssueClassifier,
  ClassifiedIssues,
  IssuePattern,
} from '../types';

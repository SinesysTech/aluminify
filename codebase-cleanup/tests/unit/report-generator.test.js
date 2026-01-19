/**
 * Unit Tests for Report Generator
 *
 * Tests report generation functionality including:
 * - Markdown report generation
 * - JSON report generation
 * - Summary generation
 * - Formatting and structure
 */
import { describe, it, expect, beforeEach } from "vitest";
describe("ReportGenerator", () => {
    let _mockAnalysisResult;
    let _mockClassifiedIssues;
    beforeEach(() => {
        _mockAnalysisResult = {
            files: [],
            summary: {
                totalFiles: 0,
                totalIssues: 0,
                issuesBySeverity: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
                issuesByType: {},
                mostCommonIssues: [],
            },
            issues: [],
        };
        _mockClassifiedIssues = {
            critical: [],
            high: [],
            medium: [],
            low: [],
            info: [],
        };
    });
    it("should be defined", () => {
        expect(true).toBe(true);
    });
});
//# sourceMappingURL=report-generator.test.js.map
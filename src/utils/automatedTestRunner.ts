/**
 * Automated Test Runner for Cross-Device Testing
 * Provides utilities to run comprehensive tests automatically
 */

import { DeviceTestRunner } from "./deviceTesting";
import type { TestSuite, DeviceTestResult } from "./deviceTesting";

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  tests: string[];
  timeout: number;
}

export interface TestReport {
  scenario: TestScenario;
  results: TestSuite[];
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    averageScore: number;
    executionTime: number;
  };
  recommendations: string[];
}

export class AutomatedTestRunner {
  private testRunner: DeviceTestRunner;
  private scenarios: TestScenario[];

  constructor() {
    this.testRunner = new DeviceTestRunner();
    this.scenarios = this.getDefaultScenarios();
  }

  /**
   * Get default test scenarios
   */
  private getDefaultScenarios(): TestScenario[] {
    return [
      {
        id: "basic-compatibility",
        name: "Basic Compatibility",
        description: "Test basic device API compatibility",
        tests: ["camera", "microphone", "geolocation", "notifications"],
        timeout: 30000,
      },
      {
        id: "pwa-features",
        name: "PWA Features",
        description: "Test Progressive Web App capabilities",
        tests: ["serviceWorker", "manifest", "offline", "installation"],
        timeout: 45000,
      },
      {
        id: "performance-benchmark",
        name: "Performance Benchmark",
        description: "Test application performance metrics",
        tests: ["loadTime", "renderTime", "memoryUsage", "coreWebVitals"],
        timeout: 60000,
      },
      {
        id: "accessibility-compliance",
        name: "Accessibility Compliance",
        description: "Test accessibility features and compliance",
        tests: ["screenReader", "keyboard", "colorContrast", "focusManagement"],
        timeout: 30000,
      },
      {
        id: "comprehensive",
        name: "Comprehensive Test",
        description: "Run all available tests",
        tests: ["all"],
        timeout: 120000,
      },
    ];
  }

  /**
   * Run a specific test scenario
   */
  async runScenario(scenarioId: string): Promise<TestReport> {
    const scenario = this.scenarios.find((s) => s.id === scenarioId);
    if (!scenario) {
      throw new Error(`Scenario not found: ${scenarioId}`);
    }

    const startTime = performance.now();
    const results: TestSuite[] = [];
    const recommendations: string[] = [];

    try {
      // Run the appropriate tests based on scenario
      if (scenario.tests.includes("all") || scenario.id === "comprehensive") {
        const testSuite = await this.testRunner.runAllTests();
        results.push(testSuite);
      } else {
        // Run specific tests
        const testResults: DeviceTestResult[] = [];

        for (const testType of scenario.tests) {
          try {
            let result: DeviceTestResult | DeviceTestResult[];

            switch (testType) {
              case "camera":
                result = await this.testRunner.testCamera();
                testResults.push(result);
                break;
              case "microphone":
                result = await this.testRunner.testMicrophone();
                testResults.push(result);
                break;
              case "geolocation":
                result = await this.testRunner.testGeolocation();
                testResults.push(result);
                break;
              case "motionSensors":
                result = await this.testRunner.testMotionSensors();
                testResults.push(result);
                break;
              case "fileSystem":
                result = await this.testRunner.testFileSystem();
                testResults.push(result);
                break;
              case "notifications":
                result = await this.testRunner.testNotifications();
                testResults.push(result);
                break;
              case "pwa":
                result = await this.testRunner.testPWAFeatures();
                testResults.push(...result);
                break;
              case "accessibility":
                result = await this.testRunner.testAccessibility();
                testResults.push(...result);
                break;
              default:
                console.warn(`Unknown test type: ${testType}`);
            }
          } catch (error) {
            console.error(`Test failed: ${testType}`, error);
            testResults.push({
              feature: testType,
              supported: false,
              tested: true,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }

        // Create test suite from results
        const testSuite: TestSuite = {
          browser: this.testRunner.getBrowserInfo(),
          timestamp: new Date().toISOString(),
          results: testResults,
          overallScore: this.calculateScore(testResults),
        };

        results.push(testSuite);
      }

      // Generate recommendations based on results
      recommendations.push(...this.generateRecommendations(results));

      const executionTime = performance.now() - startTime;

      // Calculate summary
      const summary = this.calculateSummary(results, executionTime);

      return {
        scenario,
        results,
        summary,
        recommendations,
      };
    } catch (error) {
      throw new Error(
        `Scenario execution failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Run multiple scenarios in sequence
   */
  async runMultipleScenarios(scenarioIds: string[]): Promise<TestReport[]> {
    const reports: TestReport[] = [];

    for (const scenarioId of scenarioIds) {
      try {
        const report = await this.runScenario(scenarioId);
        reports.push(report);
      } catch (error) {
        console.error(`Failed to run scenario ${scenarioId}:`, error);
      }
    }

    return reports;
  }

  /**
   * Run all available scenarios
   */
  async runAllScenarios(): Promise<TestReport[]> {
    const scenarioIds = this.scenarios.map((s) => s.id);
    return this.runMultipleScenarios(scenarioIds);
  }

  /**
   * Calculate overall score from test results
   */
  private calculateScore(results: DeviceTestResult[]): number {
    if (results.length === 0) return 0;
    const supportedCount = results.filter((r) => r.supported).length;
    return Math.round((supportedCount / results.length) * 100);
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(results: TestSuite[], executionTime: number) {
    const totalTests = results.reduce(
      (sum, suite) => sum + suite.results.length,
      0
    );
    const passedTests = results.reduce(
      (sum, suite) => sum + suite.results.filter((r) => r.supported).length,
      0
    );
    const failedTests = totalTests - passedTests;
    const averageScore =
      results.length > 0
        ? Math.round(
            results.reduce((sum, suite) => sum + suite.overallScore, 0) /
              results.length
          )
        : 0;

    return {
      totalTests,
      passedTests,
      failedTests,
      averageScore,
      executionTime: Math.round(executionTime),
    };
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(results: TestSuite[]): string[] {
    const recommendations: string[] = [];
    const allResults = results.flatMap((suite) => suite.results);

    // Check for common issues and provide recommendations
    const failedFeatures = allResults.filter((r) => !r.supported);

    if (
      failedFeatures.some((f) => f.feature.toLowerCase().includes("camera"))
    ) {
      recommendations.push(
        "Camera access failed - ensure HTTPS is used and permissions are granted"
      );
    }

    if (
      failedFeatures.some((f) => f.feature.toLowerCase().includes("microphone"))
    ) {
      recommendations.push(
        "Microphone access failed - check browser permissions and HTTPS requirement"
      );
    }

    if (
      failedFeatures.some((f) => f.feature.toLowerCase().includes("location"))
    ) {
      recommendations.push(
        "Geolocation failed - verify location services are enabled and permissions granted"
      );
    }

    if (
      failedFeatures.some((f) =>
        f.feature.toLowerCase().includes("service worker")
      )
    ) {
      recommendations.push(
        "Service Worker not supported - consider providing fallback functionality"
      );
    }

    if (
      failedFeatures.some((f) =>
        f.feature.toLowerCase().includes("notification")
      )
    ) {
      recommendations.push(
        "Push notifications not supported - implement graceful degradation"
      );
    }

    // Performance recommendations
    const performanceResults = allResults.filter((r) => r.performance);
    const slowResults = performanceResults.filter(
      (r) => r.performance && r.performance > 1000
    );

    if (slowResults.length > 0) {
      recommendations.push(
        "Some operations are slow - consider optimizing performance"
      );
    }

    // Browser-specific recommendations
    const browserInfo = results[0]?.browser;
    if (browserInfo) {
      if (browserInfo.name === "Safari" && browserInfo.mobile) {
        recommendations.push(
          "iOS Safari detected - some features may require user interaction to work"
        );
      }

      if (browserInfo.name === "Firefox") {
        recommendations.push(
          "Firefox detected - ensure WebRTC features are properly implemented"
        );
      }
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push(
        "All tests passed successfully - great job on cross-device compatibility!"
      );
    }

    return recommendations;
  }

  /**
   * Export test report as JSON
   */
  exportReport(report: TestReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Export test report as markdown
   */
  exportReportAsMarkdown(report: TestReport): string {
    let markdown = `# ${report.scenario.name} Test Report\n\n`;
    markdown += `**Description:** ${report.scenario.description}\n`;
    markdown += `**Execution Time:** ${report.summary.executionTime}ms\n`;
    markdown += `**Overall Score:** ${report.summary.averageScore}%\n\n`;

    markdown += `## Summary\n\n`;
    markdown += `- **Total Tests:** ${report.summary.totalTests}\n`;
    markdown += `- **Passed:** ${report.summary.passedTests}\n`;
    markdown += `- **Failed:** ${report.summary.failedTests}\n\n`;

    markdown += `## Test Results\n\n`;
    for (const suite of report.results) {
      markdown += `### ${suite.browser.name} ${suite.browser.version}\n\n`;
      for (const result of suite.results) {
        const status = result.supported ? "✅" : "❌";
        markdown += `- ${status} **${result.feature}**`;
        if (result.performance) {
          markdown += ` (${result.performance.toFixed(2)}ms)`;
        }
        if (result.error) {
          markdown += ` - Error: ${result.error}`;
        }
        markdown += "\n";
      }
      markdown += "\n";
    }

    if (report.recommendations.length > 0) {
      markdown += `## Recommendations\n\n`;
      for (const recommendation of report.recommendations) {
        markdown += `- ${recommendation}\n`;
      }
    }

    return markdown;
  }

  /**
   * Get available scenarios
   */
  getScenarios(): TestScenario[] {
    return [...this.scenarios];
  }

  /**
   * Add custom scenario
   */
  addScenario(scenario: TestScenario): void {
    this.scenarios.push(scenario);
  }
}

/**
 * Utility function to run a quick compatibility check
 */
export async function runQuickCompatibilityCheck(): Promise<TestReport> {
  const runner = new AutomatedTestRunner();
  return runner.runScenario("basic-compatibility");
}

/**
 * Utility function to run comprehensive testing
 */
export async function runComprehensiveTest(): Promise<TestReport> {
  const runner = new AutomatedTestRunner();
  return runner.runScenario("comprehensive");
}

export default AutomatedTestRunner;

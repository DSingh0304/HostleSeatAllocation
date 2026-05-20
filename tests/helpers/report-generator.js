/**
 * Test Report Generator
 * 
 * Generates a human-readable HTML report from Vitest JSON output.
 * Run automatically with: npm run test:report
 */

const fs = require('fs');
const path = require('path');

const RESULTS_FILE = path.join(__dirname, '../reports/results.json');
const OUTPUT_FILE = path.join(__dirname, '../reports/test-report.html');

function generateReport() {
  if (!fs.existsSync(RESULTS_FILE)) {
    console.error('❌ Results file not found. Run tests with --reporter=json first.');
    process.exit(1);
  }

  const results = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));
  
  const totalTests = results.numTotalTests || 0;
  const passedTests = results.numPassedTests || 0;
  const failedTests = results.numFailedTests || 0;
  const skippedTests = results.numPendingTests || 0;
  const duration = results.testResults?.reduce((sum, r) => sum + (r.endTime - r.startTime), 0) || 0;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ResidentIQ Test Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
    }
    .header h1 {
      font-size: 32px;
      margin-bottom: 10px;
    }
    .header p {
      opacity: 0.9;
      font-size: 16px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 30px;
      background: #fafafa;
    }
    .stat {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .stat-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
    }
    .stat.passed .stat-value { color: #10b981; }
    .stat.failed .stat-value { color: #ef4444; }
    .stat.skipped .stat-value { color: #f59e0b; }
    .stat.total .stat-value { color: #3b82f6; }
    .content {
      padding: 30px;
    }
    .suite {
      margin-bottom: 30px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }
    .suite-header {
      background: #f9fafb;
      padding: 15px 20px;
      font-weight: 600;
      font-size: 18px;
      border-bottom: 1px solid #e5e7eb;
    }
    .test {
      padding: 12px 20px;
      border-bottom: 1px solid #f3f4f6;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .test:last-child {
      border-bottom: none;
    }
    .test-status {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .test-status.passed { background: #10b981; }
    .test-status.failed { background: #ef4444; }
    .test-status.skipped { background: #f59e0b; }
    .test-name {
      flex: 1;
      font-size: 14px;
    }
    .test-duration {
      color: #6b7280;
      font-size: 12px;
    }
    .footer {
      padding: 20px 30px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    .progress-bar {
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 20px;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981 0%, #059669 100%);
      transition: width 0.3s ease;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏠 ResidentIQ Test Report</h1>
      <p>Production-grade test suite for Hostel Seat Allocation System</p>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${(passedTests / totalTests * 100).toFixed(1)}%"></div>
      </div>
    </div>
    
    <div class="summary">
      <div class="stat total">
        <div class="stat-label">Total Tests</div>
        <div class="stat-value">${totalTests}</div>
      </div>
      <div class="stat passed">
        <div class="stat-label">Passed</div>
        <div class="stat-value">${passedTests}</div>
      </div>
      <div class="stat failed">
        <div class="stat-label">Failed</div>
        <div class="stat-value">${failedTests}</div>
      </div>
      <div class="stat skipped">
        <div class="stat-label">Skipped</div>
        <div class="stat-value">${skippedTests}</div>
      </div>
    </div>

    <div class="content">
      <h2 style="margin-bottom: 20px; color: #1f2937;">Test Suites</h2>
      ${generateSuiteHTML(results)}
    </div>

    <div class="footer">
      Generated on ${new Date().toLocaleString()} • Duration: ${(duration / 1000).toFixed(2)}s
    </div>
  </div>
</body>
</html>
  `;

  fs.writeFileSync(OUTPUT_FILE, html);
  console.log(`✅ Test report generated: ${OUTPUT_FILE}`);
}

function generateSuiteHTML(results) {
  if (!results.testResults || results.testResults.length === 0) {
    return '<p style="color: #6b7280;">No test results found.</p>';
  }

  return results.testResults.map(suite => {
    const suiteName = path.basename(suite.name, '.test.ts');
    const tests = suite.assertionResults || [];

    return `
      <div class="suite">
        <div class="suite-header">${suiteName}</div>
        ${tests.map(test => `
          <div class="test">
            <div class="test-status ${test.status}"></div>
            <div class="test-name">${test.title}</div>
            <div class="test-duration">${test.duration ? `${test.duration}ms` : ''}</div>
          </div>
        `).join('')}
      </div>
    `;
  }).join('');
}

try {
  generateReport();
} catch (error) {
  console.error('❌ Error generating report:', error.message);
  process.exit(1);
}

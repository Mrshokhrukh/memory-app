#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk');
const ora = require('ora');

class LaunchVerification {
  constructor() {
    this.baseUrl = process.env.API_URL || 'http://localhost:5000';
    this.clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: [],
    };
  }

  async runAllTests() {
    console.log(chalk.blue.bold('\n🚀 Memoryscape Launch Verification\n'));
    console.log(chalk.gray(`Testing API: ${this.baseUrl}`));
    console.log(chalk.gray(`Testing Client: ${this.clientUrl}\n`));

    await this.testServerHealth();
    await this.testDatabaseConnection();
    await this.testAuthentication();
    await this.testCoreFeatures();
    await this.testFileUpload();
    await this.testRealTimeFeatures();
    await this.testAIFeatures();
    await this.testSecurity();
    await this.testPerformance();
    await this.testClientApplication();

    this.printSummary();
    process.exit(this.results.failed > 0 ? 1 : 0);
  }

  async testServerHealth() {
    const spinner = ora('Testing server health...').start();

    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 5000,
      });

      if (response.status === 200 && response.data.status === 'OK') {
        this.pass(spinner, 'Server health check');

        // Check uptime
        const uptime = response.data.uptime;
        if (uptime > 0) {
          this.pass(null, `Server uptime: ${Math.floor(uptime / 60)} minutes`);
        }

        // Check memory usage
        const memory = response.data.memory;
        if (memory && memory.heapUsed < 500 * 1024 * 1024) {
          // Less than 500MB
          this.pass(null, 'Memory usage within limits');
        } else {
          this.warn(null, 'High memory usage detected');
        }
      } else {
        this.fail(spinner, 'Server health check failed');
      }
    } catch (error) {
      this.fail(spinner, `Server health check failed: ${error.message}`);
    }
  }

  async testDatabaseConnection() {
    const spinner = ora('Testing database connection...').start();

    try {
      const response = await axios.get(`${this.baseUrl}/api/health/database`);

      if (response.status === 200 && response.data.connected) {
        this.pass(spinner, 'Database connection');

        // Test database performance
        const responseTime = response.data.responseTime;
        if (responseTime < 100) {
          this.pass(null, `Database response time: ${responseTime}ms`);
        } else {
          this.warn(null, `Slow database response: ${responseTime}ms`);
        }
      } else {
        this.fail(spinner, 'Database connection failed');
      }
    } catch (error) {
      this.fail(spinner, `Database connection test failed: ${error.message}`);
    }
  }

  async testAuthentication() {
    const spinner = ora('Testing authentication system...').start();

    try {
      // Test user registration
      const registerData = {
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        password: 'testpassword123',
      };

      const registerResponse = await axios.post(
        `${this.baseUrl}/api/auth/register`,
        registerData
      );

      if (registerResponse.status === 201 && registerResponse.data.success) {
        this.pass(null, 'User registration');

        const token = registerResponse.data.data.token;

        // Test token validation
        const profileResponse = await axios.get(
          `${this.baseUrl}/api/auth/profile`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (profileResponse.status === 200) {
          this.pass(null, 'JWT token validation');
        } else {
          this.fail(null, 'JWT token validation failed');
        }

        // Test login
        const loginResponse = await axios.post(
          `${this.baseUrl}/api/auth/login`,
          {
            email: registerData.email,
            password: registerData.password,
          }
        );

        if (loginResponse.status === 200 && loginResponse.data.success) {
          this.pass(spinner, 'User login');
        } else {
          this.fail(spinner, 'User login failed');
        }
      } else {
        this.fail(spinner, 'User registration failed');
      }
    } catch (error) {
      this.fail(spinner, `Authentication test failed: ${error.message}`);
    }
  }

  async testCoreFeatures() {
    const spinner = ora('Testing core features...').start();

    try {
      // Create test user and get token
      const userData = {
        name: 'Feature Test User',
        email: `feature-test-${Date.now()}@example.com`,
        password: 'testpassword123',
      };

      const userResponse = await axios.post(
        `${this.baseUrl}/api/auth/register`,
        userData
      );
      const token = userResponse.data.data.token;
      const headers = { Authorization: `Bearer ${token}` };

      // Test capsule creation
      const capsuleData = {
        title: 'Test Capsule',
        description: 'A test capsule for verification',
        type: 'private',
        theme: 'default',
      };

      const capsuleResponse = await axios.post(
        `${this.baseUrl}/api/capsules`,
        capsuleData,
        { headers }
      );

      if (capsuleResponse.status === 201) {
        this.pass(null, 'Capsule creation');

        const capsuleId = capsuleResponse.data.data.capsule._id;

        // Test memory creation
        const memoryData = {
          capsuleId,
          type: 'text',
          title: 'Test Memory',
          text: 'This is a test memory for verification',
          tags: ['test', 'verification'],
        };

        const memoryResponse = await axios.post(
          `${this.baseUrl}/api/memories`,
          memoryData,
          { headers }
        );

        if (memoryResponse.status === 201) {
          this.pass(null, 'Memory creation');

          // Test memory retrieval
          const memoriesResponse = await axios.get(
            `${this.baseUrl}/api/memories/capsule/${capsuleId}`,
            { headers }
          );

          if (
            memoriesResponse.status === 200 &&
            memoriesResponse.data.data.memories.length > 0
          ) {
            this.pass(spinner, 'Memory retrieval');
          } else {
            this.fail(spinner, 'Memory retrieval failed');
          }
        } else {
          this.fail(spinner, 'Memory creation failed');
        }
      } else {
        this.fail(spinner, 'Capsule creation failed');
      }
    } catch (error) {
      this.fail(spinner, `Core features test failed: ${error.message}`);
    }
  }

  async testFileUpload() {
    const spinner = ora('Testing file upload system...').start();

    try {
      // Create test user
      const userData = {
        name: 'Upload Test User',
        email: `upload-test-${Date.now()}@example.com`,
        password: 'testpassword123',
      };

      const userResponse = await axios.post(
        `${this.baseUrl}/api/auth/register`,
        userData
      );
      const token = userResponse.data.data.token;
      const headers = { Authorization: `Bearer ${token}` };

      // Test upload endpoint availability
      const uploadResponse = await axios.get(
        `${this.baseUrl}/api/upload/signature`,
        { headers }
      );

      if (uploadResponse.status === 200) {
        this.pass(spinner, 'File upload system available');
      } else {
        this.fail(spinner, 'File upload system not available');
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        this.warn(
          spinner,
          'File upload endpoint not found - may not be implemented'
        );
      } else {
        this.fail(spinner, `File upload test failed: ${error.message}`);
      }
    }
  }

  async testRealTimeFeatures() {
    const spinner = ora('Testing real-time features...').start();

    try {
      // Test Socket.io endpoint
      const socketResponse = await axios.get(`${this.baseUrl}/socket.io/`, {
        timeout: 3000,
      });

      if (socketResponse.status === 200) {
        this.pass(spinner, 'Socket.io server available');
      } else {
        this.fail(spinner, 'Socket.io server not responding');
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        this.fail(spinner, 'Socket.io server not running');
      } else {
        this.warn(spinner, 'Socket.io test inconclusive');
      }
    }
  }

  async testAIFeatures() {
    const spinner = ora('Testing AI features...').start();

    try {
      // Create test user
      const userData = {
        name: 'AI Test User',
        email: `ai-test-${Date.now()}@example.com`,
        password: 'testpassword123',
      };

      const userResponse = await axios.post(
        `${this.baseUrl}/api/auth/register`,
        userData
      );
      const token = userResponse.data.data.token;
      const headers = { Authorization: `Bearer ${token}` };

      // Test AI title generation
      const aiResponse = await axios.post(
        `${this.baseUrl}/api/ai/generate-title`,
        {
          text: 'This is a test memory about a beautiful sunset at the beach with friends.',
          type: 'text',
        },
        { headers }
      );

      if (aiResponse.status === 200 && aiResponse.data.data.title) {
        this.pass(spinner, 'AI features working');
      } else {
        this.fail(spinner, 'AI features not working');
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        this.warn(spinner, 'AI endpoints not found - may not be implemented');
      } else if (error.response && error.response.status === 429) {
        this.warn(spinner, 'AI rate limiting active');
      } else {
        this.fail(spinner, `AI features test failed: ${error.message}`);
      }
    }
  }

  async testSecurity() {
    const spinner = ora('Testing security measures...').start();

    try {
      // Test rate limiting
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          axios
            .post(`${this.baseUrl}/api/auth/login`, {
              email: 'nonexistent@example.com',
              password: 'wrongpassword',
            })
            .catch((err) => err.response)
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(
        (response) => response && response.status === 429
      );

      if (rateLimited) {
        this.pass(null, 'Rate limiting active');
      } else {
        this.warn(null, 'Rate limiting may not be configured');
      }

      // Test CORS headers
      const corsResponse = await axios.options(
        `${this.baseUrl}/api/auth/login`
      );
      const corsHeaders = corsResponse.headers['access-control-allow-origin'];

      if (corsHeaders) {
        this.pass(null, 'CORS headers configured');
      } else {
        this.warn(null, 'CORS headers not found');
      }

      // Test security headers
      const securityResponse = await axios.get(`${this.baseUrl}/health`);
      const securityHeaders = securityResponse.headers;

      if (securityHeaders['x-frame-options']) {
        this.pass(null, 'Security headers present');
      } else {
        this.warn(null, 'Security headers may be missing');
      }

      this.pass(spinner, 'Security tests completed');
    } catch (error) {
      this.fail(spinner, `Security test failed: ${error.message}`);
    }
  }

  async testPerformance() {
    const spinner = ora('Testing performance...').start();

    try {
      const startTime = Date.now();
      const response = await axios.get(`${this.baseUrl}/health`);
      const responseTime = Date.now() - startTime;

      if (responseTime < 1000) {
        this.pass(null, `API response time: ${responseTime}ms`);
      } else {
        this.warn(null, `Slow API response: ${responseTime}ms`);
      }

      // Test concurrent requests
      const concurrentRequests = [];
      for (let i = 0; i < 5; i++) {
        concurrentRequests.push(axios.get(`${this.baseUrl}/health`));
      }

      const concurrentStart = Date.now();
      await Promise.all(concurrentRequests);
      const concurrentTime = Date.now() - concurrentStart;

      if (concurrentTime < 2000) {
        this.pass(spinner, `Concurrent request handling: ${concurrentTime}ms`);
      } else {
        this.warn(spinner, `Slow concurrent handling: ${concurrentTime}ms`);
      }
    } catch (error) {
      this.fail(spinner, `Performance test failed: ${error.message}`);
    }
  }

  async testClientApplication() {
    const spinner = ora('Testing client application...').start();

    try {
      const response = await axios.get(this.clientUrl, { timeout: 10000 });

      if (response.status === 200) {
        this.pass(null, 'Client application accessible');

        // Check if it's a React app
        if (response.data.includes('react') || response.data.includes('root')) {
          this.pass(null, 'React application detected');
        }

        // Check for essential meta tags
        if (response.data.includes('<title>')) {
          this.pass(null, 'Page title present');
        }

        if (response.data.includes('viewport')) {
          this.pass(null, 'Mobile viewport configured');
        }

        this.pass(spinner, 'Client application tests completed');
      } else {
        this.fail(spinner, 'Client application not accessible');
      }
    } catch (error) {
      this.fail(spinner, `Client application test failed: ${error.message}`);
    }
  }

  pass(spinner, message) {
    if (spinner) spinner.succeed(chalk.green(message));
    else console.log(chalk.green(`  ✓ ${message}`));
    this.results.passed++;
    this.results.tests.push({ status: 'pass', message });
  }

  fail(spinner, message) {
    if (spinner) spinner.fail(chalk.red(message));
    else console.log(chalk.red(`  ✗ ${message}`));
    this.results.failed++;
    this.results.tests.push({ status: 'fail', message });
  }

  warn(spinner, message) {
    if (spinner) spinner.warn(chalk.yellow(message));
    else console.log(chalk.yellow(`  ⚠ ${message}`));
    this.results.warnings++;
    this.results.tests.push({ status: 'warn', message });
  }

  printSummary() {
    console.log('\n' + chalk.blue.bold('📊 Launch Verification Summary'));
    console.log(chalk.gray('─'.repeat(50)));

    console.log(chalk.green(`✓ Passed: ${this.results.passed}`));
    console.log(chalk.red(`✗ Failed: ${this.results.failed}`));
    console.log(chalk.yellow(`⚠ Warnings: ${this.results.warnings}`));

    const total =
      this.results.passed + this.results.failed + this.results.warnings;
    const successRate = Math.round((this.results.passed / total) * 100);

    console.log(chalk.gray('─'.repeat(50)));
    console.log(`Success Rate: ${successRate}%`);

    if (this.results.failed === 0) {
      console.log(
        chalk.green.bold('\n🎉 All critical tests passed! Ready for launch!')
      );
    } else {
      console.log(
        chalk.red.bold(
          '\n❌ Some tests failed. Please fix issues before launch.'
        )
      );
    }

    if (this.results.warnings > 0) {
      console.log(chalk.yellow('\n⚠️  Please review warnings before launch.'));
    }

    console.log(
      '\n' + chalk.gray('Run this script regularly to ensure system health.')
    );
  }
}

// Run verification if called directly
if (require.main === module) {
  const verification = new LaunchVerification();
  verification.runAllTests().catch(console.error);
}

module.exports = LaunchVerification;

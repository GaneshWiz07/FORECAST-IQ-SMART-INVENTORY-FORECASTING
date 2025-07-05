import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Prophet Forecasting Service
 * Interfaces with Python Prophet for accurate time series forecasting
 */
class ProphetService {
  constructor() {
    this.pythonScriptPath = path.join(__dirname, 'prophet_forecast.py');
    this.timeout = 30000; // 30 seconds timeout
  }

  /**
   * Generate forecast using Facebook Prophet
   * @param {Array} salesData - Array of sales data objects with date and units_sold
   * @param {number} forecastDays - Number of days to forecast
   * @param {boolean} includeHistory - Whether to include historical data in response
   * @returns {Promise<Object>} Forecast result
   */
  async generateForecast(salesData, forecastDays = 30, includeHistory = false) {
    return new Promise((resolve, reject) => {
      try {
        // Prepare input data
        const inputData = {
          sales_data: salesData,
          forecast_days: forecastDays,
          include_history: includeHistory
        };

        // Try different Python commands
        const pythonCommands = ['python3', 'python'];
        let pythonProcess;
        
        for (const pythonCmd of pythonCommands) {
          try {
            pythonProcess = spawn(pythonCmd, [this.pythonScriptPath, JSON.stringify(inputData)], {
              stdio: ['pipe', 'pipe', 'pipe'],
              timeout: this.timeout
            });
            break;
          } catch (error) {
            if (pythonCmd === pythonCommands[pythonCommands.length - 1]) {
              throw new Error(`No Python interpreter found. Tried: ${pythonCommands.join(', ')}`);
            }
          }
        }

        let stdout = '';
        let stderr = '';

        // Collect stdout
        pythonProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        // Collect stderr
        pythonProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        // Handle process completion
        pythonProcess.on('close', (code) => {
          if (code === 0) {
            try {
              const result = JSON.parse(stdout);
              resolve(result);
            } catch (parseError) {
              reject(new Error(`Failed to parse Prophet output: ${parseError.message}`));
            }
          } else {
            reject(new Error(`Prophet process failed with code ${code}: ${stderr}`));
          }
        });

        // Handle process error
        pythonProcess.on('error', (error) => {
          reject(new Error(`Failed to start Prophet process: ${error.message}`));
        });

        // Handle timeout
        setTimeout(() => {
          pythonProcess.kill('SIGTERM');
          reject(new Error('Prophet process timed out'));
        }, this.timeout);

      } catch (error) {
        reject(new Error(`Prophet service error: ${error.message}`));
      }
    });
  }

  /**
   * Check if Prophet is available
   * @returns {Promise<boolean>} True if Prophet is available
   */
  async isAvailable() {
    try {
      const result = await this.generateForecast([
        { date: '2024-01-01', units_sold: 10 },
        { date: '2024-01-02', units_sold: 12 }
      ], 1);
      return result.success === true;
    } catch (error) {
      console.log('Prophet not available:', error.message);
      return false;
    }
  }

  /**
   * Get Prophet model information
   * @returns {Object} Model information
   */
  getModelInfo() {
    return {
      name: 'Facebook Prophet',
      version: '1.1.5',
      description: 'Advanced time series forecasting with automatic seasonality detection',
      features: [
        'Automatic seasonality detection (daily, weekly, yearly)',
        'Holiday effects modeling',
        'Trend changepoint detection',
        'Uncertainty intervals',
        'Robust to missing data and outliers'
      ],
      parameters: {
        seasonality_mode: 'additive',
        growth: 'linear',
        changepoint_prior_scale: 0.05,
        seasonality_prior_scale: 10.0,
        interval_width: 0.8
      }
    };
  }
}

export default new ProphetService(); 
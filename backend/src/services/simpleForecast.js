/**
 * Simple Forecasting Service
 * Fallback forecasting when Prophet is not available
 * Uses moving averages and trend analysis
 */

class SimpleForecastService {
  /**
   * Generate simple forecast using moving averages and trend analysis
   * @param {Array} salesData - Array of sales data objects with date and units_sold
   * @param {number} forecastDays - Number of days to forecast
   * @returns {Object} Forecast result
   */
  generateForecast(salesData, forecastDays = 30) {
    try {
      if (!salesData || salesData.length < 2) {
        throw new Error('Need at least 2 data points for forecasting');
      }

      // Sort data by date
      const sortedData = salesData
        .map(item => ({
          date: new Date(item.date),
          value: parseFloat(item.units_sold) || 0
        }))
        .sort((a, b) => a.date - b.date);

      // Calculate moving averages and trend
      const forecast = this.calculateTrendForecast(sortedData, forecastDays);

      return {
        success: true,
        forecast: forecast,
        model_info: {
          method: 'Simple Trend Analysis',
          data_points: sortedData.length,
          forecast_days: forecastDays,
          description: 'Moving average with linear trend extrapolation'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        fallback_needed: false
      };
    }
  }

  /**
   * Calculate trend-based forecast
   * @param {Array} data - Sorted time series data
   * @param {number} days - Number of days to forecast
   * @returns {Array} Forecast data
   */
  calculateTrendForecast(data, days) {
    const values = data.map(d => d.value);
    const n = values.length;

    // Calculate moving average (last 7 days or all data if less)
    const windowSize = Math.min(7, n);
    const recentValues = values.slice(-windowSize);
    const movingAverage = recentValues.reduce((sum, val) => sum + val, 0) / windowSize;

    // Calculate linear trend
    const trend = this.calculateLinearTrend(values);

    // Generate forecast
    const lastDate = data[data.length - 1].date;
    const forecast = [];

    for (let i = 1; i <= days; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(forecastDate.getDate() + i);

      // Simple trend projection
      const trendValue = movingAverage + (trend * i);
      const predicted = Math.max(0, trendValue);

      // Add some uncertainty bounds (±20%)
      const uncertainty = predicted * 0.2;

      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        predicted_demand: Math.round(predicted * 100) / 100,
        lower_bound: Math.round((predicted - uncertainty) * 100) / 100,
        upper_bound: Math.round((predicted + uncertainty) * 100) / 100,
        confidence_score: 0.6 // Lower confidence than Prophet
      });
    }

    return forecast;
  }

  /**
   * Calculate linear trend from time series data
   * @param {Array} values - Array of numeric values
   * @returns {number} Trend slope
   */
  calculateLinearTrend(values) {
    const n = values.length;
    if (n < 2) return 0;

    const x = Array.from({length: n}, (_, i) => i);
    const y = values;

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    // Linear regression slope
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return isNaN(slope) ? 0 : slope;
  }

  /**
   * Check if service is available (always true for simple forecast)
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    return true;
  }

  /**
   * Get model information
   * @returns {Object}
   */
  getModelInfo() {
    return {
      name: 'Simple Trend Forecast',
      version: '1.0.0',
      description: 'Basic forecasting using moving averages and linear trend analysis',
      features: [
        'Moving average calculation',
        'Linear trend extrapolation',
        'Basic uncertainty intervals',
        'No external dependencies'
      ],
      limitations: [
        'No seasonality detection',
        'Limited accuracy for complex patterns',
        'Simple uncertainty estimation'
      ]
    };
  }
}

export default new SimpleForecastService(); 
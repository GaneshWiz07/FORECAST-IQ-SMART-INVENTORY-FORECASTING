#!/usr/bin/env python3
"""
Facebook Prophet Forecasting Service
Provides accurate time series forecasting for inventory management
"""

import sys
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

try:
    from prophet import Prophet
    from prophet.serialize import model_to_json, model_from_json
except ImportError:
    print(json.dumps({
        "error": "Prophet not installed. Install with: pip install prophet",
        "success": False
    }))
    sys.exit(1)

def prepare_prophet_data(sales_data):
    """
    Convert sales data to Prophet format
    Prophet expects columns: ds (date), y (value)
    """
    try:
        # Create DataFrame from sales data
        df = pd.DataFrame(sales_data)
        
        # Ensure we have the required columns
        if 'date' not in df.columns or 'units_sold' not in df.columns:
            raise ValueError("Sales data must contain 'date' and 'units_sold' columns")
        
        # Convert to Prophet format
        prophet_df = pd.DataFrame({
            'ds': pd.to_datetime(df['date']),
            'y': df['units_sold'].astype(float)
        })
        
        # Sort by date
        prophet_df = prophet_df.sort_values('ds').reset_index(drop=True)
        
        # Remove duplicates (keep last value for each date)
        prophet_df = prophet_df.drop_duplicates(subset=['ds'], keep='last')
        
        return prophet_df
    except Exception as e:
        raise ValueError(f"Error preparing Prophet data: {str(e)}")

def create_prophet_model(seasonality_mode='additive', growth='linear'):
    """
    Create and configure Prophet model
    """
    model = Prophet(
        growth=growth,
        seasonality_mode=seasonality_mode,
        yearly_seasonality=True,
        weekly_seasonality=True,
        daily_seasonality=False,
        changepoint_prior_scale=0.05,
        seasonality_prior_scale=10.0,
        holidays_prior_scale=10.0,
        mcmc_samples=0,
        interval_width=0.8,
        uncertainty_samples=1000
    )
    
    return model

def generate_forecast(sales_data, forecast_days=30, include_history=False):
    """
    Generate forecast using Prophet
    """
    try:
        # Prepare data
        df = prepare_prophet_data(sales_data)
        
        if len(df) < 2:
            raise ValueError("Need at least 2 data points for forecasting")
        
        # Create and fit model
        model = create_prophet_model()
        model.fit(df)
        
        # Create future dataframe
        future = model.make_future_dataframe(periods=forecast_days)
        
        # Generate forecast
        forecast = model.predict(future)
        
        # Extract forecast data
        if include_history:
            result_df = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].copy()
        else:
            # Only return future predictions
            result_df = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(forecast_days).copy()
        
        # Ensure non-negative predictions
        result_df['yhat'] = np.maximum(0, result_df['yhat'])
        result_df['yhat_lower'] = np.maximum(0, result_df['yhat_lower'])
        result_df['yhat_upper'] = np.maximum(0, result_df['yhat_upper'])
        
        # Convert to list of dictionaries
        forecast_data = []
        for _, row in result_df.iterrows():
            forecast_data.append({
                'date': row['ds'].strftime('%Y-%m-%d'),
                'predicted_demand': round(row['yhat'], 2),
                'lower_bound': round(row['yhat_lower'], 2),
                'upper_bound': round(row['yhat_upper'], 2),
                'confidence_score': 0.8  # Prophet's default interval width
            })
        
        # Calculate model performance metrics
        historical_forecast = forecast[forecast['ds'].isin(df['ds'])]
        mae = np.mean(np.abs(historical_forecast['yhat'] - df['y']))
        mape = np.mean(np.abs((historical_forecast['yhat'] - df['y']) / df['y'])) * 100
        
        return {
            'success': True,
            'forecast': forecast_data,
            'model_info': {
                'method': 'Facebook Prophet',
                'data_points': len(df),
                'forecast_days': forecast_days,
                'mae': round(mae, 2),
                'mape': round(mape, 2),
                'seasonality_mode': 'additive',
                'growth': 'linear'
            }
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'fallback_needed': True
        }

def main():
    """
    Main function to handle command line arguments or stdin
    """
    try:
        # Try to read from command line arguments first
        if len(sys.argv) >= 2:
            input_data = json.loads(sys.argv[1])
        else:
            # Read from stdin if no command line arguments
            try:
                input_json = sys.stdin.read().strip()
                if not input_json:
                    print(json.dumps({
                        "error": "No input provided. Usage: python prophet_forecast.py '<json_data>'",
                        "success": False
                    }))
                    sys.exit(1)
                input_data = json.loads(input_json)
            except:
                print(json.dumps({
                    "error": "Usage: python prophet_forecast.py '<json_data>'",
                    "success": False
                }))
                sys.exit(1)
        
        # Extract parameters
        sales_data = input_data.get('sales_data', [])
        forecast_days = input_data.get('forecast_days', 30)
        include_history = input_data.get('include_history', False)
        
        # Validate input
        if not sales_data:
            print(json.dumps({
                "error": "No sales data provided",
                "success": False
            }))
            sys.exit(1)
        
        # Generate forecast
        result = generate_forecast(sales_data, forecast_days, include_history)
        
        # Output result as JSON
        print(json.dumps(result, indent=2))
        
    except json.JSONDecodeError as e:
        print(json.dumps({
            "error": f"Invalid JSON input: {str(e)}",
            "success": False
        }))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({
            "error": f"Unexpected error: {str(e)}",
            "success": False,
            "fallback_needed": True
        }))
        sys.exit(1)

if __name__ == "__main__":
    main() 
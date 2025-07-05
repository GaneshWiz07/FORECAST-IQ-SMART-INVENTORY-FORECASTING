# ForecastIQ - Smart Inventory Forecasting
**LIVE SITE**-[https://forecast-iq.onrender.com/](https://forecast-iq.onrender.com/)
<div align="center">
  <h3>📊 Statistical Inventory Management & Demand Forecasting</h3>
  <p>Enterprise-grade inventory forecasting system powered by advanced statistical algorithms and mathematical forecasting methods.</p>
</div>

## 🚀 Features

### 🔮 Advanced Forecasting
- **Multiple Statistical Methods** - Linear regression, exponential smoothing, seasonal naive
- **Combined Algorithm Approach** - Ensemble forecasting for improved accuracy
- **Automatic Seasonality Detection** - Daily, weekly, and yearly patterns
- **Uncertainty Intervals** - Confidence scores and prediction ranges
- **Smart Analytics** - Advanced statistical analysis and trend detection

### 📊 Real-Time Analytics
- **Dynamic Dashboard** - Live inventory metrics and trends
- **Forecast Accuracy Tracking** - Real-time model performance monitoring
- **Demand Trend Analysis** - Historical vs predicted demand insights
- **Interactive Charts** - Visual data exploration and analysis

### 🔐 Enterprise Security
- **Multi-Tenant Architecture** - Complete user data isolation
- **Row Level Security (RLS)** - Database-level security policies
- **Clerk Authentication** - Enterprise-grade user management
- **Secure API Endpoints** - JWT token-based authentication

### 📈 Inventory Management
- **Real-Time Stock Tracking** - Current inventory levels and status
- **Low Stock Alerts** - Automated reorder point notifications
- **Sales Data Integration** - CSV upload and processing
- **Historical Analysis** - Trend identification and pattern recognition

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **Statistical Algorithms** with simple-statistics
- **PostgreSQL** (Supabase)
- **JWT Authentication**

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **Clerk** for authentication
- **Recharts** for data visualization

### Deployment
- **Render** for hosting
- **Supabase** for database
- **Environment-based configuration**

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (or Supabase account)
- Clerk account for authentication

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd FORECAST-IQ-SMART-INVENTORY-FORECASTING
```

### 2. Backend Setup
```bash
cd backend
npm install
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

### 4. Environment Configuration

#### Backend (.env)
```env
# Database
DATABASE_URL=your_postgresql_connection_string
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Authentication
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Server
PORT=5000
NODE_ENV=production
```

#### Frontend (.env)
```env
VITE_API_URL=your_backend_api_url
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

### 5. Database Setup
```bash
# Run the database schema
psql -d your_database < backend/database-schema.sql
```

### 6. Start Development
```bash
# Backend
cd backend && npm run dev

# Frontend (new terminal)
cd frontend && npm run dev
```

## 🌐 Deployment on Render

### Backend Deployment
1. Create a new **Web Service** on Render
2. Connect your repository
3. Set build command: `cd backend && npm install`
4. Set start command: `cd backend && npm start`
5. Add environment variables from your `.env` file

### Frontend Deployment
1. Create a new **Static Site** on Render
2. Set build command: `cd frontend && npm install && npm run build`
3. Set publish directory: `frontend/dist`
4. Add environment variables from your `.env` file

### Database Setup
1. Use Supabase for managed PostgreSQL
2. Import the schema from `backend/database-schema.sql`
3. Configure Row Level Security policies
4. Update `DATABASE_URL` in your backend environment

## 📁 Project Structure

```
ForecastIQ/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── middleware/     # Authentication middleware
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic & statistical services
│   │   └── server.js       # Express server
│   ├── database-schema.sql # Database schema with RLS
│   └── package.json        # Node.js dependencies
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React context providers
│   │   ├── pages/          # Application pages
│   │   └── main.jsx        # Application entry point
│   └── package.json        # Frontend dependencies
└── README.md              # Project documentation
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/verify` - Verify JWT token

### Inventory Management
- `GET /api/inventory` - Get user inventory
- `POST /api/inventory` - Add inventory item
- `PUT /api/inventory/:id` - Update inventory item
- `DELETE /api/inventory/:id` - Delete inventory item

### Sales Data
- `POST /api/upload` - Upload sales data CSV
- `GET /api/upload/sales-data` - Get sales data

### Forecasting
- `POST /api/forecast` - Generate forecasts
- `GET /api/forecast/methods` - Get available forecast methods
- `GET /api/forecast/dashboard/summary` - Get dashboard metrics

## 🎯 Usage Guide

### 1. Upload Sales Data
- Navigate to the Upload page
- Download the sample CSV template
- Upload your historical sales data
- System automatically processes and validates the data

### 2. Generate Forecasts
- Go to the Forecast page
- Select your preferred forecasting method:
  - **Combined Statistical Methods**: Advanced ensemble forecasting
  - **Linear Regression**: Statistical trend analysis
  - **Exponential Smoothing**: Weighted historical average
  - **Seasonal Naive**: Pattern-based prediction
- Enter forecast parameters (days, specific date ranges)
- Click "Generate Forecast" to create predictions

### 3. Dashboard Analytics
- View real-time inventory metrics
- Monitor low stock alerts
- Track forecast accuracy over time
- Analyze demand trends and patterns

### 4. Inventory Management
- Add/edit inventory items with reorder levels
- Monitor current stock levels
- Receive automated reorder suggestions
- Export data for external analysis

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern React and Node.js technologies
- Statistical analysis powered by simple-statistics library
- UI components styled with Tailwind CSS
- Charts and visualizations using Recharts

---

<p align="center">Built with ❤️ using React, Node.js, and advanced statistical methods</p> 

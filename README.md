# 🌊 AquaFine - Water Supply Management System

A comprehensive water supply and distribution management system built with Next.js and PostgreSQL.

## 🚀 Features

### 📊 Dashboard & Analytics
- Real-time business overview
- Key performance indicators
- Revenue and expense tracking
- Interactive data visualization

### 👥 Customer Management
- Advanced customer database with searchable interface
- Customer pricing management
- Customer advance tracking
- Customer ledgers and transaction history

### 💰 Financial Management
- Sell order processing with custom pricing
- Expenditure tracking with optional salesman assignment
- Employee advance management
- Comprehensive financial reporting
- Real-time ledger updates

### 📦 Inventory & Operations
- Product management and inventory tracking
- Rider activity monitoring
- Bottle tracking (empty/filled)
- Logistics management

### 👨‍💼 Employee Management
- Employee database management
- Employee advance tracking
- Salesman assignment for orders
- Performance tracking

## 🛠️ Technology Stack

- **Frontend**: Next.js 14.2.31, React 18, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with custom views and RLS
- **Deployment**: Ready for Vercel, Railway, or Netlify

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/M-Nabeegh/aqua-fien.git
   cd aqua-fien
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   ```bash
   # Create database
   createdb aquafine
   
   # Import schema (you'll need to provide your schema)
   psql -d aquafine -f database/schema.sql
   ```

4. **Environment Configuration**
   ```bash
   # Copy environment template
   cp .env.example .env.local
   
   # Edit with your database credentials
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=aquafine
   DB_USER=postgres
   DB_PASSWORD=your_password
   ```

5. **Run Development Server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🌐 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Login and deploy
vercel login
vercel --prod
```

### Railway
1. Connect your GitHub repository
2. Add PostgreSQL service
3. Set environment variables
4. Deploy automatically

### Manual Server
```bash
# Build for production
npm run build

# Start production server
npm run start
```

## 📱 Key Components

### SearchableCustomerSelect
Advanced customer selection component with:
- Real-time search functionality
- Keyboard navigation support
- Optimized performance for large customer lists

### Form Component
Universal form handler with:
- Optional field configuration
- Dynamic validation
- Consistent styling across the application

### Reports System
Comprehensive reporting with:
- Real-time data integration
- Financial summaries
- Export capabilities

## 🗄️ Database Schema

The system uses PostgreSQL with custom views for optimized data access:
- `v_customers_api` - Customer data view
- `v_products_api` - Product information view
- `v_expenditures_api` - Expense tracking view
- `v_sell_orders_api` - Order management view
- And more...

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with Next.js and React
- Styled with Tailwind CSS
- Database powered by PostgreSQL
- Deployed on modern cloud platforms

## 📞 Support

For support and questions, please open an issue on GitHub.

---

**AquaFine** - Streamlining water supply management for the digital age! 💧

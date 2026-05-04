import express from 'express';
import cors from 'cors';

// استيراد المسارات (Routes)
import authRoutes from './routes/authRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import incomeRoutes from './routes/incomeRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import installmentRoutes from './routes/installmentRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import goalRoutes from './routes/goalRoutes.js';

const app = express();

// إعدادات Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ربط كل ميزة بالمسار الخاص بها
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/payment-methods', walletRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/installments', installmentRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/dashboard', dashboardRoutes);

const PORT = 3000;
app.listen(PORT, async () => {
  // Server is running
});

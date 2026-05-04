// API Configuration
const API_URL = '/api';
let userId = localStorage.getItem('userId');
let authToken = localStorage.getItem('authToken');
let currentUser = null;
let categories = [];
let wallets = [];

// Auth Mode
let isLoginMode = true;

// Helper: إضافة Authorization header
function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
}

// ===== AUTH FUNCTIONS =====
function toggleAuthMode(e) {
  if (e) e.preventDefault();
  
  isLoginMode = !isLoginMode;
  const form = document.getElementById('authForm');
  const toggle = document.querySelector('.toggle-auth');

  if (!isLoginMode) {
    form.innerHTML = `
      <input type="text" id="username" placeholder="اسم المستخدم" required>
      <input type="email" id="email" placeholder="البريد الإلكتروني" required>
      <input type="password" id="password" placeholder="كلمة المرور" required>
      <button type="submit">إنشاء حساب جديد</button>
    `;
    toggle.innerHTML = 'لديك حساب بالفعل؟ <a href="#" onclick="toggleAuthMode(event)">تسجيل الدخول</a>';
  } else {
    form.innerHTML = `
      <input type="email" id="email" placeholder="البريد الإلكتروني" required>
      <input type="password" id="password" placeholder="كلمة المرور" required>
      <button type="submit">تسجيل الدخول</button>
    `;
    toggle.innerHTML = 'ليس لديك حساب؟ <a href="#" onclick="toggleAuthMode(event)">إنشاء حساب جديد</a>';
  }
}

async function handleAuth(e) {
  e.preventDefault();
  
  const email = document.getElementById('email')?.value;
  const password = document.getElementById('password')?.value;
  const username = document.getElementById('username')?.value;

  if (!email || !password) {
    alert('برجاء إدخال البريد وكلمة المرور');
    return;
  }

  try {
    const endpoint = isLoginMode ? 'login' : 'signup';
    const body = isLoginMode 
      ? { email, password }
      : { username, email, password };



    const response = await fetch(`${API_URL}/auth/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'خطأ في المصادقة');
    }

    authToken = data.token;
    userId = data.id;
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('userId', userId);
    
    currentUser = data;
    showDashboard();
    alert('تمت العملية بنجاح!');
  } catch (err) {

    alert('خطأ: ' + err.message);
  }
}

function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userId');
  authToken = null;
  userId = null;
  currentUser = null;
  
  const authPage = document.getElementById('authPage');
  const dashboardPage = document.getElementById('dashboardPage');
  
  if (authPage && dashboardPage) {
    authPage.style.display = 'flex';
    authPage.classList.add('active');
    dashboardPage.style.display = 'none';
    dashboardPage.classList.remove('active');
  }
  
  isLoginMode = true;
  document.getElementById('authForm').reset();
}

// ===== NAVIGATION FUNCTIONS =====
function goToPage(page) {
  // Reset all views
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  // Show selected view
  const viewId = page + 'View';
  const view = document.getElementById(viewId);
  if (view) {
    view.classList.add('active');
  }

  // Mark nav item as active
  event.target.classList.add('active');

  // Load data based on page
  if (page === 'dashboard') {
    loadDashboardData();
  } else if (page === 'transactions') {
    loadExpenses();
  } else if (page === 'income') {
    loadIncome();
  } else if (page === 'wallets') {
    loadWallets();
  } else if (page === 'categories') {
    loadCategoriesList();
  } else if (page === 'budgets') {
    loadBudgets();
  } else if (page === 'goals') {
    loadGoals();
  }
}

function showDashboard() {
  
  
  const authPage = document.getElementById('authPage');
  const dashboardPage = document.getElementById('dashboardPage');
  
  if (authPage && dashboardPage) {
    authPage.style.display = 'none';
    authPage.classList.remove('active');
    
    dashboardPage.style.display = 'flex';
    dashboardPage.classList.add('active');
    
    loadCurrentUser();
    loadDashboardData();
    loadCategories();
    loadWallets(); // لتحديث القائمة العالمية
  } else {

  }
}

async function loadCategories() {
  try {
    const response = await fetch(`${API_URL}/categories`, { headers: getHeaders() });
    if (response.ok) {
      categories = await response.json();
    }
  } catch (err) {

  }
}

async function loadCategoriesList() {
  try {
    const response = await fetch(`${API_URL}/categories`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to load categories');
    
    const categories = await response.json();
    const list = document.getElementById('categoriesList');
    
    list.innerHTML = categories.map(c => `
      <div class="list-item">
        <div class="item-info">
          <h4>${c.icon} ${c.name}</h4>
          <p>اللون: <span style="display:inline-block; width:10px; height:10px; background:${c.color}; border-radius:50%"></span></p>
        </div>
        <button class="btn-danger" onclick="deleteCategory(${c.id})">حذف</button>
      </div>
    `).join('');

    if (categories.length === 0) {
      list.innerHTML = '<div style="text-align: center; padding: 40px; color: #718096;">لا توجد تصنيفات</div>';
    }
  } catch (err) {
    
  }
}

async function loadBudgets() {
  try {
    const response = await fetch(`${API_URL}/budgets`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to load budgets');
    
    const budgets = await response.json();
    const list = document.getElementById('budgetsList');
    
    list.innerHTML = budgets.map(b => {
      const spent = Number(b.spent || 0);
      const limit = Number(b.limit_amount);
      const percentage = Math.min((spent / limit) * 100, 100);
      const color = percentage > 90 ? 'var(--danger)' : (percentage > 70 ? 'var(--warning)' : 'var(--success)');
      
      return `
        <div class="list-item" style="flex-direction: column; align-items: flex-start;">
          <div style="width: 100%; display: flex; justify-content: space-between; margin-bottom: 10px;">
            <h4>${b.category_icon} ${b.category_name} (${b.month}/${b.year})</h4>
            <button class="btn-danger" style="padding: 4px 8px;" onclick="deleteBudget(${b.id})">حذف</button>
          </div>
          <div style="width: 100%; display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 5px;">
             <span>المصروف: ${spent.toFixed(2)} ج.م</span>
             <span>الميزانية: ${limit.toFixed(2)} ج.م</span>
          </div>
          <div style="width: 100%; height: 10px; background: #edf2f7; border-radius: 5px; overflow: hidden;">
            <div style="width: ${percentage}%; height: 100%; background: ${color}; transition: width 0.5s;"></div>
          </div>
        </div>
      `;
    }).join('');

    if (budgets.length === 0) {
      list.innerHTML = '<div style="text-align: center; padding: 40px; color: #718096;">لا توجد ميزانيات محددة</div>';
    }
  } catch (err) {
    
  }
}

// ===== DATA LOADING FUNCTIONS =====
async function loadCurrentUser() {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to load user');

    const user = await response.json();
    currentUser = user;
    document.getElementById('userName').textContent = user.username;
  } catch (err) {
    
  }
}

async function loadDashboardData() {
  try {
    const response = await fetch(`${API_URL}/dashboard/summary`, {
      headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to load dashboard');

    const data = await response.json();
    document.getElementById('totalIncome').textContent = Number(data.totalIncome).toFixed(2);
    document.getElementById('totalExpenses').textContent = Number(data.totalExpenses).toFixed(2);
    document.getElementById('netBalance').textContent = Number(data.netBalance).toFixed(2);
    document.getElementById('topCategory').textContent = data.topCategory || '-';
  } catch (err) {
    
  }
}

async function loadExpenses() {
  try {
    const response = await fetch(`${API_URL}/expenses`, {
      headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to load expenses');

    const expenses = await response.json();
    const list = document.getElementById('expensesList');
    
    list.innerHTML = expenses.map(e => {
      const date = new Date(e.date).toLocaleDateString('ar-EG');
      return `
        <div class="list-item">
          <div class="item-info">
            <h4>${e.description || 'مصروف'}</h4>
            <p>${e.category_icon || '📦'} ${e.category_name || 'بدون فئة'} - ${date}</p>
          </div>
          <div style="display: flex; gap: 15px; align-items: center;">
            <div class="item-amount">-${Number(e.amount).toFixed(2)} ج.م</div>
            <button class="btn-danger" onclick="deleteExpense(${e.id})">حذف</button>
          </div>
        </div>
      `;
    }).join('');

    if (expenses.length === 0) {
      list.innerHTML = '<div style="text-align: center; padding: 40px; color: #718096;">لا توجد مصروفات</div>';
    }
  } catch (err) {
    
  }
}

async function loadIncome() {
  try {
    const response = await fetch(`${API_URL}/income`, {
      headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to load income');

    const income = await response.json();
    const list = document.getElementById('incomeList');
    
    list.innerHTML = income.map(i => {
      const date = new Date(i.date).toLocaleDateString('ar-EG');
      return `
        <div class="list-item">
          <div class="item-info">
            <h4>${i.source}</h4>
            <p>${i.description || '-'} - ${date}</p>
          </div>
          <div style="display: flex; gap: 15px; align-items: center;">
            <div class="item-amount" style="color: var(--success);">+${Number(i.amount).toFixed(2)} ج.م</div>
            <button class="btn-danger" onclick="deleteIncome(${i.id})">حذف</button>
          </div>
        </div>
      `;
    }).join('');

    if (income.length === 0) {
      list.innerHTML = '<div style="text-align: center; padding: 40px; color: #718096;">لا يوجد دخل</div>';
    }
  } catch (err) {
    
  }
}

async function loadWallets() {
  try {
    const response = await fetch(`${API_URL}/payment-methods`, {
      headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to load wallets');

    wallets = await response.json(); // حفظ في القائمة العالمية
    const list = document.getElementById('walletsList');
    
    list.innerHTML = wallets.map(w => `
      <div class="list-item">
        <div class="item-info">
          <h4>${w.name}</h4>
        </div>
        <div style="display: flex; gap: 15px; align-items: center;">
          <div class="item-amount">${Number(w.balance).toFixed(2)} ج.م</div>
          <button class="btn-danger" onclick="deleteWallet(${w.id})">حذف</button>
        </div>
      </div>
    `).join('');

    if (wallets.length === 0) {
      list.innerHTML = '<div style="text-align: center; padding: 40px; color: #718096;">لا توجد محافظ</div>';
    }
  } catch (err) {
    
  }
}

async function loadGoals() {
  try {
    const response = await fetch(`${API_URL}/goals`, {
      headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to load goals');

    const goals = await response.json();
    const list = document.getElementById('goalsList');
    
    list.innerHTML = goals.map(g => {
      const percentage = (g.current_amount / g.target_amount * 100).toFixed(0);
      return `
        <div class="list-item" style="flex-direction: column; align-items: flex-start;">
          <div style="width: 100%; margin-bottom: 10px;">
            <h4>${g.name}</h4>
            <p>${Number(g.current_amount).toFixed(2)} / ${Number(g.target_amount).toFixed(2)} ج.م</p>
          </div>
          <div style="width: 100%; height: 8px; background: var(--border); border-radius: 4px; overflow: hidden;">
            <div style="width: ${percentage}%; height: 100%; background: linear-gradient(90deg, var(--primary), var(--secondary));"></div>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn-secondary" style="margin-top: 10px; flex: 1;" onclick="showContributeModal(${g.id})">💰 إيداع</button>
            <button class="btn-danger" style="margin-top: 10px;" onclick="deleteGoal(${g.id})">حذف</button>
          </div>
        </div>
      `;
    }).join('');

    if (goals.length === 0) {
      list.innerHTML = '<div style="text-align: center; padding: 40px; color: #718096;">لا توجد أهداف</div>';
    }
  } catch (err) {
    
  }
}

// ===== FORM FUNCTIONS =====
function showAddExpenseForm() {
  const form = document.getElementById('itemForm');
  form.innerHTML = `
    <h3>إضافة مصروف جديد</h3>
    <input type="number" id="expenseAmount" placeholder="المبلغ" step="0.01" required>
    <select id="expenseCategory" required>
      <option value="">اختر الفئة</option>
      ${categories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
    </select>
    <input type="date" id="expenseDate" required>
    <input type="text" id="expenseDescription" placeholder="الوصف (اختياري)">
    <select id="expensePaymentMethodId">
      <option value="">اختر المحفظة (اختياري)</option>
      ${wallets.map(w => `<option value="${w.id}">${w.name} (${Number(w.balance).toFixed(2)} ج.م)</option>`).join('')}
    </select>
    <div class="form-buttons">
      <button type="button" class="btn-cancel" onclick="closeModal()">إلغاء</button>
      <button type="button" class="btn-save" onclick="saveExpense()">حفظ</button>
    </div>
  `;
  
  // Set today's date
  document.getElementById('expenseDate').valueAsDate = new Date();
  
  document.getElementById('formModal').classList.add('active');
}

function showAddIncomeForm() {
  const form = document.getElementById('itemForm');
  form.innerHTML = `
    <h3>إضافة دخل جديد</h3>
    <input type="number" id="incomeAmount" placeholder="المبلغ" step="0.01" required>
    <input type="text" id="incomeSource" placeholder="مصدر الدخل" required>
    <input type="date" id="incomeDate" required>
    <input type="text" id="incomeDescription" placeholder="الوصف (اختياري)">
    <select id="incomePaymentMethodId">
      <option value="">اختر المحفظة (اختياري)</option>
      ${wallets.map(w => `<option value="${w.id}">${w.name} (${Number(w.balance).toFixed(2)} ج.م)</option>`).join('')}
    </select>
    <div class="form-buttons">
      <button type="button" class="btn-cancel" onclick="closeModal()">إلغاء</button>
      <button type="button" class="btn-save" onclick="saveIncome()">حفظ</button>
    </div>
  `;
  
  document.getElementById('incomeDate').valueAsDate = new Date();
  document.getElementById('formModal').classList.add('active');
}

function showAddWalletForm() {
  const form = document.getElementById('itemForm');
  form.innerHTML = `
    <h3>إضافة محفظة جديدة</h3>
    <input type="text" id="walletName" placeholder="اسم المحفظة (مثلاً: كاش، بنك)" required>
    <input type="number" id="walletBalance" placeholder="الرصيد الأولي" step="0.01" value="0">
    <div class="form-buttons">
      <button type="button" class="btn-cancel" onclick="closeModal()">إلغاء</button>
      <button type="button" class="btn-save" onclick="saveWallet()">حفظ</button>
    </div>
  `;
  
  document.getElementById('formModal').classList.add('active');
}

function showAddGoalForm() {
  const form = document.getElementById('itemForm');
  form.innerHTML = `
    <h3>إضافة هدف ادخاري جديد</h3>
    <input type="text" id="goalName" placeholder="اسم الهدف" required>
    <input type="number" id="goalTarget" placeholder="المبلغ المستهدف" step="0.01" required>
    <div class="form-buttons">
      <button type="button" class="btn-cancel" onclick="closeModal()">إلغاء</button>
      <button type="button" class="btn-save" onclick="saveGoal()">حفظ</button>
    </div>
  `;
  
  document.getElementById('formModal').classList.add('active');
}

function showAddCategoryForm() {
  const form = document.getElementById('itemForm');
  form.innerHTML = `
    <h3>إضافة فئة جديدة</h3>
    <input type="text" id="catName" placeholder="اسم الفئة (مثلاً: طعام)" required>
    <input type="text" id="catIcon" placeholder="أيقونة (مثلاً: 🍕)" required>
    <input type="color" id="catColor" value="#667eea" style="height: 50px;">
    <div class="form-buttons">
      <button type="button" class="btn-cancel" onclick="closeModal()">إلغاء</button>
      <button type="button" class="btn-save" onclick="saveCategory()">حفظ</button>
    </div>
  `;
  document.getElementById('formModal').classList.add('active');
}

async function saveCategory() {
  const name = document.getElementById('catName').value;
  const icon = document.getElementById('catIcon').value;
  const color = document.getElementById('catColor').value;

  try {
    const response = await fetch(`${API_URL}/categories`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, icon, color })
    });

    if (!response.ok) throw new Error('Failed to save category');

    closeModal();
    loadCategories(); 
    loadCategoriesList(); 
    alert('تم إضافة الفئة بنجاح');
  } catch (err) {
    alert('خطأ: ' + err.message);
  }
}

async function contributeToGoal(id) {
  const amount = document.getElementById('contributeAmount').value;
  const wallet_id = document.getElementById('contributeWalletId').value;
  
  if (!amount || !wallet_id) {
    alert('يرجى إدخال المبلغ واختيار المحفظة');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/goals/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ 
        amount: parseFloat(amount),
        wallet_id: parseInt(wallet_id)
      })
    });

    if (!response.ok) throw new Error('Failed to update goal');

    closeModal();
    loadGoals();
    loadDashboardData();
    alert('تم الإيداع بنجاح! تم خصم المبلغ من محفظتك 🚀');
  } catch (err) {
    alert('خطأ: ' + err.message);
  }
}

function showContributeModal(id) {
  const form = document.getElementById('itemForm');
  form.innerHTML = `
    <h3>إيداع في الهدف</h3>
    <input type="number" id="contributeAmount" placeholder="المبلغ المراد إيداعه" step="0.01" required>
    <select id="contributeWalletId" required>
      <option value="">اختر المحفظة للخصم منها</option>
      ${wallets.map(w => `<option value="${w.id}">${w.name} (${Number(w.balance).toFixed(2)} ج.م)</option>`).join('')}
    </select>
    <div class="form-buttons">
      <button type="button" class="btn-cancel" onclick="closeModal()">إلغاء</button>
      <button type="button" class="btn-save" onclick="contributeToGoal(${id})">تأكيد الإيداع</button>
    </div>
  `;
  document.getElementById('formModal').classList.add('active');
}

async function deleteGoal(id) {
  if (!confirm('هل أنت متأكد من حذف هذا الهدف؟')) return;
  try {
    await fetch(`${API_URL}/goals/${id}`, { method: 'DELETE', headers: getHeaders() });
    loadGoals();
  } catch (err) { alert(err.message); }
}

async function deleteWallet(id) {
  if (!confirm('هل أنت متأكد من حذف هذه المحفظة؟ سيتم حذف جميع المصاريف المرتبطة بها!')) return;
  try {
    await fetch(`${API_URL}/payment-methods/${id}`, { method: 'DELETE', headers: getHeaders() });
    loadWallets();
    loadDashboardData();
  } catch (err) { alert(err.message); }
}

async function deleteCategory(id) {
  if (!confirm('هل أنت متأكد من حذف هذا التصنيف؟')) return;
  try {
    await fetch(`${API_URL}/categories/${id}`, { method: 'DELETE', headers: getHeaders() });
    loadCategories();
    loadCategoriesList();
  } catch (err) { alert(err.message); }
}

function showAddBudgetForm() {
  const form = document.getElementById('itemForm');
  const now = new Date();
  form.innerHTML = `
    <h3>إضافة ميزانية جديدة</h3>
    <select id="budgetCategoryId" required>
      <option value="">اختر الفئة</option>
      ${categories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
    </select>
    <input type="number" id="budgetLimit" placeholder="المبلغ المخصص (الحد الأقصى)" step="0.01" required>
    <div style="display: flex; gap: 10px;">
      <input type="number" id="budgetMonth" value="${now.getMonth() + 1}" placeholder="الشهر (1-12)" min="1" max="12" required>
      <input type="number" id="budgetYear" value="${now.getFullYear()}" placeholder="السنة" required>
    </div>
    <div class="form-buttons">
      <button type="button" class="btn-cancel" onclick="closeModal()">إلغاء</button>
      <button type="button" class="btn-save" onclick="saveBudget()">حفظ الميزانية</button>
    </div>
  `;
  document.getElementById('formModal').classList.add('active');
}

async function saveBudget() {
  const category_id = document.getElementById('budgetCategoryId').value;
  const limit_amount = document.getElementById('budgetLimit').value;
  const month = document.getElementById('budgetMonth').value;
  const year = document.getElementById('budgetYear').value;

  try {
    const response = await fetch(`${API_URL}/budgets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        category_id: parseInt(category_id),
        limit_amount: parseFloat(limit_amount),
        month: parseInt(month),
        year: parseInt(year)
      })
    });

    if (!response.ok) throw new Error('Failed to save budget');

    closeModal();
    loadBudgets();
    alert('تم تحديد الميزانية بنجاح');
  } catch (err) {
    alert('خطأ: ' + err.message);
  }
}

async function deleteBudget(id) {
  if (!confirm('هل أنت متأكد من حذف هذه الميزانية؟')) return;
  try {
    await fetch(`${API_URL}/budgets/${id}`, { method: 'DELETE', headers: getHeaders() });
    loadBudgets();
  } catch (err) { alert(err.message); }
}

async function saveExpense() {
  const amount = document.getElementById('expenseAmount').value;
  const category_id = document.getElementById('expenseCategory').value;
  const date = document.getElementById('expenseDate').value;
  const description = document.getElementById('expenseDescription').value;
  const payment_method_id = document.getElementById('expensePaymentMethodId').value || null;

  try {
    const response = await fetch(`${API_URL}/expenses`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        amount: parseFloat(amount),
        category_id: parseInt(category_id),
        date,
        description,
        payment_method_id: payment_method_id ? parseInt(payment_method_id) : null
      })
    });

    if (!response.ok) throw new Error('Failed to save expense');

    closeModal();
    loadExpenses();
    loadDashboardData();
    alert('تم حفظ المصروف بنجاح');
  } catch (err) {
    alert('خطأ: ' + err.message);
  }
}

async function saveIncome() {
  const amount = document.getElementById('incomeAmount').value;
  const source = document.getElementById('incomeSource').value;
  const date = document.getElementById('incomeDate').value;
  const description = document.getElementById('incomeDescription').value;
  const payment_method_id = document.getElementById('incomePaymentMethodId').value || null;

  try {
    const response = await fetch(`${API_URL}/income`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        amount: parseFloat(amount),
        source,
        date,
        description,
        payment_method_id: payment_method_id ? parseInt(payment_method_id) : null
      })
    });

    if (!response.ok) throw new Error('Failed to save income');

    closeModal();
    loadIncome();
    loadDashboardData();
    alert('تم حفظ الدخل بنجاح');
  } catch (err) {
    alert('خطأ: ' + err.message);
  }
}

async function saveWallet() {
  const name = document.getElementById('walletName').value;
  const balance = document.getElementById('walletBalance').value;

  try {
    const response = await fetch(`${API_URL}/payment-methods`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        name,
        balance: parseFloat(balance)
      })
    });

    if (!response.ok) throw new Error('Failed to save wallet');

    closeModal();
    loadWallets();
    alert('تم حفظ المحفظة بنجاح');
  } catch (err) {
    alert('خطأ: ' + err.message);
  }
}

async function saveGoal() {
  const name = document.getElementById('goalName').value;
  const target_amount = document.getElementById('goalTarget').value;

  try {
    const response = await fetch(`${API_URL}/goals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        name,
        target_amount: parseFloat(target_amount)
      })
    });

    if (!response.ok) throw new Error('Failed to save goal');

    closeModal();
    loadGoals();
    alert('تم حفظ الهدف بنجاح');
  } catch (err) {
    alert('خطأ: ' + err.message);
  }
}

async function deleteExpense(id) {
  if (!confirm('هل تريد حذف هذا المصروف؟')) return;

  try {
    const response = await fetch(`${API_URL}/expenses/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to delete expense');

    loadExpenses();
    loadDashboardData();
    alert('تم حذف المصروف بنجاح');
  } catch (err) {
    alert('خطأ: ' + err.message);
  }
}

async function deleteIncome(id) {
  if (!confirm('هل تريد حذف هذا الدخل؟')) return;

  try {
    const response = await fetch(`${API_URL}/income/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to delete income');

    loadIncome();
    loadDashboardData();
    alert('تم حذف الدخل بنجاح');
  } catch (err) {
    alert('خطأ: ' + err.message);
  }
}

function closeModal() {
  document.getElementById('formModal').classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('authForm').addEventListener('submit', handleAuth);

  if (userId) {
    showDashboard();
  } else {
    const authPage = document.getElementById('authPage');
    const dashboardPage = document.getElementById('dashboardPage');
    if (authPage) authPage.style.display = 'flex';
    if (dashboardPage) dashboardPage.style.display = 'none';
  }
});
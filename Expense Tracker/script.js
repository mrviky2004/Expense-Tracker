// React-like hooks simulation for vanilla JS
const useState = (initialValue) => {
    let value = initialValue;
    const getValue = () => value;
    const setValue = (newValue) => {
        value = newValue;
        renderApp();
    };
    return [getValue, setValue];
};

const useEffect = (callback, dependencies) => {
    let hasRun = false;
    let prevDependencies = dependencies;
    
    const checkDependencies = () => {
        if (!dependencies) return true;
        if (!prevDependencies) return true;
        return dependencies.some((dep, i) => dep !== prevDependencies[i]);
    };
    
    if (!hasRun || checkDependencies()) {
        callback();
        hasRun = true;
        prevDependencies = [...(dependencies || [])];
    }
};

const useRef = (initialValue) => {
    return { current: initialValue };
};

const useMemo = (factory, dependencies) => {
    let hasRun = false;
    let memoizedValue;
    let prevDependencies = dependencies;
    
    const checkDependencies = () => {
        if (!dependencies) return true;
        if (!prevDependencies) return true;
        return dependencies.some((dep, i) => dep !== prevDependencies[i]);
    };
    
    if (!hasRun || checkDependencies()) {
        memoizedValue = factory();
        hasRun = true;
        prevDependencies = [...dependencies];
    }
    
    return memoizedValue;
};

const useCallback = (callback, dependencies) => {
    return useMemo(() => callback, dependencies);
};

// Mock API function to simulate data fetching
const mockExpensesAPI = () => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                { id: 1, name: "Groceries", amount: 85.75, category: "Food", date: "2025-10-28" },
                { id: 2, name: "Gas", amount: 45.50, category: "Transportation", date: "2025-10-25" },
                { id: 3, name: "Movie Tickets", amount: 32.00, category: "Entertainment", date: "2025-10-22" },
                { id: 4, name: "Electricity Bill", amount: 120.30, category: "Utilities", date: "2025-10-15" },
                { id: 5, name: "Dinner Out", amount: 65.40, category: "Food", date: "2025-10-10" }
            ]);
        }, 1500);
    });
};

// State management
const [getExpenses, setExpenses] = useState([]);
const [getFilter, setFilter] = useState('');
const [getSort, setSort] = useState('date-desc');
const [getLoading, setLoading] = useState(true);

// Refs
const nameInputRef = useRef(null);

// Memoized calculations
const getTotalExpenses = () => {
    return useMemo(() => {
        const expenses = getExpenses();
        return expenses.reduce((total, expense) => total + expense.amount, 0).toFixed(2);
    }, [getExpenses()]);
};

const getMonthlyExpenses = () => {
    return useMemo(() => {
        const expenses = getExpenses();
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        return expenses
            .filter(expense => {
                const expenseDate = new Date(expense.date);
                return expenseDate.getMonth() === currentMonth && 
                       expenseDate.getFullYear() === currentYear;
            })
            .reduce((total, expense) => total + expense.amount, 0)
            .toFixed(2);
    }, [getExpenses()]);
};

const getLargestExpense = () => {
    return useMemo(() => {
        const expenses = getExpenses();
        if (expenses.length === 0) return '0.00';
        
        const largest = expenses.reduce((max, expense) => 
            expense.amount > max.amount ? expense : max, expenses[0]);
        
        return largest.amount.toFixed(2);
    }, [getExpenses()]);
};

// Filtered and sorted expenses
const getFilteredExpenses = () => {
    return useMemo(() => {
        const expenses = getExpenses();
        const filter = getFilter();
        const sort = getSort();
        
        let filtered = expenses;
        
        if (filter) {
            filtered = expenses.filter(expense => expense.category === filter);
        }
        
        // Apply sorting
        filtered = [...filtered].sort((a, b) => {
            switch(sort) {
                case 'date-desc':
                    return new Date(b.date) - new Date(a.date);
                case 'date-asc':
                    return new Date(a.date) - new Date(b.date);
                case 'amount-desc':
                    return b.amount - a.amount;
                case 'amount-asc':
                    return a.amount - b.amount;
                default:
                    return 0;
            }
        });
        
        return filtered;
    }, [getExpenses(), getFilter(), getSort()]);
};

// Event handlers with useCallback
const handleAddExpense = useCallback((event) => {
    event.preventDefault();
    
    const name = document.getElementById('expense-name').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const category = document.getElementById('expense-category').value;
    const date = document.getElementById('expense-date').value;
    
    if (!name || !amount || !category || !date) {
        alert('Please fill in all fields');
        return;
    }
    
    const newExpense = {
        id: Date.now(),
        name,
        amount,
        category,
        date
    };
    
    setExpenses([...getExpenses(), newExpense]);
    
    // Reset form and focus on name input
    document.getElementById('expense-form').reset();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expense-date').value = today;
    
    if (nameInputRef.current) {
        nameInputRef.current.focus();
    }
}, [getExpenses()]);

const handleDeleteExpense = useCallback((id) => {
    setExpenses(getExpenses().filter(expense => expense.id !== id));
}, [getExpenses()]);

const handleFilterChange = useCallback((value) => {
    setFilter(value);
}, []);

const handleSortChange = useCallback((value) => {
    setSort(value);
}, []);

// Initialize the app
const initApp = () => {
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expense-date').value = today;
    
    // Focus on name input
    nameInputRef.current = document.getElementById('expense-name');
    if (nameInputRef.current) {
        nameInputRef.current.focus();
    }
    
    // Fetch initial expenses from mock API
    mockExpensesAPI().then(expenses => {
        setExpenses(expenses);
        setLoading(false);
    });
};

// Render function
const renderApp = () => {
    // Update summary
    document.getElementById('total-expenses').textContent = `$${getTotalExpenses()}`;
    document.getElementById('monthly-expenses').textContent = `$${getMonthlyExpenses()}`;
    document.getElementById('largest-expense').textContent = `$${getLargestExpense()}`;
    
    // Render expenses list
    const expensesList = document.getElementById('expenses-list');
    const filteredExpenses = getFilteredExpenses();
    
    if (getLoading()) {
        expensesList.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading expenses...</p>
            </div>
        `;
    } else if (filteredExpenses.length === 0) {
        expensesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <h3>No expenses found</h3>
                <p>Add your first expense using the form on the left</p>
            </div>
        `;
    } else {
        expensesList.innerHTML = filteredExpenses.map(expense => `
            <div class="expense-item">
                <div class="expense-details">
                    <div class="expense-title">${expense.name}</div>
                    <div class="expense-category">${expense.category}</div>
                    <div class="expense-date">${new Date(expense.date).toLocaleDateString()}</div>
                </div>
                <div class="expense-amount">$${expense.amount.toFixed(2)}</div>
                <button class="delete-btn" data-id="${expense.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                handleDeleteExpense(id);
            });
        });
    }
};

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the app with useEffect simulation
    useEffect(() => {
        initApp();
    }, []);
    
    // Form submission
    document.getElementById('expense-form').addEventListener('submit', handleAddExpense);
    
    // Filter and sort changes
    document.getElementById('category-filter').addEventListener('change', (e) => {
        handleFilterChange(e.target.value);
    });
    
    document.getElementById('sort-by').addEventListener('change', (e) => {
        handleSortChange(e.target.value);
    });
});

// Initial render
renderApp();
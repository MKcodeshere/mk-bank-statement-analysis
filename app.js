const { useState, useMemo } = React;
const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } = Recharts;

// Icon components
const Upload = LucideIcons.Upload;
const TrendingUp = LucideIcons.TrendingUp;
const TrendingDown = LucideIcons.TrendingDown;
const DollarSign = LucideIcons.DollarSign;
const CreditCard = LucideIcons.CreditCard;
const Search = LucideIcons.Search;
const ChevronDown = LucideIcons.ChevronDown;
const ChevronRight = LucideIcons.ChevronRight;
const Eye = LucideIcons.Eye;
const EyeOff = LucideIcons.EyeOff;
const BarChart3 = LucideIcons.BarChart3;

const FinanceAnalyzer = () => {
  const [transactions, setTransactions] = useState([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [showIncomeBreakdown, setShowIncomeBreakdown] = useState(false);

  // Function to categorize transactions
  const categorizeTransaction = (narration) => {
    if (!narration) return 'Others';
    
    const narrationLower = narration.toLowerCase();
    
    if (narrationLower.includes('zerodha')) return 'Stock Investment';
    if (narrationLower.includes('leelavathi')) return 'Wife Spending';
    if (narrationLower.includes('kotak securities')) return 'Kotak Money';
    if (narrationLower.includes('autorelli')) return 'Car Spending';
    if (narrationLower.includes('babyhug')) return 'Baby Spending';
    if (narrationLower.includes('zomato')) return 'Zomato Food Orders';
    if (narrationLower.includes('sudha coffee')) return 'Coffee Spending';
    if (narrationLower.includes('fuel')) return 'Petrol';
    if (narrationLower.includes('jewellers') || narrationLower.includes('thangamaliga')) return 'Jewellers';
    if (narrationLower.includes('indian clearing corp') || narrationLower.includes('pgim') || narrationLower.includes('india corp clearing')) return 'Mutual Fund';
    if (narrationLower.includes('openai') || narrationLower.includes('claude')) return 'AI Monthly Purchase';
    if (narrationLower.includes('apollo')) return 'Medical Expense';
    if (narrationLower.includes('bsnl') || narrationLower.includes('bharat sanchar nigam')) return 'Broadband Expense';
    if (narrationLower.includes('airtel')) return 'DTH & Mobile Expense';
    if (narrationLower.includes('fasttag')) return 'Toll Expense';
    if (narrationLower.includes('appleservices')) return 'Apple Expenses';
    if (narrationLower.includes('hlic')) return 'Term Plan';
    if (narrationLower.includes('amazon')) return 'Amazon';
    if (narrationLower.includes('alice')) return 'Alice Super Market';
    if (narrationLower.includes('trends')) return 'Reliance Trends';
    
    // ATM withdrawals
    if (narrationLower.includes('nwd') || narrationLower.includes('atw') || narrationLower.includes('eaw') || narrationLower.includes('nfs') || narrationLower.includes('awb')) return 'ATM Withdrawal';
    if (narrationLower.includes('ats') && !narrationLower.includes('bharat') && !narrationLower.includes('sanchar')) return 'ATM Withdrawal';
    
    if (narrationLower.includes('upi')) return 'UPI Payments';
    
    return 'Others';
  };

  const getMonthName = (monthIndex) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthIndex];
  };

  // Parse CSV
  const parseCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    
    const parsed = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      let values = line.split(',').map(v => v.trim());
      
      if (values.length === 8 && values[2] === '') {
        values = [values[0], values[1], values[3], values[4], values[5], values[6], values[7]];
      }
      
      if (values.length < 7) continue;
      
      const date = values[0].replace(/^"(.*)"$/, '$1').trim();
      const narration = values[1].replace(/^"(.*)"$/, '$1').trim();
      const debitAmountStr = values[3].replace(/^"(.*)"$/, '$1').trim();
      const creditAmountStr = values[4].replace(/^"(.*)"$/, '$1').trim();
      const closingBalanceStr = values[6].replace(/^"(.*)"$/, '$1').trim();
      
      const cleanAmount = (amountStr) => {
        if (!amountStr) return 0;
        const cleaned = amountStr.replace(/\s/g, '').replace(/[^\d.-]/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : Math.abs(parsed);
      };
      
      const debitAmount = cleanAmount(debitAmountStr);
      const creditAmount = cleanAmount(creditAmountStr);
      const closingBalance = cleanAmount(closingBalanceStr);
      
      if (date && (debitAmount > 0 || creditAmount > 0)) {
        parsed.push({
          date,
          narration,
          debitAmount,
          creditAmount,
          netAmount: creditAmount - debitAmount,
          closingBalance,
          category: categorizeTransaction(narration),
          type: debitAmount > 0 ? 'debit' : 'credit'
        });
      }
    }
    
    return parsed;
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvText = e.target.result;
        const parsedTransactions = parseCSV(csvText);
        setTransactions(parsedTransactions);
        
        if (parsedTransactions.length > 0) {
          const dates = parsedTransactions.map(t => {
            const [day, month, year] = t.date.split('/');
            const fullYear = year.length === 2 ? '20' + year : year;
            return new Date(fullYear, month - 1, day);
          });
          
          const minDate = new Date(Math.min(...dates));
          const maxDate = new Date(Math.max(...dates));
          
          setDateRange({ 
            start: minDate.toISOString().split('T')[0], 
            end: maxDate.toISOString().split('T')[0] 
          });
        }
      };
      reader.readAsText(file);
    }
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const [day, month, year] = transaction.date.split('/');
      const fullYear = year.length === 2 ? '20' + year : year;
      const transactionDate = new Date(fullYear, month - 1, day);
      
      const startDate = dateRange.start ? new Date(dateRange.start) : new Date('1900-01-01');
      const endDate = dateRange.end ? new Date(dateRange.end) : new Date('2100-12-31');
      const dateInRange = transactionDate >= startDate && transactionDate <= endDate;
      
      const matchesSearch = searchTerm === '' || transaction.narration.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || transaction.category === selectedCategory;
      
      return dateInRange && matchesSearch && matchesCategory;
    });
  }, [transactions, dateRange, searchTerm, selectedCategory]);

  // Calculate summary
  const summary = useMemo(() => {
    const totalDebit = filteredTransactions.reduce((sum, t) => sum + t.debitAmount, 0);
    const totalCredit = filteredTransactions.reduce((sum, t) => sum + t.creditAmount, 0);
    const netFlow = totalCredit - totalDebit;
    
    return {
      totalSpending: totalDebit,
      totalIncome: totalCredit,
      netFlow,
      transactionCount: filteredTransactions.length
    };
  }, [filteredTransactions]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const categories = ['all', ...new Set(transactions.map(t => t.category))];

  // Render the component
  return React.createElement('div', { className: "min-h-screen bg-gray-50 p-4" },
    React.createElement('div', { className: "max-w-7xl mx-auto" },
      // Header
      React.createElement('div', { className: "bg-white rounded-lg shadow-sm p-6 mb-6" },
        React.createElement('h1', { className: "text-3xl font-bold text-gray-900 mb-2" }, "Personal Finance Analyzer"),
        React.createElement('p', { className: "text-gray-600" }, "Upload your bank statement to analyze your spending patterns and gain financial insights")
      ),

      // File Upload
      transactions.length === 0 && React.createElement('div', { className: "bg-white rounded-lg shadow-sm p-8 mb-6" },
        React.createElement('div', { className: "text-center" },
          React.createElement(Upload, { className: "mx-auto h-12 w-12 text-gray-400 mb-4" }),
          React.createElement('h3', { className: "text-lg font-semibold text-gray-900 mb-2" }, "Upload Your Bank Statement"),
          React.createElement('p', { className: "text-gray-600 mb-6" }, "Select your .txt bank statement file to get started"),
          React.createElement('input', {
            type: "file",
            accept: ".txt,.csv",
            onChange: handleFileUpload,
            className: "block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          })
        )
      ),

      // Summary Cards (only show if transactions exist)
      transactions.length > 0 && React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-4 gap-6 mb-6" },
        React.createElement('div', { className: "bg-white rounded-lg shadow-sm p-6" },
          React.createElement('div', { className: "flex items-center justify-between" },
            React.createElement('div', {},
              React.createElement('p', { className: "text-sm text-gray-600" }, "Total Spending"),
              React.createElement('p', { className: "text-2xl font-bold text-red-600" }, formatCurrency(summary.totalSpending))
            ),
            React.createElement(TrendingDown, { className: "h-8 w-8 text-red-500" })
          )
        ),
        React.createElement('div', { className: "bg-white rounded-lg shadow-sm p-6" },
          React.createElement('div', { className: "flex items-center justify-between" },
            React.createElement('div', {},
              React.createElement('p', { className: "text-sm text-gray-600" }, "Total Income"),
              React.createElement('p', { className: "text-2xl font-bold text-green-600" }, formatCurrency(summary.totalIncome))
            ),
            React.createElement(TrendingUp, { className: "h-8 w-8 text-green-500" })
          )
        ),
        React.createElement('div', { className: "bg-white rounded-lg shadow-sm p-6" },
          React.createElement('div', { className: "flex items-center justify-between" },
            React.createElement('div', {},
              React.createElement('p', { className: "text-sm text-gray-600" }, "Net Flow"),
              React.createElement('p', { 
                className: `text-2xl font-bold ${summary.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`
              }, formatCurrency(summary.netFlow))
            ),
            React.createElement(DollarSign, { className: "h-8 w-8 text-blue-500" })
          )
        ),
        React.createElement('div', { className: "bg-white rounded-lg shadow-sm p-6" },
          React.createElement('div', { className: "flex items-center justify-between" },
            React.createElement('div', {},
              React.createElement('p', { className: "text-sm text-gray-600" }, "Transactions"),
              React.createElement('p', { className: "text-2xl font-bold text-blue-600" }, summary.transactionCount)
            ),
            React.createElement(CreditCard, { className: "h-8 w-8 text-purple-500" })
          )
        )
      ),

      // Recent Transactions (only show if transactions exist)
      transactions.length > 0 && React.createElement('div', { className: "bg-white rounded-lg shadow-sm p-6" },
        React.createElement('h3', { className: "text-lg font-semibold text-gray-900 mb-4" }, "Recent Transactions"),
        React.createElement('div', { className: "overflow-x-auto" },
          React.createElement('table', { className: "w-full" },
            React.createElement('thead', {},
              React.createElement('tr', { className: "border-b border-gray-200" },
                React.createElement('th', { className: "text-left py-3 px-4 font-semibold text-gray-900" }, "Date"),
                React.createElement('th', { className: "text-left py-3 px-4 font-semibold text-gray-900" }, "Description"),
                React.createElement('th', { className: "text-left py-3 px-4 font-semibold text-gray-900" }, "Category"),
                React.createElement('th', { className: "text-right py-3 px-4 font-semibold text-gray-900" }, "Amount")
              )
            ),
            React.createElement('tbody', {},
              filteredTransactions.slice(0, 10).map((transaction, index) =>
                React.createElement('tr', { key: index, className: "border-b border-gray-100" },
                  React.createElement('td', { className: "py-3 px-4 text-gray-900" }, transaction.date),
                  React.createElement('td', { className: "py-3 px-4 text-gray-900" }, transaction.narration.substring(0, 50) + '...'),
                  React.createElement('td', { className: "py-3 px-4" },
                    React.createElement('span', { className: "px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full" },
                      transaction.category
                    )
                  ),
                  React.createElement('td', { 
                    className: `py-3 px-4 text-right font-medium ${transaction.debitAmount > 0 ? 'text-red-600' : 'text-green-600'}`
                  },
                    (transaction.debitAmount > 0 ? '-' : '+') + formatCurrency(Math.abs(transaction.netAmount))
                  )
                )
              )
            )
          )
        )
      )
    )
  );
};

// Render the app
ReactDOM.render(React.createElement(FinanceAnalyzer), document.getElementById('root'));

import React, { useState, useMemo } from 'react';
import { Upload, TrendingUp, TrendingDown, Calendar, PieChart, BarChart3, DollarSign, CreditCard, Search, Filter, Download, ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const FinanceAnalyzer = () => {
  const [transactions, setTransactions] = useState([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [showIncomeBreakdown, setShowIncomeBreakdown] = useState(false);

  // Function to categorize transactions based on user-specific patterns
  const categorizeTransaction = (narration) => {
    if (!narration) return 'Others';
    
    const narrationLower = narration.toLowerCase();
    
    // User-specific categorization rules (order matters - more specific first)
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
    
    // ATM withdrawals (put after specific service providers to avoid conflicts)
    if (narrationLower.includes('nwd') || narrationLower.includes('atw') || narrationLower.includes('eaw') || narrationLower.includes('nfs') || narrationLower.includes('awb')) return 'ATM Withdrawal';
    // Handle ATS more carefully - only if it's not part of a service provider name
    if (narrationLower.includes('ats') && !narrationLower.includes('bharat') && !narrationLower.includes('sanchar')) return 'ATM Withdrawal';
    
    // Group all UPI payments that don't match above categories
    if (narrationLower.includes('upi')) return 'UPI Payments';
    
    // Everything else
    return 'Others';
  };

  // Parse CSV data with smart column handling for comma issues
  const parseCSV = (csvText) => {
    console.log('=== CSV PARSING DEBUG ===');
    console.log('Raw CSV length:', csvText.length);
    console.log('First 200 chars:', JSON.stringify(csvText.substring(0, 200)));
    
    const lines = csvText.trim().split('\n');
    console.log('Total lines:', lines.length);
    
    if (lines.length < 2) {
      console.log('ERROR: Not enough lines in CSV');
      return [];
    }
    
    // Skip header line and process data
    const parsed = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        console.log(`Skipping empty line ${i}`);
        continue;
      }
      
      console.log(`\n--- Processing line ${i} ---`);
      console.log('Raw line:', JSON.stringify(line));
      
      // Basic comma split first
      let values = line.split(',').map(v => v.trim());
      console.log(`Initial split into ${values.length} parts`);
      
      // Handle cases where narration has trailing comma creating extra field
      if (values.length === 8 && values[2] === '') {
        console.log('Detected trailing comma in narration, merging fields');
        // Merge narration fields and reconstruct
        values = [
          values[0], // date
          values[1], // narration (already complete)
          values[3], // value date  
          values[4], // debit amount
          values[5], // credit amount
          values[6], // chq ref
          values[7], // closing balance
        ];
        console.log('Corrected to 7 fields after merging');
      } else if (values.length > 8) {
        console.log('Multiple commas in narration detected, need complex merging');
        // Find where the actual amounts start (look for numeric patterns)
        let amountStartIndex = -1;
        for (let j = values.length - 4; j >= 2; j--) {
          const potentialAmount = values[j].replace(/[^\d.-]/g, '');
          if (potentialAmount && !isNaN(parseFloat(potentialAmount))) {
            amountStartIndex = j;
            break;
          }
        }
        
        if (amountStartIndex > 2) {
          console.log(`Found amount start at index ${amountStartIndex}`);
          // Merge all narration parts
          const narrationParts = values.slice(1, amountStartIndex - 1);
          const mergedNarration = narrationParts.join(',').trim();
          
          values = [
            values[0], // date
            mergedNarration, // merged narration
            values[amountStartIndex - 1], // value date
            values[amountStartIndex], // debit amount
            values[amountStartIndex + 1], // credit amount
            values[amountStartIndex + 2], // chq ref
            values[amountStartIndex + 3], // closing balance
          ];
          console.log('Complex merge completed');
        }
      }
      
      console.log('Final values:', values.map((v, idx) => `${idx}: "${v}"`));
      
      if (values.length < 7) {
        console.log(`Line ${i} has insufficient columns: ${values.length}, skipping`);
        continue;
      }
      
      // Extract values based on expected column positions
      const date = values[0].replace(/^"(.*)"$/, '$1').trim();
      const narration = values[1].replace(/^"(.*)"$/, '$1').trim();
      const valueDate = values[2].replace(/^"(.*)"$/, '$1').trim();
      const debitAmountStr = values[3].replace(/^"(.*)"$/, '$1').trim();
      const creditAmountStr = values[4].replace(/^"(.*)"$/, '$1').trim();
      const chqRef = values[5].replace(/^"(.*)"$/, '$1').trim();
      const closingBalanceStr = values[6].replace(/^"(.*)"$/, '$1').trim();
      
      console.log('Extracted values:', {
        date: JSON.stringify(date),
        narration: JSON.stringify(narration.substring(0, 50) + (narration.length > 50 ? '...' : '')),
        debitAmountStr: JSON.stringify(debitAmountStr),
        creditAmountStr: JSON.stringify(creditAmountStr),
        closingBalanceStr: JSON.stringify(closingBalanceStr)
      });
      
      // Clean and parse amounts
      const cleanAmount = (amountStr) => {
        if (!amountStr || amountStr === '') return 0;
        const cleaned = amountStr.replace(/\s/g, '').replace(/[^\d.-]/g, '');
        const parsed = parseFloat(cleaned);
        console.log(`Amount cleaning: "${amountStr}" -> "${cleaned}" -> ${parsed}`);
        return isNaN(parsed) ? 0 : Math.abs(parsed);
      };
      
      const debitAmount = cleanAmount(debitAmountStr);
      const creditAmount = cleanAmount(creditAmountStr);
      const closingBalance = cleanAmount(closingBalanceStr);
      
      console.log('Final parsed amounts:', {
        debitAmount,
        creditAmount,
        closingBalance
      });
      
      // Only add if we have a valid date and at least one non-zero amount
      if (date && (debitAmount > 0 || creditAmount > 0)) {
        const transaction = {
          date,
          narration,
          valueDate,
          debitAmount,
          creditAmount,
          netAmount: creditAmount - debitAmount,
          closingBalance,
          chqRef,
          category: categorizeTransaction(narration),
          type: debitAmount > 0 ? 'debit' : 'credit'
        };
        
        parsed.push(transaction);
        console.log(`✓ Added transaction: ${date} - ${debitAmount > 0 ? 'Debit' : 'Credit'} ₹${debitAmount || creditAmount} - ${transaction.category}`);
      } else {
        console.log(`✗ Skipped transaction: invalid date "${date}" or zero amounts (D:${debitAmount}, C:${creditAmount})`);
      }
    }
    
    console.log(`\n=== PARSING COMPLETE ===`);
    console.log(`Successfully parsed ${parsed.length} transactions`);
    return parsed;
  };

  // Handle file upload with extensive debugging
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    console.log('=== FILE UPLOAD DEBUG ===');
    console.log('File selected:', file);
    
    if (file) {
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified)
      });
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        console.log('File read successfully');
        const csvText = e.target.result;
        console.log('File content length:', csvText.length);
        console.log('First 500 characters:', JSON.stringify(csvText.substring(0, 500)));
        console.log('Last 200 characters:', JSON.stringify(csvText.substring(csvText.length - 200)));
        
        try {
          const parsedTransactions = parseCSV(csvText);
          console.log('Parsed transactions count:', parsedTransactions.length);
          
          if (parsedTransactions.length > 0) {
            console.log('Setting transactions in state...');
            setTransactions(parsedTransactions);
            
            // Set default date range
            const dates = parsedTransactions.map(t => {
              // Handle DD/MM/YY format
              const [day, month, year] = t.date.split('/');
              const fullYear = year.length === 2 ? '20' + year : year;
              return new Date(fullYear, month - 1, day);
            });
            
            const minDate = new Date(Math.min(...dates));
            const maxDate = new Date(Math.max(...dates));
            
            const minDateStr = minDate.toISOString().split('T')[0];
            const maxDateStr = maxDate.toISOString().split('T')[0];
            
            console.log('Setting date range:', { minDateStr, maxDateStr });
            setDateRange({ start: minDateStr, end: maxDateStr });
            
            console.log('State update complete');
          } else {
            console.log('No transactions parsed!');
            alert('No valid transactions found in the file. Please check the file format.');
          }
        } catch (error) {
          console.error('Error parsing CSV:', error);
          alert('Error parsing the file: ' + error.message);
        }
      };
      
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        alert('Error reading the file');
      };
      
      reader.readAsText(file);
    } else {
      console.log('No file selected');
    }
  };

  // Filter transactions based on date range and search
  const filteredTransactions = useMemo(() => {
    console.log('=== FILTERING DEBUG ===');
    console.log('Total transactions in state:', transactions.length);
    console.log('Date range:', dateRange);
    console.log('Search term:', searchTerm);
    console.log('Selected category:', selectedCategory);
    
    if (transactions.length === 0) {
      console.log('No transactions to filter');
      return [];
    }
    
    const filtered = transactions.filter(transaction => {
      // Parse date from DD/MM/YY format
      const [day, month, year] = transaction.date.split('/');
      const fullYear = year.length === 2 ? '20' + year : year;
      const transactionDate = new Date(fullYear, month - 1, day);
      
      // Date range filtering
      const startDate = dateRange.start ? new Date(dateRange.start) : new Date('1900-01-01');
      const endDate = dateRange.end ? new Date(dateRange.end) : new Date('2100-12-31');
      const dateInRange = transactionDate >= startDate && transactionDate <= endDate;
      
      // Search filtering
      const matchesSearch = searchTerm === '' || transaction.narration.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Category filtering
      const matchesCategory = selectedCategory === 'all' || transaction.category === selectedCategory;
      
      const passes = dateInRange && matchesSearch && matchesCategory;
      
      if (!passes) {
        console.log(`Transaction filtered out:`, {
          date: transaction.date,
          dateInRange,
          matchesSearch,
          matchesCategory,
          debitAmount: transaction.debitAmount
        });
      }
      
      return passes;
    });
    
    console.log(`Filtered ${filtered.length} transactions from ${transactions.length} total`);
    console.log('Sample filtered:', filtered.slice(0, 2).map(t => ({
      date: t.date,
      debitAmount: t.debitAmount,
      creditAmount: t.creditAmount
    })));
    
    return filtered;
  }, [transactions, dateRange, searchTerm, selectedCategory]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    console.log('=== SUMMARY CALCULATION DEBUG ===');
    console.log('Filtered transactions count:', filteredTransactions.length);
    console.log('Sample filtered transactions:', filteredTransactions.slice(0, 3).map(t => ({
      date: t.date,
      debitAmount: t.debitAmount,
      creditAmount: t.creditAmount,
      category: t.category
    })));
    
    const totalDebit = filteredTransactions.reduce((sum, t) => {
      console.log(`Adding debit: ${sum} + ${t.debitAmount} = ${sum + t.debitAmount}`);
      return sum + t.debitAmount;
    }, 0);
    
    const totalCredit = filteredTransactions.reduce((sum, t) => {
      console.log(`Adding credit: ${sum} + ${t.creditAmount} = ${sum + t.creditAmount}`);
      return sum + t.creditAmount;
    }, 0);
    
    const netFlow = totalCredit - totalDebit;
    const avgDailySpend = filteredTransactions.length > 0 ? totalDebit / filteredTransactions.length : 0;
    
    const result = {
      totalSpending: totalDebit,
      totalIncome: totalCredit,
      netFlow,
      avgDailySpend,
      transactionCount: filteredTransactions.length
    };
    
    console.log('Summary calculation result:', result);
    return result;
  }, [filteredTransactions]);

  // Helper function to get month names
  const getMonthName = (monthIndex) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthIndex];
  };

  // Group transactions by period with proper date handling
  const groupedData = useMemo(() => {
    console.log('=== GROUPING DATA DEBUG ===');
    console.log('Selected period:', selectedPeriod);
    console.log('Filtered transactions count:', filteredTransactions.length);
    
    const groups = {};
    
    filteredTransactions.forEach(transaction => {
      // Parse date from DD/MM/YY format
      const [day, month, year] = transaction.date.split('/');
      const fullYear = year.length === 2 ? '20' + year : year;
      const date = new Date(fullYear, month - 1, day);
      
      console.log(`Processing transaction date: ${transaction.date} -> ${date.toDateString()}`);
      
      let key, displayLabel;
      
      if (selectedPeriod === 'daily') {
        key = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        displayLabel = `${day}/${month}`;
      } else if (selectedPeriod === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        key = weekStart.toISOString().split('T')[0];
        displayLabel = `${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`;
      } else { // monthly
        key = `${fullYear}-${month.padStart(2, '0')}`;
        displayLabel = `${getMonthName(parseInt(month) - 1)} ${fullYear}`;
      }
      
      console.log(`Grouping key: ${key}, Display: ${displayLabel}`);
      
      if (!groups[key]) {
        groups[key] = { 
          period: key, 
          displayLabel,
          spending: 0, 
          income: 0, 
          transactions: [],
          date: date // Keep original date for sorting
        };
      }
      
      groups[key].spending += transaction.debitAmount;
      groups[key].income += transaction.creditAmount;
      groups[key].transactions.push(transaction);
    });
    
    const sortedGroups = Object.values(groups)
      .sort((a, b) => a.date - b.date)
      .map(group => ({
        period: group.displayLabel,
        spending: group.spending,
        income: group.income,
        transactions: group.transactions
      }));
    
    console.log('Grouped data result:', sortedGroups);
    return sortedGroups;
  }, [filteredTransactions, selectedPeriod]);

  // Category breakdown with transactions
  const categoryData = useMemo(() => {
    const categories = {};
    
    filteredTransactions.forEach(transaction => {
      if (transaction.debitAmount > 0) {
        if (!categories[transaction.category]) {
          categories[transaction.category] = {
            amount: 0,
            transactions: []
          };
        }
        categories[transaction.category].amount += transaction.debitAmount;
        categories[transaction.category].transactions.push(transaction);
      }
    });
    
    return Object.entries(categories).map(([category, data]) => ({
      category,
      amount: data.amount,
      transactions: data.transactions,
      percentage: (data.amount / summary.totalSpending * 100).toFixed(1)
    })).sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, summary.totalSpending]);

  // Income breakdown
  const incomeData = useMemo(() => {
    return filteredTransactions
      .filter(transaction => transaction.creditAmount > 0)
      .sort((a, b) => b.creditAmount - a.creditAmount);
  }, [filteredTransactions]);

  // Toggle category expansion
  const toggleCategoryExpansion = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Top merchants
  const topMerchants = useMemo(() => {
    const merchants = {};
    
    filteredTransactions.forEach(transaction => {
      if (transaction.debitAmount > 0) {
        const merchant = transaction.narration.split('-')[1] || transaction.narration;
        const cleanMerchant = merchant.trim().substring(0, 30);
        
        if (!merchants[cleanMerchant]) {
          merchants[cleanMerchant] = { name: cleanMerchant, amount: 0, count: 0 };
        }
        merchants[cleanMerchant].amount += transaction.debitAmount;
        merchants[cleanMerchant].count += 1;
      }
    });
    
    return Object.values(merchants).sort((a, b) => b.amount - a.amount).slice(0, 5);
  }, [filteredTransactions]);

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316'];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const categories = ['all', ...new Set(transactions.map(t => t.category))];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Personal Finance Analyzer</h1>
          <p className="text-gray-600">Upload your bank statement to analyze your spending patterns and gain financial insights</p>
        </div>

        {/* File Upload */}
        {transactions.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Your Bank Statement</h3>
              <p className="text-gray-600 mb-6">Select your .txt bank statement file to get started</p>
              <input
                type="file"
                accept=".txt,.csv"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>
        )}

        {transactions.length > 0 && (
          <>
            {/* Controls */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Spending</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalSpending)}</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">Total Income</p>
                      <button
                        onClick={() => setShowIncomeBreakdown(!showIncomeBreakdown)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title={showIncomeBreakdown ? "Hide breakdown" : "Show breakdown"}
                      >
                        {showIncomeBreakdown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalIncome)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
                {showIncomeBreakdown && incomeData.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Income Breakdown ({incomeData.length} transactions)</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {incomeData.map((transaction, index) => (
                        <div key={index} className="flex justify-between items-center text-xs">
                          <span className="text-gray-700 truncate flex-1 mr-2">
                            {transaction.date} - {transaction.narration.substring(0, 25)}...
                          </span>
                          <span className="font-medium text-green-600">
                            +{formatCurrency(transaction.creditAmount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Net Flow</p>
                    <p className={`text-2xl font-bold ${summary.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(summary.netFlow)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Transactions</p>
                    <p className="text-2xl font-bold text-blue-600">{summary.transactionCount}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Spending Trend */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Spending Trend ({selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)})
                </h3>
                {groupedData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={groupedData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="period" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        formatter={(value, name) => [formatCurrency(value), name === 'spending' ? 'Spending' : 'Income']}
                        labelFormatter={(label) => `Period: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="spending" 
                        stroke="#ef4444" 
                        strokeWidth={3}
                        dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                        name="spending"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="income" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                        name="income"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No data available for the selected period</p>
                      <p className="text-sm">Try adjusting your date range or filters</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Category Breakdown */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="amount"
                      label={({category, percentage}) => `${category} (${percentage}%)`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Merchants */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Merchants</h3>
              <div className="space-y-3">
                {topMerchants.map((merchant, index) => (
                  <div key={merchant.name} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{merchant.name}</p>
                      <p className="text-sm text-gray-600">{merchant.count} transactions</p>
                    </div>
                    <p className="font-semibold text-gray-900">{formatCurrency(merchant.amount)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Breakdown Table */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Analysis</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Category</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">Amount</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">Percentage</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Transactions</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryData.map((category, index) => (
                      <React.Fragment key={category.category}>
                        <tr className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-gray-900 font-medium">{category.category}</td>
                          <td className="py-3 px-4 text-right text-gray-900">{formatCurrency(category.amount)}</td>
                          <td className="py-3 px-4 text-right text-gray-600">{category.percentage}%</td>
                          <td className="py-3 px-4 text-center text-gray-600">{category.transactions.length}</td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => toggleCategoryExpansion(category.category)}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                              title={expandedCategories[category.category] ? "Hide transactions" : "Show transactions"}
                            >
                              {expandedCategories[category.category] ? 
                                <ChevronDown className="h-4 w-4" /> : 
                                <ChevronRight className="h-4 w-4" />
                              }
                            </button>
                          </td>
                        </tr>
                        {expandedCategories[category.category] && (
                          <tr>
                            <td colSpan="5" className="px-4 py-0">
                              <div className="bg-gray-50 rounded-lg p-4 my-2">
                                <h4 className="text-sm font-medium text-gray-700 mb-3">
                                  {category.category} Transactions ({category.transactions.length})
                                </h4>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                  {category.transactions
                                    .sort((a, b) => b.debitAmount - a.debitAmount)
                                    .map((transaction, txIndex) => (
                                    <div key={txIndex} className="flex items-center justify-between bg-white rounded p-3 text-sm">
                                      <div className="flex-1">
                                        <div className="font-medium text-gray-900">{transaction.date}</div>
                                        <div className="text-gray-600 truncate">{transaction.narration}</div>
                                      </div>
                                      <div className="text-right ml-4">
                                        <div className="font-medium text-red-600">
                                          -{formatCurrency(transaction.debitAmount)}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          Balance: {formatCurrency(transaction.closingBalance)}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Description</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Category</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.slice(0, 10).map((transaction, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-gray-900">{transaction.date}</td>
                        <td className="py-3 px-4 text-gray-900">{transaction.narration.substring(0, 50)}...</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {transaction.category}
                          </span>
                        </td>
                        <td className={`py-3 px-4 text-right font-medium ${transaction.debitAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {transaction.debitAmount > 0 ? '-' : '+'}{formatCurrency(Math.abs(transaction.netAmount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FinanceAnalyzer;
ReactDOM.render(React.createElement(FinanceAnalyzer), document.getElementById('root'));

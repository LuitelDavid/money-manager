// Check if user is logged in
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'login.html';
}

// API helper function
async function apiCall(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    const response = await fetch(endpoint, { ...defaultOptions, ...options });
    
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        window.location.href = 'login.html';
        return;
    }

    return response;
}

// Format currency
function formatCurrency(amount) {
    return '₹' + parseFloat(amount).toFixed(2);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-IN', options);
}

// Load user info and balance
async function loadUserInfo() {
    try {
        const response = await apiCall('/api/me');
        const data = await response.json();

        if (response.ok) {
            document.getElementById('userName').textContent = data.user.name;
            document.getElementById('currentBalance').textContent = formatCurrency(data.currentBalance);
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

// Load transactions
async function loadTransactions() {
    try {
        const response = await apiCall('/api/transactions');
        const data = await response.json();

        const tbody = document.getElementById('transactionsBody');

        if (response.ok && data.transactions.length > 0) {
            tbody.innerHTML = data.transactions.map(txn => `
                <tr>
                    <td>${formatDate(txn.created_at)}</td>
                    <td>${txn.reason}</td>
                    <td class="text-right ${txn.type === 'expense' ? 'expense' : ''}">
                        ${txn.type === 'expense' ? formatCurrency(txn.amount) : '-'}
                    </td>
                    <td class="text-right ${txn.type === 'credit' ? 'credit' : ''}">
                        ${txn.type === 'credit' ? formatCurrency(txn.amount) : '-'}
                    </td>
                    <td class="text-right balance">${formatCurrency(txn.balance_after)}</td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No transactions yet</td></tr>';
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
        document.getElementById('transactionsBody').innerHTML = 
            '<tr><td colspan="5" class="text-center">Error loading transactions</td></tr>';
    }
}

// Handle transaction form submission
document.getElementById('transactionForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const errorMessage = document.getElementById('transactionError');
    const successMessage = document.getElementById('transactionSuccess');
    errorMessage.textContent = '';
    successMessage.textContent = '';

    const formData = {
        amount: parseFloat(document.getElementById('amount').value),
        type: document.getElementById('type').value,
        reason: document.getElementById('reason').value
    };

    try {
        const response = await apiCall('/api/transactions', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            successMessage.textContent = 'Transaction added successfully!';
            document.getElementById('transactionForm').reset();
            
            // Reload user info and transactions
            await loadUserInfo();
            await loadTransactions();

            // Clear success message after 3 seconds
            setTimeout(() => {
                successMessage.textContent = '';
            }, 3000);
        } else {
            errorMessage.textContent = data.error || 'Failed to add transaction';
        }
    } catch (error) {
        console.error('Error:', error);
        errorMessage.textContent = 'Network error. Please try again.';
    }
});

// Handle logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    window.location.href = 'login.html';
});

// Initialize dashboard
loadUserInfo();
loadTransactions();
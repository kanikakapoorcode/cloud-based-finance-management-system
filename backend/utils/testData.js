const { v4: uuidv4 } = require('uuid');
const db = require('../services/db');

async function addTestTransactions(userId, count = 5) {
  const categories = await db.getCategories();
  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

  const transactions = [];
  const types = ['expense', 'income'];
  
  for (let i = 0; i < count; i++) {
    const isExpense = Math.random() > 0.3;
    const type = isExpense ? 'expense' : 'income';
    const category = isExpense 
      ? expenseCategories[Math.floor(Math.random() * expenseCategories.length)]
      : incomeCategories[Math.floor(Math.random() * incomeCategories.length)];

    const amount = isExpense 
      ? Math.floor(Math.random() * 500) + 10
      : Math.floor(Math.random() * 2000) + 500;

    const transaction = {
      _id: uuidv4(),
      amount,
      type,
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} ${i + 1}`,
      date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
      category: category._id,
      user: userId,
      paymentMethod: ['cash', 'credit card', 'debit card', 'bank transfer'][Math.floor(Math.random() * 4)],
      isRecurring: Math.random() > 0.7,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    transactions.push(transaction);
    await db.addTransaction(transaction);
  }

  return transactions;
}

module.exports = {
  addTestTransactions
};

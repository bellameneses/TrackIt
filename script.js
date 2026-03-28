// form inputs
const form = document.getElementById("transaction-form")
const descriptionInput = document.getElementById("description")
const amountInput = document.getElementById("amount")
const typeInput = document.getElementById("type")
const categoryInput = document.getElementById("category")
const dateInput = document.getElementById("date")
const notesInput = document.getElementById("notes")

// summary text
const balanceText = document.getElementById("balance")
const incomeText = document.getElementById("income")
const expensesText = document.getElementById("expenses")
const savingsText = document.getElementById("savings")

// budget
const budgetInput = document.getElementById("budget-input")
const saveBudgetBtn = document.getElementById("save-budget-btn")
const budgetProgress = document.getElementById("budget-progress")
const budgetText = document.getElementById("budget-text")

// extra stats
const transactionCountText = document.getElementById("transaction-count")
const largestExpenseText = document.getElementById("largest-expense")
const topCategoryText = document.getElementById("top-category")

// filters
const searchInput = document.getElementById("search")
const sortInput = document.getElementById("sort")
const filterButtons = document.querySelectorAll(".filter-btn")

// buttons
const transactionList = document.getElementById("transaction-list")
const clearBtn = document.getElementById("clear-btn")
const resetBtn = document.getElementById("reset-btn")
const exportBtn = document.getElementById("export-btn")
const darkModeBtn = document.getElementById("dark-mode-btn")

// insights
const insightOne = document.getElementById("insight-one")
const insightTwo = document.getElementById("insight-two")
const insightThree = document.getElementById("insight-three")

// chart
const chartCanvas = document.getElementById("category-chart")
let categoryChart

// saved data
let transactions = JSON.parse(localStorage.getItem("transactions")) || []
let currentFilter = "all"
let currentTheme = localStorage.getItem("theme") || "light"
let monthlyBudget = Number(localStorage.getItem("monthlyBudget")) || 0

// money format
function formatMoney(value) {
  return "$" + Number(value).toFixed(2)
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

// save transactions
function saveTransactions() {
  localStorage.setItem("transactions", JSON.stringify(transactions))
}

// save theme
function saveTheme() {
  localStorage.setItem("theme", currentTheme)
}

// save budget
function saveBudget() {
  localStorage.setItem("monthlyBudget", monthlyBudget)
}

// apply dark or light mode
function applyTheme() {
  if (currentTheme === "dark") {
    document.body.classList.add("dark")
    if (darkModeBtn) darkModeBtn.textContent = "Light Mode"
  } else {
    document.body.classList.remove("dark")
    if (darkModeBtn) darkModeBtn.textContent = "Dark Mode"
  }
}

// get visible transactions after search filter and sort
function getVisibleTransactions() {
  let visible = [...transactions]
  const searchValue = searchInput ? searchInput.value.trim().toLowerCase() : ""

  if (currentFilter !== "all") {
    visible = visible.filter(t => t.type === currentFilter)
  }

  if (searchValue) {
    visible = visible.filter(t =>
      t.description.toLowerCase().includes(searchValue) ||
      t.category.toLowerCase().includes(searchValue) ||
      t.notes.toLowerCase().includes(searchValue)
    )
  }

  const sortValue = sortInput ? sortInput.value : "newest"

  if (sortValue === "newest") {
    visible.sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  if (sortValue === "oldest") {
    visible.sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  if (sortValue === "highest") {
    visible.sort((a, b) => b.amount - a.amount)
  }

  if (sortValue === "lowest") {
    visible.sort((a, b) => a.amount - b.amount)
  }

  return visible
}

// update the top summary cards
function updateSummary() {
  let incomeTotal = 0
  let expenseTotal = 0

  transactions.forEach(t => {
    if (t.type === "income") {
      incomeTotal += t.amount
    } else {
      expenseTotal += t.amount
    }
  })

  const balanceTotal = incomeTotal - expenseTotal
  const savingsTotal = Math.max(balanceTotal, 0)

  balanceText.textContent = formatMoney(balanceTotal)
  incomeText.textContent = formatMoney(incomeTotal)
  expensesText.textContent = formatMoney(expenseTotal)
  savingsText.textContent = formatMoney(savingsTotal)
}

// update budget bar
function updateBudgetBar() {
  const totalExpenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)

  if (monthlyBudget <= 0) {
    budgetProgress.style.width = "0%"
    budgetProgress.classList.remove("over-budget")
    budgetText.textContent = formatMoney(totalExpenses) + " of $0.00 used"
    budgetInput.value = ""
    return
  }

  budgetInput.value = monthlyBudget

  const percent = (totalExpenses / monthlyBudget) * 100
  const barWidth = Math.min(percent, 100)

  budgetProgress.style.width = barWidth + "%"

  if (percent > 100) {
    budgetProgress.classList.add("over-budget")
    budgetText.textContent = formatMoney(totalExpenses) + " of " + formatMoney(monthlyBudget) + " used. you are over budget."
  } else {
    budgetProgress.classList.remove("over-budget")
    budgetText.textContent = formatMoney(totalExpenses) + " of " + formatMoney(monthlyBudget) + " used"
  }
}

// update small stats
function updateStats() {
  transactionCountText.textContent = transactions.length

  const expenseOnly = transactions.filter(t => t.type === "expense")

  if (expenseOnly.length === 0) {
    largestExpenseText.textContent = "$0.00"
  } else {
    const largest = Math.max(...expenseOnly.map(t => t.amount))
    largestExpenseText.textContent = formatMoney(largest)
  }

  const categoryTotals = {}

  transactions.forEach(t => {
    if (!categoryTotals[t.category]) {
      categoryTotals[t.category] = 0
    }
    categoryTotals[t.category] += t.amount
  })

  let topCategory = "none"
  let topValue = 0

  for (const category in categoryTotals) {
    if (categoryTotals[category] > topValue) {
      topValue = categoryTotals[category]
      topCategory = category
    }
  }

  topCategoryText.textContent = capitalize(topCategory)
}

// update insight messages
function updateInsights() {
  if (transactions.length === 0) {
    insightOne.textContent = "Add some transactions to see insights"
    insightTwo.textContent = ""
    insightThree.textContent = ""
    return
  }

  const incomeOnly = transactions.filter(t => t.type === "income")
  const expenseOnly = transactions.filter(t => t.type === "expense")

  const totalIncome = incomeOnly.reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = expenseOnly.reduce((sum, t) => sum + t.amount, 0)

  if (totalExpenses > totalIncome) {
    insightOne.textContent = "You are spending more than you are earning right now"
  } else if (totalIncome > totalExpenses) {
    insightOne.textContent = "Nice, your income is higher than your expenses"
  } else {
    insightOne.textContent = "Your income and expenses are balanced right now"
  }

  if (expenseOnly.length > 0) {
    const biggestExpense = expenseOnly.reduce((max, t) =>
      t.amount > max.amount ? t : max
    )
    insightTwo.textContent = "Your biggest expense was " + biggestExpense.description + " at " + formatMoney(biggestExpense.amount)
  } else {
    insightTwo.textContent = "You have no expenses yet"
  }

  const latest = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
  insightThree.textContent = "Latest transaction: " + latest.description + " on " + latest.date
}

// update chart
function updateCategoryChart() {
  const expenseOnly = transactions.filter(t => t.type === "expense")

  const categoryTotals = {}

  expenseOnly.forEach(t => {
    if (!categoryTotals[t.category]) {
      categoryTotals[t.category] = 0
    }
    categoryTotals[t.category] += t.amount
  })

  const labels = Object.keys(categoryTotals).map(category => capitalize(category))
  const data = Object.values(categoryTotals)

  if (categoryChart) {
    categoryChart.destroy()
  }

  if (labels.length === 0) {
    categoryChart = new Chart(chartCanvas, {
      type: "pie",
      data: {
        labels: ["no expense data yet"],
        datasets: [{
          data: [1],
          backgroundColor: ["#94a3b8"]
        }]
      },
      options: {
        plugins: {
          legend: {
            position: "bottom"
          }
        }
      }
    })
    return
  }

  categoryChart = new Chart(chartCanvas, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: [
          "#4f7cff",
          "#22c55e",
          "#ef4444",
          "#f59e0b",
          "#a855f7",
          "#14b8a6",
          "#ec4899",
          "#8b5cf6"
        ]
      }]
    },
    options: {
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  })
}

// render transaction list
function renderTransactions() {
  const visibleTransactions = getVisibleTransactions()
  transactionList.innerHTML = ""

  if (visibleTransactions.length === 0) {
    transactionList.innerHTML = `
      <li class="transaction-item">
        <div class="transaction-left">
          <h3>no transactions found</h3>
        </div>
      </li>
    `
    return
  }

  visibleTransactions.forEach(t => {
    const li = document.createElement("li")
    li.classList.add("transaction-item", t.type)

    li.innerHTML = `
      <div class="transaction-left">
        <h3>${t.description}</h3>
        <p class="transaction-meta">${capitalize(t.category)} • ${capitalize(t.type)} • ${formatDate(t.date)}</p> 
        <p class="transaction-note">${t.notes ? t.notes : "no note"}</p>
      </div>

      <div class="transaction-right">
        <span class="transaction-amount">${formatMoney(t.amount)}</span>
        <button type="button" onclick="deleteTransaction(${t.id})" class="danger-btn">Delete</button>
      </div>
    `

    transactionList.appendChild(li)
  })
}

// refresh the whole page view
// refresh the whole page view
function refreshUI() {
  if (transactionList && searchInput && sortInput) renderTransactions()
  if (balanceText && incomeText && expensesText && savingsText) updateSummary()
  if (budgetProgress && budgetText && budgetInput) updateBudgetBar()
  if (transactionCountText && largestExpenseText && topCategoryText) updateStats()
  if (insightOne && insightTwo && insightThree) updateInsights()
  if (chartCanvas) updateCategoryChart()
}

// add transaction
if (form) {
  form.addEventListener("submit", function (e) {
    e.preventDefault()

    const description = descriptionInput.value.trim()
    const amount = parseFloat(amountInput.value)
    const type = typeInput.value
    const category = categoryInput.value === "custom"
      ? customInput.value.trim()
      : categoryInput.value
    const date = dateInput.value
    const notes = notesInput.value.trim()

    if (!description || isNaN(amount) || amount <= 0 || !type || !category || !date) {
      alert("please fill in all required fields properly")
      return
    }

    const newTransaction = {
      id: Date.now(),
      description,
      amount,
      type,
      category,
      date,
      notes
    }

    transactions.push(newTransaction)
    saveTransactions()
    refreshUI()
    form.reset()

    if (customInput) {
      customInput.style.display = "none"
      customInput.required = false
      customInput.value = ""
    }
  })
}

// other for category
const categorySelect = document.getElementById("category")
const customInput = document.getElementById("custom-category")

if (categorySelect && customInput) {
  categorySelect.addEventListener("change", () => {
    if (categorySelect.value === "custom") {
      customInput.style.display = "block"
      customInput.required = true
    } else {
      customInput.style.display = "none"
      customInput.required = false
      customInput.value = ""
    }
  })
}

// save monthly budget
if (saveBudgetBtn) {
  saveBudgetBtn.addEventListener("click", function () {
    const value = parseFloat(budgetInput.value)

    if (isNaN(value) || value <= 0) {
      alert("please enter a valid monthly budget")
      return
    }

    monthlyBudget = value
    saveBudget()
    refreshUI()
  })
}

// delete one transaction
function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id)
  saveTransactions()
  refreshUI()
}

// clear all transactions
if (clearBtn) {
  clearBtn.addEventListener("click", function () {
    if (transactions.length === 0) {
      alert("there are no transactions to clear")
      return
    }

    const confirmed = confirm("clear all transactions?")
    if (!confirmed) return

    transactions = []
    saveTransactions()
    refreshUI()
  })
}

// reset the whole app
if (resetBtn) {
  resetBtn.addEventListener("click", function () {
    const confirmed = confirm("Reset the whole app and remove all saved data?")
    if (!confirmed) return

    transactions = []
    monthlyBudget = 0
    currentTheme = "light"
    currentFilter = "all"

    localStorage.clear()

    if (form) form.reset()
    if (searchInput) searchInput.value = ""
    if (budgetInput) budgetInput.value = ""
    if (sortInput) sortInput.value = "newest"

    if (customInput) {
      customInput.style.display = "none"
      customInput.required = false
      customInput.value = ""
    }

    filterButtons.forEach(btn => {
      if (btn.dataset.filter === "all") {
        btn.classList.add("active")
      } else {
        btn.classList.remove("active")
      }
    })

    applyTheme()
    refreshUI()
  })
}

// export data as csv
if (exportBtn) {
  exportBtn.addEventListener("click", function () {
    if (transactions.length === 0) {
      alert("no data to export")
      return
    }

    let csv = "description,amount,type,category,date,notes\n"

    transactions.forEach(t => {
      const row = [
        `"${t.description}"`,
        t.amount,
        `"${t.type}"`,
        `"${t.category}"`,
        `"${t.date}"`,
        `"${t.notes.replace(/"/g, '""')}"`
      ].join(",")

      csv += row + "\n"
    })

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = "trackit-data.csv"
    link.click()

    URL.revokeObjectURL(url)
  })
}

// dark mode toggle
if (darkModeBtn) {
  darkModeBtn.addEventListener("click", function () {
    currentTheme = currentTheme === "light" ? "dark" : "light"
    saveTheme()
    applyTheme()
  })
}

// filter buttons
filterButtons.forEach(button => {
  button.addEventListener("click", function () {
    filterButtons.forEach(btn => btn.classList.remove("active"))
    this.classList.add("active")
    currentFilter = this.dataset.filter

    if (transactionList) {
      renderTransactions()
    }
  })
})

// search and sort
if (searchInput) {
  searchInput.addEventListener("input", function () {
    if (transactionList) renderTransactions()
  })
}

if (sortInput) {
  sortInput.addEventListener("change", function () {
    if (transactionList) renderTransactions()
  })
}

// load app
applyTheme()
refreshUI()
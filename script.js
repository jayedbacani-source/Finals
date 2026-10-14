
/* PESOWISE JAVASCRIPT */

// Get saved data from the browser
function getData(key, defaultValue) {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
}

// Save data to the browser
function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

// Format amounts in Philippine pesos
function peso(amount) {
    return Number(amount).toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP"
    });
}

// Display safe text in an HTML element
function show(element, value) {
    if (element) {
        element.textContent = value;
    }
}

// Load all saved information
const budgetData = getData("pesoWiseBudget", {
    allowance: 0,
    frequency: "",
    food: 0,
    transport: 0,
    school: 0,
    personal: 0,
    savings: 0
});

let expenses = getData("pesoWiseExpenses", []);
let goals = getData("pesoWiseGoals", []);

// Calculate totals using addition
function totalExpenses() {
    return expenses.reduce(
        (total, expense) => total + Number(expense.amount), 0
    );
}

function totalPlannedBudget() {
    return Number(budgetData.food) +
        Number(budgetData.transport) +
        Number(budgetData.school) +
        Number(budgetData.personal) +
        Number(budgetData.savings);
}

function totalCurrentSavings() {
    return goals.reduce(
        (total, goal) => total + Number(goal.current), 0
    );
}

function totalSavingsTarget() {
    return goals.reduce(
        (total, goal) => total + Number(goal.target), 0
    );
}

// DASHBOARD: Save allowance
const allowanceForm = document.querySelector(
    'form:has(#allowance)'
);

if (allowanceForm) {
    allowanceForm.addEventListener("submit", function(event) {
        event.preventDefault();

        budgetData.allowance =
            Number(document.getElementById("allowance").value);

        budgetData.frequency =
            allowanceForm.querySelector(
                'input[name="frequency"]:checked'
            ).value;

        saveData("pesoWiseBudget", budgetData);

        alert("Your allowance has been saved!");
        updateDashboard();
    });
}

// DASHBOARD: Save planned budget categories
const budgetForm = document.querySelector(
    'form:has(#food)'
);

if (budgetForm) {
    budgetForm.addEventListener("submit", function(event) {
        event.preventDefault();

        ["food", "transport", "school", "personal", "savings"]
            .forEach(function(category) {
                budgetData[category] = Number(
                    document.getElementById(
                        category === "savings"
                            ? "budget-savings"
                            : category
                    ).value
                );
            });

        if (totalPlannedBudget() > budgetData.allowance) {
            const proceed = confirm(
                "Your planned budget exceeds your allowance. Save anyway?"
            );

            if (!proceed) return;
        }

        saveData("pesoWiseBudget", budgetData);

        alert("Your budget plan has been saved!");
        updateDashboard();
    });
}

// DASHBOARD: Display calculated amounts
function updateDashboard() {
    const cards = document.querySelectorAll(".overview-card");

    if (cards.length >= 3) {
        show(cards[0].querySelector("h2"),
            peso(totalPlannedBudget()));

        show(cards[1].querySelector("h2"),
            peso(totalExpenses()));

        show(cards[2].querySelector("h2"),
            peso(budgetData.allowance - totalExpenses()));

        show(cards[0].querySelector("span"),
            "Total planned allocations");

        show(cards[1].querySelector("span"),
            "All recorded expenses");

        show(cards[2].querySelector("span"),
            "Allowance minus expenses");
    }

    const allowanceInput = document.getElementById("allowance");

    if (allowanceInput && budgetData.allowance > 0) {
        allowanceInput.value = budgetData.allowance;

        const frequencyInput = document.querySelector(
            'input[name="frequency"][value="' +
            budgetData.frequency + '"]'
        );

        if (frequencyInput) frequencyInput.checked = true;
    }

    ["food", "transport", "school", "personal"].forEach(
        function(category) {
            const input = document.getElementById(category);
            if (input && budgetData[category] > 0) {
                input.value = budgetData[category];
            }
        }
    );

    const savingsInput = document.getElementById("budget-savings");

    if (savingsInput && budgetData.savings > 0) {
        savingsInput.value = budgetData.savings;
    }
}

// EXPENSES: Record a new expense
const expenseForm = document.querySelector(
    'form:has(#expense-description)'
);

if (expenseForm) {
    expenseForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const expense = {
            id: Date.now(),
            description:
                document.getElementById("expense-description").value.trim(),
            amount:
                Number(document.getElementById("expense-amount").value),
            category:
                document.getElementById("expense-category")
                    .selectedOptions[0].textContent,
            date:
                document.getElementById("expense-date").value,
            notes:
                document.getElementById("expense-notes").value.trim()
        };

        expenses.push(expense);
        saveData("pesoWiseExpenses", expenses);

        expenseForm.reset();

        renderExpenses();
        alert("Your expense has been recorded!");
    });
}

// EXPENSES: Display records and calculate totals
function renderExpenses() {
    const tableBody = document.querySelector(".expense-table tbody");

    if (!tableBody) return;

    tableBody.replaceChildren();

    if (expenses.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 4;
        cell.className = "empty-table";
        cell.textContent = "No expenses to display yet.";

        row.appendChild(cell);
        tableBody.appendChild(row);
    } else {
        expenses.forEach(function(expense) {
            const row = document.createElement("tr");

            [expense.description, expense.category,
                expense.date, peso(expense.amount)]
                .forEach(function(value) {
                    const cell = document.createElement("td");
                    cell.textContent = value;
                    row.appendChild(cell);
                });

            const actionCell = document.createElement("td");
            const deleteButton = document.createElement("button");

            deleteButton.type = "button";
            deleteButton.textContent = "Delete";
            deleteButton.className = "button button-secondary";

            deleteButton.addEventListener("click", function() {
                expenses = expenses.filter(
                    item => item.id !== expense.id
                );

                saveData("pesoWiseExpenses", expenses);
                renderExpenses();
                updateDashboard();
            });

            actionCell.appendChild(deleteButton);
            row.appendChild(actionCell);
            tableBody.appendChild(row);
        });
    }

    const summaryCards = document.querySelectorAll(
        ".transaction-summary-card"
    );

    if (summaryCards.length >= 2) {
        show(summaryCards[0].querySelector("h2"),
            peso(totalExpenses()));

        show(summaryCards[1].querySelector("h2"),
            expenses.length);

        show(summaryCards[0].querySelector("span"),
            "Total of recorded expenses");

        show(summaryCards[1].querySelector("span"),
            "Saved expense entries");
    }
}

// SAVINGS: Create a goal
const savingsForm = document.querySelector(
    'form:has(#goal-name)'
);

if (savingsForm) {
    savingsForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const goal = {
            id: Date.now(),
            name: document.getElementById("goal-name").value.trim(),
            target: Number(
                document.getElementById("target-amount").value
            ),
            current: Number(
                document.getElementById("current-savings").value
            ),
            date: document.getElementById("target-date").value,
            category: document.getElementById("goal-category")
                .selectedOptions[0].textContent
        };

        goals.push(goal);
        saveData("pesoWiseGoals", goals);

        savingsForm.reset();
        document.getElementById("current-savings").value = 0;

        renderGoals();
        alert("Your savings goal has been saved!");
    });
}

// SAVINGS: Display goals and calculate progress


function renderGoals() {
    const container = document.querySelector(".empty-goals");

    if (!container) return;

    container.replaceChildren();

    if (goals.length === 0) {
        const message = document.createElement("p");
        message.textContent = "You have no savings goals yet.";
        container.appendChild(message);
    }

    goals.forEach(function(goal) {
        const card = document.createElement("article");
        const title = document.createElement("h3");
        const current = document.createElement("p");
        const target = document.createElement("p");
        const progress = document.createElement("p");
        const date = document.createElement("p");

        const amountLabel = document.createElement("label");
        const amountInput = document.createElement("input");
        const addButton = document.createElement("button");
        const deductButton = document.createElement("button");
        const deleteButton = document.createElement("button");

        const percentage = goal.target > 0
            ? Math.min(100, goal.current / goal.target * 100)
            : 0;

        title.textContent = goal.name;
        current.textContent = "Saved: " + peso(goal.current);
        target.textContent = "Target: " + peso(goal.target);
        progress.textContent =
            "Progress: " + percentage.toFixed(1) + "%";
        date.textContent = "Target date: " + goal.date;

        amountLabel.textContent = "Enter amount:";
        amountInput.type = "number";
        amountInput.min = "0.01";
        amountInput.step = "0.01";
        amountInput.placeholder = "Enter amount";
        amountInput.required = true;

        amountInput.setAttribute(
            "aria-label",
            "Amount for " + goal.name
        );

        // ADD MONEY
        addButton.type = "button";
        addButton.textContent = "Add Savings";
        addButton.className = "button";

        addButton.addEventListener("click", function() {
            const amount = Number(amountInput.value);

            if (!Number.isFinite(amount) || amount <= 0) {
                alert("Please enter an amount greater than zero.");
                return;
            }

            goal.current = Number(goal.current) + amount;

            saveData("pesoWiseGoals", goals);
            renderGoals();

            alert("Money added to your savings goal!");
        });

        // DEDUCT MONEY
        deductButton.type = "button";
        deductButton.textContent = "Deduct Savings";
        deductButton.className = "button button-secondary";

        deductButton.addEventListener("click", function() {
            const amount = Number(amountInput.value);

            if (!Number.isFinite(amount) || amount <= 0) {
                alert("Please enter an amount greater than zero.");
                return;
            }

            if (amount > Number(goal.current)) {
                alert("You cannot deduct more than your current savings.");
                return;
            }

            const confirmed = confirm(
                "Are you sure you want to deduct " +
                peso(amount) + " from " + goal.name + "?"
            );

            if (!confirmed) return;

            goal.current = Number(goal.current) - amount;

            saveData("pesoWiseGoals", goals);
            renderGoals();

            alert("Money deducted from your savings goal!");
        });

        // DELETE GOAL
        deleteButton.type = "button";
        deleteButton.textContent = "Delete Goal";
        deleteButton.className = "button button-secondary";

        deleteButton.addEventListener("click", function() {
            const confirmed = confirm(
                "Are you sure you want to delete this savings goal?"
            );

            if (!confirmed) return;

            goals = goals.filter(function(item) {
                return item.id !== goal.id;
            });

            saveData("pesoWiseGoals", goals);
            renderGoals();
        });

        card.append(
            title,
            current,
            target,
            progress,
            date,
            amountLabel,
            amountInput,
            addButton,
            deductButton,
            deleteButton
        );

        container.appendChild(card);
    });

    // UPDATE SAVINGS SUMMARY
    const cards = document.querySelectorAll(
        ".savings-overview-card"
    );

    if (cards.length >= 3) {
        show(cards[0].querySelector("h2"),
            peso(totalCurrentSavings()));

        show(cards[1].querySelector("h2"),
            peso(totalSavingsTarget()));

        show(cards[2].querySelector("h2"), goals.length);

        show(cards[0].querySelector("span"),
            "Total saved across goals");

        show(cards[1].querySelector("span"),
            "Combined savings targets");

        show(cards[2].querySelector("span"),
            "Saved goals");
    }
}

// Run the correct display functions on each page
updateDashboard();
renderExpenses();
renderGoals();

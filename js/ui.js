/**
 * Updates the salary preview panel for a given employee.
 * @param {Employee} employee
 */
function updateSalaryPreview(employee) {
    const preview = document.getElementById('salary-preview');
    preview.innerHTML = `
        <div class="bg-blue-50 p-4 rounded-lg">
            <h4 class="font-bold text-blue-800">${employee.name}</h4>
            <div class="grid grid-cols-2 gap-2 mt-2">
                <span class="text-sm">Gross Pay:</span>
                <span class="text-sm font-bold text-right">$${employee.calculateGrossPay().toFixed(2)}</span>
                <span class="text-sm">Tax (${employee.taxRate}%):</span>
                <span class="text-sm text-red-600 font-bold text-right">$${employee.calculateTax().toFixed(2)}</span>
                <span class="text-sm">Bonus:</span>
                <span class="text-sm text-green-600 font-bold text-right">$${employee.bonus.toFixed(2)}</span>
                <span class="text-sm font-bold">Net Pay:</span>
                <span class="text-sm font-bold text-green-700 text-right">$${employee.calculateNetPay().toFixed(2)}</span>
            </div>
        </div>
        <div class="text-xs text-gray-600">
            Based on ${employee.hoursWorked} hours @ $${employee.hourlyRate}/hour
        </div>
    `;
}

/**
 * Opens the employee detail modal for the given ID.
 * @param {string} id
 */
function viewEmployee(id) {
    const employee = payrollSystem.getEmployee(id);
    if (!employee) return;

    const modal = document.getElementById('employee-modal');
    const content = document.getElementById('modal-content');

    content.innerHTML = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="font-semibold">Employee ID:</label>
                    <p>${employee.id}</p>
                </div>
                <div>
                    <label class="font-semibold">Name:</label>
                    <p>${employee.name}</p>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="font-semibold">Position:</label>
                    <p>${employee.position}</p>
                </div>
                <div>
                    <label class="font-semibold">Department:</label>
                    <p>${employee.department}</p>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="font-semibold">Hourly Rate:</label>
                    <p>$${employee.hourlyRate.toFixed(2)}</p>
                </div>
                <div>
                    <label class="font-semibold">Tax Rate:</label>
                    <p>${employee.taxRate}%</p>
                </div>
            </div>
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-bold mb-2">Current Pay Period</h4>
                <div class="grid grid-cols-2 gap-2">
                    <span>Hours Worked:</span>
                    <span class="font-bold text-right">${employee.hoursWorked}</span>
                    <span>Gross Pay:</span>
                    <span class="font-bold text-right">$${employee.calculateGrossPay().toFixed(2)}</span>
                    <span>Tax:</span>
                    <span class="text-red-600 font-bold text-right">$${employee.calculateTax().toFixed(2)}</span>
                    <span>Net Pay:</span>
                    <span class="text-green-700 font-bold text-right">$${employee.calculateNetPay().toFixed(2)}</span>
                </div>
            </div>
            ${employee.paymentHistory.length > 0 ? `
                <div>
                    <h4 class="font-bold mb-2">Payment History</h4>
                    <div class="max-h-40 overflow-y-auto">
                        ${employee.paymentHistory.map(payment => `
                            <div class="border-b py-2 text-sm">
                                <div class="flex justify-between">
                                    <span>${payment.date}</span>
                                    <span class="font-bold">$${payment.netPay.toFixed(2)}</span>
                                </div>
                                <div class="text-gray-600 text-xs">
                                    ${payment.hours} hours, Tax: $${(payment.grossPay - payment.netPay).toFixed(2)}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

/**
 * Closes the employee detail modal.
 */
function closeModal() {
    const modal = document.getElementById('employee-modal');
    modal.classList.remove('flex');
    modal.classList.add('hidden');
}

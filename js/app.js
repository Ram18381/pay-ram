// Initialize the payroll system (depends on Employee.js and PayrollSystem.js)
window.payrollChart = null;
const payrollSystem = new PayrollSystem();

// ── Add Employee form ────────────────────────────────────────────────────────
document.getElementById('employee-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const employee = new Employee(
        document.getElementById('employee-id').value,
        document.getElementById('employee-name').value,
        document.getElementById('employee-position').value,
        document.getElementById('employee-department').value,
        document.getElementById('hourly-rate').value,
        document.getElementById('tax-rate').value,
        document.getElementById('bonus').value
    );

    if (payrollSystem.addEmployee(employee)) {
        this.reset();
        document.getElementById('tax-rate').value = 20;
        document.getElementById('bonus').value = 0;
    }
});

// ── Hours Calculator ─────────────────────────────────────────────────────────
document.getElementById('add-hours-btn').addEventListener('click', async function () {
    const empId = document.getElementById('hours-employee').value;
    const hours = document.getElementById('hours-worked').value;

    if (!empId || !hours) {
        alert('Please select an employee and enter hours');
        return;
    }

    const employee = await payrollSystem.addHours(empId, parseFloat(hours));
    if (employee) {
        updateSalaryPreview(employee);
        document.getElementById('hours-worked').value = '';
    }
});

// ── Employee dropdown change → update salary preview ─────────────────────────
document.getElementById('hours-employee').addEventListener('change', function () {
    const employee = payrollSystem.getEmployee(this.value);
    if (employee) {
        updateSalaryPreview(employee);
    }
});

// ── Search ───────────────────────────────────────────────────────────────────
document.getElementById('search-employees').addEventListener('input', function () {
    payrollSystem.updateEmployeeList();
});

// ── CSV Export ───────────────────────────────────────────────────────────────
document.getElementById('export-btn').addEventListener('click', function () {
    payrollSystem.exportToCSV();
});

// ── Close modal on backdrop click ────────────────────────────────────────────
document.getElementById('employee-modal').addEventListener('click', function (e) {
    if (e.target === this) {
        closeModal();
    }
});

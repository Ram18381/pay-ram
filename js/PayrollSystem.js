const API_BASE = '/api/employees';

class PayrollSystem {
    constructor() {
        this.employees = new Map();
        // Load employees from the server on startup
        this.loadFromServer().then(() => this.updateUI());
    }

    // ── API helpers ───────────────────────────────────────────────────────────

    async loadFromServer() {
        try {
            const res  = await fetch(API_BASE);
            const data = await res.json();

            this.employees.clear();
            data.forEach(empData => {
                const emp = new Employee(
                    empData.id,
                    empData.name,
                    empData.position,
                    empData.department,
                    empData.hourlyRate,
                    empData.taxRate,
                    empData.bonus,
                    empData.hoursWorked
                );
                emp.paymentHistory = empData.paymentHistory || [];
                this.employees.set(emp.id, emp);
            });
        } catch (err) {
            console.error('Failed to load employees:', err);
            alert('Could not connect to the server. Is it running?');
        }
    }

    async addEmployee(employee) {
        if (this.employees.has(employee.id)) {
            alert('Employee ID already exists!');
            return false;
        }

        try {
            const res = await fetch(API_BASE, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id:         employee.id,
                    name:       employee.name,
                    position:   employee.position,
                    department: employee.department,
                    hourlyRate: employee.hourlyRate,
                    taxRate:    employee.taxRate,
                    bonus:      employee.bonus,
                }),
            });

            if (res.status === 409) {
                alert('Employee ID already exists!');
                return false;
            }
            if (!res.ok) throw new Error(await res.text());

            const saved = await res.json();
            const emp   = new Employee(
                saved.id, saved.name, saved.position, saved.department,
                saved.hourlyRate, saved.taxRate, saved.bonus, saved.hoursWorked
            );
            emp.paymentHistory = [];
            this.employees.set(emp.id, emp);
            this.updateUI();
            return true;
        } catch (err) {
            console.error('Failed to add employee:', err);
            alert('Error adding employee: ' + err.message);
            return false;
        }
    }

    async removeEmployee(id) {
        try {
            const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(await res.text());

            this.employees.delete(id);
            this.updateUI();
        } catch (err) {
            console.error('Failed to remove employee:', err);
            alert('Error removing employee: ' + err.message);
        }
    }

    async addHours(id, hours) {
        try {
            const res = await fetch(`${API_BASE}/${id}/hours`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hours }),
            });
            if (!res.ok) throw new Error(await res.text());

            const data = await res.json();
            const emp  = this.employees.get(id);
            if (emp) {
                emp.hoursWorked = data.hoursWorked;
                emp.paymentHistory.push(data.historyEntry);
                this.updateUI();
            }
            return emp;
        } catch (err) {
            console.error('Failed to add hours:', err);
            alert('Error adding hours: ' + err.message);
            return null;
        }
    }

    // ── Getters ───────────────────────────────────────────────────────────────

    getEmployee(id) {
        return this.employees.get(id);
    }

    getAllEmployees() {
        return Array.from(this.employees.values());
    }

    getEmployeesByDepartment() {
        const deptMap = new Map();
        this.employees.forEach(employee => {
            if (!deptMap.has(employee.department)) {
                deptMap.set(employee.department, []);
            }
            deptMap.get(employee.department).push(employee);
        });
        return deptMap;
    }

    // ── UI Updates ────────────────────────────────────────────────────────────

    updateUI() {
        this.updateEmployeeList();
        this.updateStats();
        this.updateChart();
        this.updateEmployeeDropdown();
    }

    updateEmployeeList() {
        const list       = document.getElementById('employee-list');
        const searchTerm = document.getElementById('search-employees').value.toLowerCase();

        list.innerHTML = '';
        this.getAllEmployees()
            .filter(emp =>
                emp.name.toLowerCase().includes(searchTerm) ||
                emp.id.toLowerCase().includes(searchTerm) ||
                emp.position.toLowerCase().includes(searchTerm) ||
                emp.department.toLowerCase().includes(searchTerm)
            )
            .forEach(emp => {
                const row = document.createElement('tr');
                row.className = 'border-b hover:bg-gray-50';
                row.innerHTML = `
                    <td class="px-4 py-2 font-mono">${emp.id}</td>
                    <td class="px-4 py-2">${emp.name}</td>
                    <td class="px-4 py-2">${emp.position}</td>
                    <td class="px-4 py-2">
                        <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">${emp.department}</span>
                    </td>
                    <td class="px-4 py-2 text-right">
                        <button onclick="viewEmployee('${emp.id}')" class="text-blue-600 hover:text-blue-800 mr-2">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="payrollSystem.removeEmployee('${emp.id}')" class="text-red-600 hover:text-red-800">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                list.appendChild(row);
            });

        document.getElementById('employee-count').textContent = this.employees.size;
        document.getElementById('total-employees').textContent = this.employees.size;
    }

    updateStats() {
        const employees   = this.getAllEmployees();
        const totalPayroll = employees.reduce((sum, emp) => sum + emp.calculateNetPay(), 0);
        const avgSalary   = employees.length ? totalPayroll / employees.length : 0;

        document.getElementById('total-payroll').textContent = `$${totalPayroll.toFixed(2)}`;
        document.getElementById('avg-salary').textContent    = `$${avgSalary.toFixed(2)}`;
    }

    updateChart() {
        const deptData = this.getEmployeesByDepartment();
        const ctx      = document.getElementById('payroll-chart').getContext('2d');

        if (window.payrollChart) {
            window.payrollChart.destroy();
        }

        const departments     = Array.from(deptData.keys());
        const departmentTotals = departments.map(dept =>
            deptData.get(dept).reduce((sum, emp) => sum + emp.calculateNetPay(), 0)
        );

        window.payrollChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: departments,
                datasets: [{
                    data: departmentTotals,
                    backgroundColor: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444']
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }

    updateEmployeeDropdown() {
        const select = document.getElementById('hours-employee');
        select.innerHTML = '<option value="">Select an employee</option>';

        this.getAllEmployees().forEach(emp => {
            const option = document.createElement('option');
            option.value       = emp.id;
            option.textContent = `${emp.name} (${emp.id})`;
            select.appendChild(option);
        });
    }

    exportToCSV() {
        const employees = this.getAllEmployees();
        const csvData   = employees.map(emp => ({
            ID:             emp.id,
            Name:           emp.name,
            Position:       emp.position,
            Department:     emp.department,
            'Hourly Rate':  emp.hourlyRate,
            'Hours Worked': emp.hoursWorked,
            'Gross Pay':    emp.calculateGrossPay(),
            'Tax':          emp.calculateTax(),
            'Net Pay':      emp.calculateNetPay()
        }));

        const csv  = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url  = window.URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = 'payroll_export.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    }
}

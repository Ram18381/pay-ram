class Employee {
    constructor(id, name, position, department, hourlyRate, taxRate = 20, bonus = 0, hoursWorked = 0) {
        this.id = id;
        this.name = name;
        this.position = position;
        this.department = department;
        this.hourlyRate = parseFloat(hourlyRate);
        this.taxRate = parseFloat(taxRate);
        this.bonus = parseFloat(bonus);
        this.hoursWorked = parseFloat(hoursWorked);
        this.paymentHistory = [];
    }

    addHours(hours) {
        this.hoursWorked += parseFloat(hours);
        this.paymentHistory.push({
            date: new Date().toLocaleDateString(),
            hours: parseFloat(hours),
            grossPay: this.calculateGrossPay(),
            netPay: this.calculateNetPay()
        });
    }

    calculateGrossPay() {
        return (this.hoursWorked * this.hourlyRate) + this.bonus;
    }

    calculateTax() {
        return this.calculateGrossPay() * (this.taxRate / 100);
    }

    calculateNetPay() {
        return this.calculateGrossPay() - this.calculateTax();
    }
}

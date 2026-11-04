/**
 * Official Indian Income Tax Calculator (Old Regime for individuals below 60)
 */
function calculateTax({
    bas = 0,
    lta = 0,
    hra = 0,
    fa = 0,
    inv = 0,
    med = 0,
    rent = 0,
    areaVal = 'met',
    eligibleLta = null
}) {
    const basic = Math.max(0, Number(bas) || 0);
    const ltaAmount = Math.max(0, Number(lta) || 0);
    const hraAmount = Math.max(0, Number(hra) || 0);
    const fixedAllowance = Math.max(0, Number(fa) || 0);
    const rentPaid = Math.max(0, Number(rent) || 0);
    const investments = Math.max(0, Number(inv) || 0);
    const healthInsurance = Math.max(0, Number(med) || 0);
    const isMetro = areaVal === 'met';

    // 1. Gross Salary
    const grossSalary = basic + ltaAmount + hraAmount + fixedAllowance;

    // 2. HRA Exemption (Section 10(13A))
    let hraExemption = 0;
    if (rentPaid > 0 && hraAmount > 0) {
        hraExemption = Math.max(
            0,
            Math.min(
                hraAmount,
                rentPaid - basic * 0.10,
                basic * (isMetro ? 0.50 : 0.40)
            )
        );
    }

    // 3. LTA Exemption (Section 10(5))
    const eligibleLtaExpenses = eligibleLta != null ? Number(eligibleLta) : ltaAmount;
    const ltaExemption = Math.min(ltaAmount, eligibleLtaExpenses);

    // 4. Standard Deduction (Section 16(ia))
    const standardDeduction = grossSalary > 0 ? Math.min(50000, grossSalary) : 0;

    // 5. Taxable Salary
    const taxableSalary = Math.max(
        0,
        grossSalary - hraExemption - ltaExemption - standardDeduction
    );

    // 6. Section 80C & 80D Deductions
    const deduction80C = Math.min(investments, 150000);
    const deduction80D = Math.min(healthInsurance, 25000);

    // 7. Net Taxable Income
    const taxableIncome = Math.max(0, taxableSalary - deduction80C - deduction80D);

    // 8. Progressive Tax Slabs
    let tax = 0;
    if (taxableIncome > 1000000) {
        tax = 112500 + (taxableIncome - 1000000) * 0.30;
    } else if (taxableIncome > 500000) {
        tax = 12500 + (taxableIncome - 500000) * 0.20;
    } else if (taxableIncome > 250000) {
        tax = (taxableIncome - 250000) * 0.05;
    }

    // 9. Section 87A Rebate
    const rebate87A = taxableIncome <= 500000 ? Math.min(tax, 12500) : 0;
    const taxAfterRebate = Math.max(0, tax - rebate87A);

    // 10. Health and Education Cess (4%)
    const cess = Math.round(taxAfterRebate * 0.04);
    const finalTax = Math.round(taxAfterRebate + cess);

    return {
        grossSalary,
        hraExemption,
        ltaExemption,
        standardDeduction,
        taxableSalary,
        deduction80C,
        deduction80D,
        totalDeductions: hraExemption + ltaExemption + standardDeduction + deduction80C + deduction80D,
        taxableIncome,
        tax,
        rebate87A,
        cess,
        totalTaxPayable: finalTax,
        finalTax
    };
}

module.exports = { calculateTax };

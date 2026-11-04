import React from 'react';
import { Link } from 'react-router-dom';

const ShowAns = ({ value, summary }) => {
    const fmt = (num) => (num != null ? `₹${Number(num).toLocaleString('en-IN')}` : '₹0');

    const taxableIncome = summary?.taxableIncome != null ? summary.taxableIncome : value;
    const taxPayable = summary?.totalTaxPayable != null ? summary.totalTaxPayable : value;

    return (
        <div className="container d-flex justify-content-center my-4">
            <div className="card shadow-sm border-0" style={{ maxWidth: '520px', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
                <div className="bg-primary text-white p-4 text-center">
                    <h5 className="mb-1 text-white-50 text-uppercase small letter-spacing">Tax Calculation Result</h5>
                    <h2 className="mb-0 font-weight-bold">{fmt(taxPayable)}</h2>
                    <span className="badge bg-light text-primary mt-2">Total Tax Payable</span>
                </div>

                <div className="card-body p-4">
                    <div className="d-flex justify-content-between py-2 border-bottom">
                        <span className="text-muted">Net Taxable Income</span>
                        <strong className="text-dark">{fmt(taxableIncome)}</strong>
                    </div>

                    {summary && (
                        <>
                            <div className="d-flex justify-content-between py-2 border-bottom">
                                <span className="text-muted">Gross Salary (Basic + LTA + HRA + FA)</span>
                                <span>{fmt(summary.grossSalary)}</span>
                            </div>
                            <div className="d-flex justify-content-between py-2 border-bottom">
                                <span className="text-muted">Total Exemptions & Deductions</span>
                                <span className="text-success">- {fmt(summary.totalDeductions)}</span>
                            </div>
                            {summary.hraExemption > 0 && (
                                <div className="d-flex justify-content-between py-1 px-2 text-muted small">
                                    <span>&bull; HRA Exemption (Sec 10(13A))</span>
                                    <span>{fmt(summary.hraExemption)}</span>
                                </div>
                            )}
                            {summary.ltaExemption > 0 && (
                                <div className="d-flex justify-content-between py-1 px-2 text-muted small">
                                    <span>&bull; LTA Exemption (Sec 10(5))</span>
                                    <span>{fmt(summary.ltaExemption)}</span>
                                </div>
                            )}
                            {summary.standardDeduction > 0 && (
                                <div className="d-flex justify-content-between py-1 px-2 text-muted small">
                                    <span>&bull; Standard Deduction (Sec 16(ia))</span>
                                    <span>{fmt(summary.standardDeduction)}</span>
                                </div>
                            )}
                            {summary.deduction80C > 0 && (
                                <div className="d-flex justify-content-between py-1 px-2 text-muted small">
                                    <span>&bull; Section 80C Investments</span>
                                    <span>{fmt(summary.deduction80C)}</span>
                                </div>
                            )}
                            {summary.deduction80D > 0 && (
                                <div className="d-flex justify-content-between py-1 px-2 text-muted small">
                                    <span>&bull; Section 80D Health Insurance</span>
                                    <span>{fmt(summary.deduction80D)}</span>
                                </div>
                            )}
                            <div className="d-flex justify-content-between py-2 border-bottom">
                                <span className="text-muted">Income Tax (Progressive Slabs)</span>
                                <span>{fmt(summary.tax)}</span>
                            </div>
                            {summary.rebate87A > 0 && (
                                <div className="d-flex justify-content-between py-1 px-2 text-success small">
                                    <span>&bull; Rebate u/s 87A</span>
                                    <span>- {fmt(summary.rebate87A)}</span>
                                </div>
                            )}
                            <div className="d-flex justify-content-between py-2 border-bottom">
                                <span className="text-muted">Health & Education Cess (4%)</span>
                                <span>{fmt(summary.cess)}</span>
                            </div>
                        </>
                    )}

                    <div className="d-flex align-items-center justify-content-center gap-2 mt-4">
                        <Link to="/Tax-Details" className="btn btn-primary px-4 py-2 font-weight-bold">
                            View All Taxes
                        </Link>
                        <Link to="/" onClick={() => window.location.reload()} className="btn btn-outline-secondary px-3 py-2">
                            Recalculate
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShowAns;
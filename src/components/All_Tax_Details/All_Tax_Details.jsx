import React, { useContext, useState, useRef, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import noteContext from '../../context/data/NoteContext';
import InTax from './In_Tax';
import "./All_Tax_Details.css"
import ExcelDown from './Excel_down';

const formatForDateTimeInput = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getDeliveryPreview = (dateStr) => {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return null;
    const diffMs = target.getTime() - Date.now();
    if (diffMs <= 0) return 'Immediate (within ~15 seconds)';

    const diffMins = Math.round(diffMs / (60 * 1000));
    const diffHours = Math.round(diffMs / (60 * 60 * 1000));
    const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));

    let relative = '';
    if (diffMins < 60) {
        relative = `in ${diffMins} minute${diffMins === 1 ? '' : 's'}`;
    } else if (diffHours < 24) {
        relative = `in ~${diffHours} hour${diffHours === 1 ? '' : 's'}`;
    } else {
        relative = `in ~${diffDays} day${diffDays === 1 ? '' : 's'}`;
    }

    return `${target.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} (${relative})`;
};

const All_Tax_Details = () => {
    let history = useHistory();
    const ref = useRef(null);
    const closeRef = useRef(null);

    const context = useContext(noteContext);
    const { getTaxes, Taxes, updateTaxStaus, remainderAPI, deleteTax, remaiderStaus, setRemainderStatus } = context;

    useEffect(() => {
        // Load tax calculations for authenticated user; otherwise redirect to login
        if (localStorage.getItem('token')) {
            getTaxes();
        } else {
            history.push("/login");
        }
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        if (remaiderStaus) {
            if (closeRef.current) {
                closeRef.current.click();
            }
            const timer = setTimeout(() => {
                if (setRemainderStatus) setRemainderStatus(false);
            }, 6000);
            return () => clearTimeout(timer);
        }
    }, [remaiderStaus, setRemainderStatus]);

    const updateTax = (id) => {
        updateTaxStaus(id);
    }

    const [date, setDate] = useState(() => formatForDateTimeInput(new Date(Date.now() + 5 * 60 * 1000)));
    const [TaxId, setTaxId] = useState('');
    const [selectedTax, setSelectedTax] = useState(null);
    const [detail, setDetail] = useState({ id: "", email: "", userId: localStorage.getItem('token') });

    const onchange = (e) => {
        setDetail({ ...detail, [e.target.name]: e.target.value });
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    const setRemainder = (tax) => {
        const id = typeof tax === 'object' ? tax._id : tax;
        const initialEmail = typeof tax === 'object' && tax.userNameTax ? tax.userNameTax : detail.email;
        setTaxId(id);
        setSelectedTax(typeof tax === 'object' ? tax : null);
        setDetail(prev => ({ ...prev, id, email: initialEmail }));

        // Default to in 5 minutes for easy testing if not set
        if (!date) {
            setDate(formatForDateTimeInput(new Date(Date.now() + 5 * 60 * 1000)));
        }
        ref.current.click();
    }

    const applyPreset = (minutes) => {
        const target = new Date(Date.now() + minutes * 60 * 1000);
        setDate(formatForDateTimeInput(target));
    }

    const applyTomorrowPreset = () => {
        const tom = new Date();
        tom.setDate(tom.getDate() + 1);
        tom.setHours(9, 0, 0, 0);
        setDate(formatForDateTimeInput(tom));
    }

    const applyWeekPreset = () => {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        nextWeek.setHours(9, 0, 0, 0);
        setDate(formatForDateTimeInput(nextWeek));
    }

    const handleClick = async (e) => {
        e.preventDefault();
        if (!isValidEmail(detail.email)) {
            alert('Please enter a valid recipient email address.');
            return;
        }
        if (!date) {
            alert('Please choose when to send the reminder.');
            return;
        }
        await remainderAPI(detail.email, TaxId, detail.userId, date);
    }

    const minDateTime = formatForDateTimeInput(new Date());
    const deliveryPreview = getDeliveryPreview(date);

    return (
        <div className='All_Tax_Details'>
            <ExcelDown storeTax={Taxes} />

            {/* Hidden Modal Trigger */}
            <button type="button" className="btn btn-primary d-none" data-bs-toggle="modal" data-bs-target="#exampleModal" ref={ref}>
                Launch reminder modal
            </button>

            {/* Schedule Reminder Modal */}
            <div className="modal fade" id="exampleModal" tabIndex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content shadow border-0">
                        <div className="modal-header bg-light">
                            <h5 className="modal-title font-weight-bold" id="exampleModalLabel">
                                ⏰ Schedule Tax Reminder
                            </h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" ref={closeRef}></button>
                        </div>
                        <div className="modal-body p-4">
                            {selectedTax && (
                                <div className="alert alert-light border mb-3 py-2 px-3 small">
                                    <div><strong>Tax Record:</strong> <code className="text-primary">{selectedTax._id}</code></div>
                                    {selectedTax.TotalTax && (
                                        <div><strong>Total Tax Payable:</strong> ₹{Number(selectedTax.TotalTax).toLocaleString('en-IN')}</div>
                                    )}
                                </div>
                            )}

                            <form onSubmit={handleClick}>
                                <div className="mb-3">
                                    <label htmlFor="email" className="form-label font-weight-bold">Recipient Email</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        id="email"
                                        placeholder="e.g. name@gmail.com"
                                        onChange={onchange}
                                        name='email'
                                        value={detail.email}
                                        required
                                    />
                                    <small className="text-muted">The email where the tax reminder will be delivered.</small>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label font-weight-bold d-block">Quick Timing Options</label>
                                    <div className="btn-group btn-group-sm flex-wrap gap-1 mb-2" role="group">
                                        <button type="button" className="btn btn-outline-secondary" onClick={() => applyPreset(5)}>⚡ In 5 min (test)</button>
                                        <button type="button" className="btn btn-outline-secondary" onClick={() => applyPreset(15)}>In 15 min</button>
                                        <button type="button" className="btn btn-outline-secondary" onClick={() => applyPreset(60)}>In 1 hour</button>
                                        <button type="button" className="btn btn-outline-secondary" onClick={applyTomorrowPreset}>Tomorrow 9 AM</button>
                                        <button type="button" className="btn btn-outline-secondary" onClick={applyWeekPreset}>In 1 week</button>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="calendar-input" className="form-label font-weight-bold">Or Pick Exact Date & Time:</label>
                                    <input
                                        id="calendar-input"
                                        className="form-control"
                                        type="datetime-local"
                                        min={minDateTime}
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        required
                                    />
                                </div>

                                {deliveryPreview && (
                                    <div className="alert alert-info py-2 px-3 small mb-0 d-flex align-items-center">
                                        <span className="me-2" style={{ fontSize: '18px' }}>📬</span>
                                        <div>
                                            <strong>Estimated Delivery:</strong><br />
                                            <span>{deliveryPreview}</span>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>
                        <div className="modal-footer bg-light">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button
                                type="button"
                                disabled={!date || !detail.email}
                                onClick={handleClick}
                                className="btn btn-primary font-weight-bold"
                            >
                                Schedule Reminder
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Customers Tax Cards - ALWAYS VISIBLE */}
            <div className="row my-3">
                <h2 className='m-auto d-flex justify-content-center'>Customers Tax Info</h2>

                {remaiderStaus && (
                    <div className="col-12 my-2">
                        <div className="alert alert-success alert-dismissible fade show d-flex align-items-center justify-content-between shadow-sm" role="alert">
                            <div>
                                <strong>✓ Reminder Scheduled Successfully!</strong> Email will be dispatched according to the selected time.
                            </div>
                            <button
                                type="button"
                                className="btn-close"
                                aria-label="Close"
                                onClick={() => setRemainderStatus && setRemainderStatus(false)}
                            ></button>
                        </div>
                    </div>
                )}

                <div className="container mx-2">
                    {Taxes.length === 0 && (
                        <div className="text-center text-muted my-4">
                            <h5>No Tax records found</h5>
                            <p>Calculate taxes on the Home page to save records here.</p>
                        </div>
                    )}
                </div>

                {/* Taxes are ALWAYS mapped and visible */}
                {Taxes.map((tax) => {
                    return (
                        <InTax
                            key={tax._id}
                            tax={tax}
                            updateTax={updateTax}
                            setRemainder={setRemainder}
                            deleteTax={deleteTax}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default All_Tax_Details;
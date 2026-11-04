import React, { useContext, useState, useRef, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import noteContext from '../context/data/NoteContext';
import ShowAns from './ShowAns';

const TaxData = () => {
    let history = useHistory();

    useEffect(() => { //for showing all the notes. which we fetched from mongoDb
        if (localStorage.getItem('token')) {
            history.push("/");
        }
        else {
            history.push("/login");
        }
        // eslint-disable-next-line
    }, []);

    const ref = useRef(null);
    const closeRef = useRef(null);

    const context = useContext(noteContext);
    const { addNote } = context;

    const [hide, setHidden] = useState(false);


    const [note, setNote] = useState({ bas: "", lta: "", hra: "", fa: "", inv: "", med: "", rent: "" });
    const [areaVal, setAreaVal] = useState("met");
    const [finalTax, setfinalTax] = useState(null);


    const onchange = (e) => {
        setNote({ ...note, [e.target.name]: e.target.value })
    }

    const ModalHandle = () => {
        // Any field left blank counts as 0, so the user only needs to enter the
        // components that apply to them (Basic is still required).
        const toNum = (v) => parseInt(v) || 0;
        const n1 = toNum(note.bas);   // Basic
        const n2 = toNum(note.lta);   // LTA
        const n3 = toNum(note.hra);   // HRA
        const n4 = toNum(note.fa);    // Food Allowance
        const n6 = toNum(note.inv);   // Investments (80C)
        const n7 = toNum(note.med);   // Medical Policy Premium (80D)
        const n8 = toNum(note.rent);  // Rent

        const hraRate = areaVal === "met" ? 0.5 : 0.4;  // metro vs non-metro
        const appHra = Math.max(0, Math.min(hraRate * n8 - 0.1 * n1, n3));
        const finalTax = Math.round((n1 + n2 + n3 + n4) - appHra - n6 - n7);
        setfinalTax(finalTax);

        addNote(n1, n2, n3, n4, n6, n7, n8, finalTax);
        closeRef.current.click();
        setNote({ bas: "", lta: "", hra: "", fa: "", inv: "", med: "", rent: "" });
        setHidden(true);
    }

    const handleClick = (e) => {
        e.preventDefault();
        ref.current.click();
    }

    return (
        <>
            {!hide ? null : <ShowAns value={finalTax} />}
            <button type="button" className="btn btn-primary d-none" data-bs-toggle="modal" data-bs-target="#exampleModal" ref={ref}>
                Launch demo modal
            </button>
            <div className="modal fade" id="exampleModal" tabIndex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="exampleModalLabel">Confirm Values</h5>
                            <button type="button" className="close" data-bs-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <form className='my-3'>
                                <div className="mb-3">
                                    <label htmlFor="ebas" className="form-label">Basic</label>
                                    <input type="number" className="form-control" id="ebas" name='bas' value={note.bas} onChange={onchange} />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="elta" className="form-label">LTA</label>
                                    <input type="number" className="form-control" id="elta" name='lta' value={note.lta} onChange={onchange} />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="ehra" className="form-label">HRA</label>
                                    <input type="number" className="form-control" id="ehra" name='hra' value={note.hra} onChange={onchange} />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="efa" className="form-label">Food Allowance</label>
                                    <input type="number" className="form-control" id="efa" name='fa' value={note.fa} onChange={onchange} />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="einv" className="form-label">Investments</label>
                                    <input type="number" className="form-control" id="einv" name='inv' value={note.inv} onChange={onchange} />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="emed" className="form-label">Medical Policy Premium</label>
                                    <input type="number" className="form-control" id="emed" name='med' value={note.med} onChange={onchange} />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="erent" className="form-label">Rent</label>
                                    <input type="number" className="form-control" id="erent" name='rent' value={note.rent} onChange={onchange} />
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal" ref={closeRef}>Close</button>
                            <button type="button" className="btn btn-primary" onClick={ModalHandle}>Calculate</button>
                        </div>
                    </div>
                </div>
            </div>


            {!hide ? <form className='my-2 taxCol'>
                <p className='taxCol-hint'>Only <b>Basic</b> is required. Leave any field blank and it is treated as 0.</p>
                <div className="form-group">
                    <label htmlFor="bas" className='taxCol-head'>Basic <span className='req'>*</span></label>
                    <input type="number" className="form-control adj-input shadow-none" id="bas" placeholder="Enter Basic" name="bas" autoComplete='false' onChange={onchange} value={note.bas} />
                </div>
                <div className="form-group">
                    <label htmlFor="lta" className='taxCol-head'>LTA</label>
                    <input type="number" className="form-control adj-input shadow-none" id="lta" placeholder="Enter lta" name="lta" autoComplete='false' onChange={onchange} value={note.lta} />
                </div>
                <div className="form-group" >
                    <label htmlFor="hra" className='taxCol-head'>HRA</label>
                    <input type="number" className="form-control adj-input shadow-none" id="hra" placeholder="Enter hra" name="hra" autoComplete='false' onChange={onchange} value={note.hra} />
                </div>
                <div className="form-group">
                    <label htmlFor="fa" className='taxCol-head'>Food Allowance</label>
                    <input type="number" className="form-control adj-input shadow-none" id="fa" placeholder="Enter fa" name="fa" autoComplete='false' onChange={onchange} value={note.fa} />
                </div>
                <div className="form-group">
                    <label htmlFor="inv" className='taxCol-head'>Investments</label>
                    <input type="number" className="form-control adj-input shadow-none" id="inv" placeholder="Enter inv" name="inv" autoComplete='false' onChange={onchange} value={note.inv} />
                </div>
                <div className="form-group" >
                    <label htmlFor="med" className='taxCol-head'>Medical Policy Premium</label>
                    <input type="number" className="form-control adj-input shadow-none" id="med" placeholder="Enter med" name="med" autoComplete='false' onChange={onchange} value={note.med} />
                </div>
                <div className="form-group">
                    <label htmlFor="rent" className='taxCol-head'>Rent</label>
                    <input type="number" className="form-control adj-input shadow-none" id="rent" placeholder="Enter rent" name="rent" autoComplete='false' onChange={onchange} value={note.rent} />
                </div>
                <div className="form-group my-2">
                    <label htmlFor="med" className='taxCol-head'>Area</label>
                    <select name="tempDiff" id="tempDiff" className='mx-2' value={areaVal} onChange={(e) => { setAreaVal(e.target.value) }}>
                        <option value="met">Metro</option>
                        <option value="nomet">Non-Metro</option>
                    </select><br />
                </div>
                <button type="submit" className="btn btn-primary my-2 glow-on-hover" onClick={handleClick} disabled={note.bas === ""} >Submit</button>
            </form> : null}
        </>
    )
}

export default TaxData
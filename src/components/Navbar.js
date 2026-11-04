import React from 'react';
import { useLocation, useHistory, Link } from 'react-router-dom';

const Navbar = () => {
    let history = useHistory();
    let location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('token');
        history.push('/login');
    };

    return <div>
        <nav className="navbar nav-adj navbar-expand-lg navbar-light">
            <div className="container-fluid">
                <div id="logo">
                    <i className="far fa-snowflake"></i> TaxStore
                </div>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                            <Link className={`custom-link nav-link ${location.pathname === "/" ? "active" : ""}`} aria-current="page" to="/">Home</Link>
                        </li>
                        <li className="nav-item">
                            <Link className={`custom-link nav-link ${location.pathname === "/about" ? "active" : ""}`} to="/about">About</Link>
                        </li>
                        <li className="nav-item">
                            <Link className={`custom-link nav-link ${location.pathname === "/Tax-Details" ? "active" : ""}`} to="/Tax-Details">Taxes</Link>
                        </li>
                    </ul>

                    {!localStorage.getItem('token') ? <form className="d-flex">
                        <Link className="btn btn-primary mx-2 widthSet" to="/login" role="button">Login</Link>
                        <Link className="btn btn-primary mx-2 widthSet" to="/signup" role="button" >Signup</Link>
                    </form> : <button className='btn btn-primary widthSet' onClick={handleLogout}>Logout</button>}
                </div>
            </div>
        </nav>
    </div>;
};

export default Navbar;

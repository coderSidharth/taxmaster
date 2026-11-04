import React from 'react';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';

const Login = () => {
    const [credentials, setCredentials] = useState({ email: "", password: "" });
    let history = useHistory();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const response = await fetch('http://localhost:5001/api/auth/login', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email: credentials.email, password: credentials.password }),
        });
        const json = await response.json();
        if (json.success) {
            localStorage.setItem('token', json.authToken);
            history.push("/");
        } else {
            alert(json.error || "Invalid Credentials");
        }
    }

    const onchange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    }

    return (
        <form className='signForm mt-4 adj-height-login mb-3' autoComplete='off' onSubmit={handleSubmit}>
            <p>Login to continue..</p>
            <label htmlFor="loginEmail" className='mb-3'>Email</label><br />
            <input type="email" id="loginEmail" placeholder="Email" className='signInput' onChange={onchange} name='email' value={credentials.email} required /><br />

            <label htmlFor="loginPassword" className='mb-3'>Password</label><br />
            <input type="password" id="loginPassword" placeholder="Password" className='signInput' onChange={onchange} value={credentials.password} name='password' minLength={5} required /><br />

            <button type="submit" className='m-auto sbt-btn' value="Submit">Login</button>
        </form>
    );
};

export default Login;

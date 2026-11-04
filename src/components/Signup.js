import React from 'react';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';

const Signup = () => {

    const [credentials, setCredentials] = useState({ name: "", email: "", password: "", cpassword: "" });
    let history = useHistory();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (credentials.password !== credentials.cpassword) {
            alert("Passwords do not match");
            return;
        }
        const response = await fetch('http://localhost:5001/api/auth/createUser', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name: credentials.name, email: credentials.email, password: credentials.password }),
        });
        const json = await response.json();
        if (json.success) {
            localStorage.setItem('token', json.authToken);
            history.push("/"); //redirecting to "/" endpoint
        }
        else {
            alert((json.errors && json.errors[0] && json.errors[0].msg) || json.error || "Signup failed. Please try again.");
        }
    }

    const onchange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value })
    }

    return (
        <form className='signForm mt-4 mb-3' autoComplete='off' onSubmit={handleSubmit}>
            <p>Welcome</p>
            <label htmlFor="signupName" className='mb-3'>Name</label><br />
            <input type="text" id="signupName" placeholder="Name" className='signInput' onChange={onchange} name='name' minLength={3} required /><br />

            <label htmlFor="signupEmail" className='mb-3'>Email</label><br />
            <input type="email" id="signupEmail" placeholder="Email" className='signInput' onChange={onchange} name='email' required /><br />

            <label htmlFor="signupPassword" className='mb-3'>Password</label><br />
            <input type="password" id="signupPassword" placeholder="Password" className='signInput' onChange={onchange} name='password' minLength={5} required /><br />

            <label htmlFor="signupCpassword" className='mb-3'>Confirm Password</label><br />
            <input type="password" id="signupCpassword" placeholder="Confirm Password" className='signInput' onChange={onchange} name='cpassword' minLength={5} required /><br />

            <button type="submit" value="Submit" className='m-auto sbt-btn mb-1'>Submit</button>
        </form>
    );
};

export default Signup;
import React from 'react'
import "./Success.css"

const Success = () => {
    return (
        <div className="main-success">
            <div className="card-sucess">
                <div className="success-circle">
                    <i className="checkmark">✓</i>
                </div>
                <h1 className='h1-success'>Success</h1>
                <p className='p-success'>We scheduled the tax notification —<br /> you'll receive an email on the deadline.</p>
            </div>
        </div>
    )
}

export default Success
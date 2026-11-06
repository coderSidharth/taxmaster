import NoteContext from "./NoteContext";
import { useState } from "react";

const NoteState = (props) => {
    const host = "http://localhost:5001";
    const [Taxes, setTaxes] = useState([]);
    const [user, setUser] = useState({});
    const [remaiderStaus, setRemainderStatus] = useState(false);

    // Add a tax record
    const addNote = async (bas, lta, hra, fa, inv, med, rent, finalTax) => {
        const response = await fetch(`${host}/api/taxUser/addDetails`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "auth-token": localStorage.getItem('token')
            },
            body: JSON.stringify({ bas, lta, hra, fa, inv, med, rent, finalTax }),
        });
        return await response.json();
    };


    // Fetch authenticated user profile
    const getUser = async () => {
        const response = await fetch(`${host}/api/auth/getuser`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "auth-token": localStorage.getItem('token')
            },
        });
        const json = await response.json();
        setUser(json);
    }

    // Fetch all tax calculations for the user
    const getTaxes = async () => {
        const response = await fetch(`${host}/api/taxUser/get_all_tax`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "auth-token": localStorage.getItem('token')
            },
        });
        const json = await response.json();
        setTaxes(json);
    }

    const updateTaxStaus = async (id) => {
        await fetch(`${host}/api/taxUser/update_tax/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "auth-token": localStorage.getItem('token')
            },
        });
        setTaxes((prev) => prev.map((t) => (t._id === id ? { ...t, status: true } : t)));
    }


    const remainderAPI = async (email, id, userId, date) => {
        const response = await fetch(`${host}/api/taxUser/setRemainder/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "auth-token": localStorage.getItem('token')
            },
            body: JSON.stringify({ email, id, userId, date }),
        });
        const json = await response.json();
        if (json) {
            setRemainderStatus(true);
            await getTaxes();
            return json;
        }
    }


    //delete a tax record
    const deleteTax = async (id) => {
        await fetch(`${host}/api/taxUser/delete_tax/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "auth-token": localStorage.getItem('token')
            },
        });
        setTaxes((prev) => prev.filter((tax) => tax._id !== id));
    }


    return (
        <NoteContext.Provider value={{ addNote, getUser, user, getTaxes, Taxes, updateTaxStaus, remainderAPI, deleteTax, remaiderStaus, setRemainderStatus }}>
            {props.children}
        </NoteContext.Provider>
    )
}

export default NoteState;
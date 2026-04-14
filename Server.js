const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// TEST ROUTE
app.get("/", (req, res) => {
    res.send("M-Pesa Backend Running 🚀");
});

// TOKEN
async function getToken() {
    const url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

    const auth = Buffer.from(
        process.env.CONSUMER_KEY + ":" + process.env.CONSUMER_SECRET
    ).toString("base64");

    const response = await axios.get(url, {
        headers: { Authorization: `Basic ${auth}` }
    });

    return response.data.access_token;
}

// STK PUSH
app.post("/stkpush", async (req, res) => {
    try {
        const { phone, amount } = req.body;

        const token = await getToken();

        const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, "").slice(0, 14);

        const password = Buffer.from(
            process.env.BUSINESS_SHORTCODE + process.env.PASSKEY + timestamp
        ).toString("base64");

        const response = await axios.post(
            "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
            {
                BusinessShortCode: process.env.BUSINESS_SHORTCODE,
                Password: password,
                Timestamp: timestamp,
                TransactionType: "CustomerPayBillOnline",
                Amount: amount,
                PartyA: phone,
                PartyB: process.env.BUSINESS_SHORTCODE,
                PhoneNumber: phone,
                CallBackURL: process.env.CALLBACK_URL,
                AccountReference: "Electronics",
                TransactionDesc: "Payment"
            },
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        res.json(response.data);

    } catch (error) {
        console.log(error.response?.data || error.message);
        res.status(500).send("Error sending STK push");
    }
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
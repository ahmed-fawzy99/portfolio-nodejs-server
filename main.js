const express = require('express')
const bodyParser = require('body-parser');
const nodemailer = require("nodemailer");
const app = express()
const port = 3000
const compression = require('compression')
const cors = require('cors')
const rateLimit = require('express-rate-limit');
require('dotenv').config()


const transporter = nodemailer.createTransport({
    host: process.env.SMTP_SERVER,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
    },
});

const limiter = rateLimit({
    windowMs: 3600000, // 1 Hour
    max: 3, // limit each IP to 5 requests per windowMs
    handler: function (req, res, next) {
        res.status(429).json({
            message: "Too many requests, please try again later.",
        });
    },
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
app.use(cors())
app.use(limiter);
app.use(compression())
app.set("trust proxy", 1);

const sendEmail = async (reqBody, reqIp) => {
    return await transporter.sendMail({
        from: process.env.EMAIL,
        to: process.env.EMAIL,
        subject: `[PORTFOLIO CONTACT FORM]: ${reqBody.subject}`,
        html: `<b>Sender:</b> ${reqBody.email}<br>
               <b>Subject:</b> ${reqBody.subject}<br>
               <b>IP:</b> ${reqIp}<br>
               <b>Message: </b>${reqBody.message}
               `,
    });
}

app.post('/contact', (req, res) => {
    // validate the request
    if (!req.body.email || !req.body.subject || !req.body.message) {
        return res.status(400).send('Missing required fields');
    }
    if (!/\S+@\S+\.\S+/.test(req.body.email)) {
        return res.status(400).send('Invalid email address');
    }
    // send email
    sendEmail(req.body, req.ip).then(r => {
        res.status(200).send('Message submitted successfully!');
    }).catch(e => {
        console.log("Error sending email: ", e);
        res.status(500).send('Error sending email');
    })
})

app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on ${port}`)
})
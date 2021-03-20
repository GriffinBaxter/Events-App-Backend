const users = require('../models/users.model');

exports.register = async function (req, res) {
    try {
        const firstName = req.body.firstName;
        const lastName = req.body.lastName;
        const email = req.body.email;
        const password = req.body.password;

        const userListFromEmail = await users.getUserFromEmail(email);

        if (
            firstName == null || lastName == null || email == null || password == null ||
            !email.includes("@") || password === "" ||
            userListFromEmail.length !== 0
        ) {
            res.statusMessage = "Bad Request";
            res.status(400).send();
        } else {
            const result = await users.register(firstName, lastName, email, password);
            res.statusMessage = "Created";
            res.status(201).send({userId: result.insertId});
        }
    } catch (err) {
        console.log(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

exports.login = async function (req, res) {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userListFromEmailPassword = await users.getUserFromEmailPassword(email, password);

        if (
            email == null || password == null ||
            userListFromEmailPassword.length === 0
        ) {
            res.statusMessage = "Bad Request";
            res.status(400).send();
        } else {
            const idFromEmailPassword = userListFromEmailPassword[0].id;
            const [id, userToken] = await users.login(idFromEmailPassword);
            res.statusMessage = "OK";
            res.status(200).send({userId: id, token: userToken});
        }
    } catch (err) {
        console.log(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

exports.logout = async function (req, res) {
    try {
        const token = req.header('X-Authorization');

        const userListFromToken = await users.getUserFromToken(token);

        if (userListFromToken.length === 0) {
            res.statusMessage = "Unauthorized";
            res.status(401).send();
        } else {
            const idFromToken = userListFromToken[0].id;
            await users.logout(idFromToken);
            res.statusMessage = "OK";
            res.status(200).send();
        }
    } catch (err) {
        console.log(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

exports.retrieve = async function (req, res) {
    try {
        const userToken = req.header('X-Authorization');
        const idFromParam = req.params.id;

        const userListFromToken = await users.getUserFromToken(userToken);

        const userListFromId = await users.getUserFromId(idFromParam);
        if (userListFromId.length === 0) {
            res.statusMessage = "Not Found";
            res.status(404).send();
        } else {
            let result;
            const userFromId = userListFromId[0];
            if (userListFromToken.length !== 0 && userListFromToken[0].id.toString() === idFromParam) {
                result = {
                    firstName: userFromId.first_name,
                    lastName: userFromId.last_name,
                    email: userFromId.email,
                }
            } else {
                result = {
                    firstName: userFromId.first_name,
                    lastName: userFromId.last_name,
                }
            }
            res.statusMessage = "OK";
            res.status(200).send(result);
        }
    } catch (err) {
        console.log(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

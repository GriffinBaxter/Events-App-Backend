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
            userListFromEmail.length !== 0 ||
            firstName === "" || lastName === ""
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
            userListFromEmailPassword.length === 0 ||
            email === "" || password === ""
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

exports.change = async function (req, res) {
    try {
        const firstName = req.body.firstName;
        const lastName = req.body.lastName;
        const email = req.body.email;
        const password = req.body.password;
        const currentPassword = req.body.currentPassword;

        const userToken = req.header('X-Authorization');
        const idFromParam = req.params.id;

        const userListFromId = await users.getUserFromId(idFromParam);

        const userListFromToken = await users.getUserFromToken(userToken);

        const userListFromEmail = await users.getUserFromEmail(email);

        const currentPasswordHash = await users.hashPassword(currentPassword);

        if (userListFromId.length === 0) {
            res.statusMessage = "Not Found";
            res.status(404).send();
        } else if (userListFromToken.length === 0) {
            res.statusMessage = "Unauthorized";
            res.status(401).send();
        } else if (userListFromToken[0].id.toString() !== idFromParam) {
            res.statusMessage = "Forbidden";
            res.status(403).send();
        } else if (
            (password == null && currentPassword != null) || (currentPassword == null && password != null) ||
            !(email == null || email.includes("@")) || password === "" ||
            userListFromEmail.length !== 0 ||
            (currentPassword != null && currentPasswordHash !== userListFromToken[0].password) ||
            firstName === "" || lastName === "" || email === "" || currentPassword === ""
        ) {
            res.statusMessage = "Bad Request";
            res.status(400).send();
        } else {
            if (firstName != null) {
                await users.updateFirstFromId(firstName, idFromParam);
            }
            if (lastName != null) {
                await users.updateLastFromId(lastName, idFromParam);
            }
            if (email != null) {
                await users.updateEmailFromId(email, idFromParam);
            }
            if (password != null) {
                await users.updatePasswordFromId(password, idFromParam);
            }
            res.statusMessage = "OK";
            res.status(200).send();
        }
    } catch (err) {
        console.log(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

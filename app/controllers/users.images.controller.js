const usersImages = require('../models/users.images.model');
const users = require('../models/users.model');

exports.set = async function (req, res) {
    try {
        const bruh = req.body;

        const userToken = req.header('X-Authorization');
        const idFromParam = req.params.id;

        const userListFromId = await users.getUserFromId(idFromParam);

        const userListFromToken = await users.getUserFromToken(userToken);

        if (userListFromId.length === 0) {
            res.statusMessage = "Not Found";
            res.status(404).send();
        } else if (userListFromToken.length === 0) {
            res.statusMessage = "Unauthorized";
            res.status(401).send();
        } else if (userListFromToken[0].id.toString() !== idFromParam) {
            res.statusMessage = "Forbidden";
            res.status(403).send();
        } else if (0 === 1) {
            // todo: bad request
        } else {
            res.statusMessage = "OK";
            res.status(200).send(bruh);
        }

    } catch (err) {
        console.log(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

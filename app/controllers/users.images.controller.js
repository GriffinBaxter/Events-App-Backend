const users = require('../models/users.model');
const fs = require('mz/fs');

const imageDirectory = './storage/images/';

exports.set = async function (req, res) {
    try {
        const image = req.body;

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
        } else if (!req.is("image/png") && !req.is("image/jpeg") && !req.is("image/gif")) {
            res.statusMessage = "Bad Request";
            res.status(400).send();
        } else {
            const files = await fs.readdir(imageDirectory);

            const userImages = files.filter((file) => file.startsWith("user"));

            let extension;
            if (req.is("image/png")) {
                extension = ".png";
            } else if (req.is("image/jpeg")) {
                extension = ".jpg";
            } else {
                extension = ".gif";
            }

            const imageName = "user_" + (userImages.length + 1) + extension;

            await fs.writeFile(imageDirectory + imageName, image);

            let imageFilenameFromId = await users.getImageFilenameFromId(idFromParam);
            imageFilenameFromId = imageFilenameFromId[0].image_filename;

            await users.updateImageFilenameFromId(imageName, idFromParam);

            if (imageFilenameFromId == null) {
                res.statusMessage = "Created";
                res.status(201).send();
            } else {
                res.statusMessage = "OK";
                res.status(200).send();
            }
        }
    } catch (err) {
        console.log(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

const users = require('../models/users.model');
const fs = require('mz/fs');

const imageDirectory = './storage/images/';

exports.retrieve = async function (req, res) {
    try {
        const idFromParam = req.params.id;

        const userListFromId = await users.getUserFromId(idFromParam);

        let imageFilenameFromId = await users.getImageFilenameFromId(idFromParam);
        imageFilenameFromId = imageFilenameFromId[0].image_filename;

        if (userListFromId.length === 0 || imageFilenameFromId == null) {
            res.statusMessage = "Not Found";
            res.status(404).send();
        } else {
            const data = await fs.readFile(imageDirectory + imageFilenameFromId);

            let extension = imageFilenameFromId.substr(imageFilenameFromId.indexOf('.') + 1);
            if (extension === "jpg") {
                extension = "jpeg";
            }

            res.setHeader("Content-Type", "image/" + extension);
            res.statusMessage = "OK";
            res.status(200).send(data);
        }
    } catch (err) {
        console.log(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

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
            let imageFilenameFromId = await users.getImageFilenameFromId(idFromParam);
            imageFilenameFromId = imageFilenameFromId[0].image_filename;

            if (imageFilenameFromId == null) {
                const files = await fs.readdir(imageDirectory);

                const userImages = files.filter((file) => file.startsWith("user"));
                const num = Number(
                    userImages[userImages.length - 1].substr(
                        userImages[userImages.length - 1].indexOf('_') + 1
                    ).slice(0, -4)
                ) + 1;

                let extension;
                if (req.is("image/png")) {
                    extension = ".png";
                } else if (req.is("image/jpeg")) {
                    extension = ".jpg";
                } else {
                    extension = ".gif";
                }

                const imageName = "user_" + num + extension;

                await fs.writeFile(imageDirectory + imageName, image);

                await users.updateImageFilenameFromId(imageName, idFromParam);

                res.statusMessage = "Created";
                res.status(201).send();
            } else {
                await fs.writeFile(imageDirectory + imageFilenameFromId, image);

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

exports.delete = async function (req, res) {
    try {
        const userToken = req.header('X-Authorization');
        const idFromParam = req.params.id;

        const userListFromId = await users.getUserFromId(idFromParam);

        const userListFromToken = await users.getUserFromToken(userToken);

        let imageFilenameFromId = await users.getImageFilenameFromId(idFromParam);
        imageFilenameFromId = imageFilenameFromId[0].image_filename;

        if (userListFromId.length === 0 || imageFilenameFromId == null) {
            res.statusMessage = "Not Found";
            res.status(404).send();
        } else if (userListFromToken.length === 0) {
            res.statusMessage = "Unauthorized";
            res.status(401).send();
        } else if (userListFromToken[0].id.toString() !== idFromParam) {
            res.statusMessage = "Forbidden";
            res.status(403).send();
        } else {
            fs.unlink(imageDirectory + imageFilenameFromId);

            await users.updateImageFilenameFromId(null, idFromParam);

            res.statusMessage = "OK";
            res.status(200).send();
        }
    } catch (err) {
        console.log(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

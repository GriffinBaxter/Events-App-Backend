const events = require('../models/events.model');
const users = require('../models/users.model');
const fs = require('mz/fs');

const imageDirectory = './storage/images/';

exports.retrieve = async function (req, res) {
    try {
        const eventIdFromParam = req.params.id;

        const eventListFromId = await events.getEventFromId(eventIdFromParam);

        let imageFilenameFromEventId = await events.getImageFilenameFromEventId(eventIdFromParam);

        if (eventListFromId.length === 0 || imageFilenameFromEventId[0].image_filename == null) {
            res.statusMessage = "Not Found";
            res.status(404).send();
        } else {
            imageFilenameFromEventId = imageFilenameFromEventId[0].image_filename;

            const data = await fs.readFile(imageDirectory + imageFilenameFromEventId);

            let extension = imageFilenameFromEventId.substr(imageFilenameFromEventId.indexOf('.') + 1);
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
        const eventIdFromParam = req.params.id;

        const eventListFromId = await events.getEventFromId(eventIdFromParam);

        const userListFromToken = await users.getUserFromToken(userToken);

        if (eventListFromId.length === 0) {
            res.statusMessage = "Not Found";
            res.status(404).send();
        } else if (userListFromToken.length === 0) {
            res.statusMessage = "Unauthorized";
            res.status(401).send();
        } else if (userListFromToken[0].id !== eventListFromId[0].organizer_id) {
            res.statusMessage = "Forbidden";
            res.status(403).send();
        } else if (!req.is("image/png") && !req.is("image/jpeg") && !req.is("image/gif")) {
            res.statusMessage = "Bad Request";
            res.status(400).send();
        } else {
            let imageFilenameFromId = await events.getImageFilenameFromEventId(eventIdFromParam);
            imageFilenameFromId = imageFilenameFromId[0].image_filename;

            const files = await fs.readdir(imageDirectory);

            const eventImages = files.filter((file) => file.startsWith("event"));
            let num = 1;
            for (let i = 0; i < eventImages.length; i++) {
                let currentNum = Number(
                    eventImages[i].substr(eventImages[i].indexOf('_') + 1).slice(0, -4)
                ) + 1;

                if (!isNaN(currentNum)) {
                    currentNum = Number(currentNum);
                    if (currentNum > num) {
                        num = currentNum;
                    }
                }
            }

            let extension;
            if (req.is("image/png")) {
                extension = ".png";
            } else if (req.is("image/jpeg")) {
                extension = ".jpg";
            } else {
                extension = ".gif";
            }

            const imageName = "event_" + num + extension;

            await fs.writeFile(imageDirectory + imageName, image);

            await events.updateImageFilenameFromEventId(imageName, eventIdFromParam);

            if (imageFilenameFromId == null) {
                res.statusMessage = "Created";
                res.status(201).send();
            } else {
                fs.unlink(imageDirectory + imageFilenameFromId);

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

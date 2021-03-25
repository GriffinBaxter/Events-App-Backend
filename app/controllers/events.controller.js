const events = require('../models/events.model');
const users = require('../models/users.model');

exports.view = async function (req, res) {
    try {
        const startIndex = req.query.startIndex;
        const count = req.query.count;
        const q = req.query.q;
        const categoryIds = req.query.categoryIds;
        const organizerId = req.query.organizerId;
        const sortBy = req.query.sortBy;

        let categoryIdsExist = true;

        if (categoryIds != null) {
            if (Array.isArray(categoryIds)) {
                const categoryIdsLength = categoryIds.length;
                for (let i = 0; i < categoryIdsLength; i++) {
                    let categoryExists = await events.categoryExists(categoryIds[i]);
                    if (categoryExists.length === 0) {
                        categoryIdsExist = false;
                    }
                }
            } else {
                let categoryExists = await events.categoryExists(categoryIds);
                if (categoryExists.length === 0) {
                    categoryIdsExist = false;
                }
            }
        }

        if (!categoryIdsExist) {
            res.statusMessage = "Bad Request";
            res.status(400).send();
        } else {
            let result = await events.filterAndSort(q, categoryIds, organizerId, sortBy);

            if (startIndex != null) {
                result.splice(0, startIndex);
            }

            if (count != null && count < result.length) {
                result.length = count;
            }

            const resultLength = result.length;
            for (let i = 0; i < resultLength; i++) {

                const currentResult = result[i];

                let categoryList = [];
                let categories = await events.getCategoriesFromEventId(currentResult.id);
                const categoriesLength = categories.length;
                for (let i = 0; i < categoriesLength; i++) {
                    categoryList.push(categories[i].category_id);
                }

                const organizerFirstLast = await events.getOrganizerFirstLastFromEventId(currentResult.id);
                const organizerFirstName = organizerFirstLast[0].first_name;
                const organizerLastName = organizerFirstLast[0].last_name;

                let numAcceptedAttendees = await events.getNumAcceptedAttendeesFromEventId(currentResult.id);
                numAcceptedAttendees = numAcceptedAttendees[0].count

                result[i] = {
                    eventId: currentResult.id,
                    title: currentResult.title,
                    categories: categoryList,
                    organizerFirstName: organizerFirstName,
                    organizerLastName: organizerLastName,
                    numAcceptedAttendees: numAcceptedAttendees,
                    capacity: currentResult.capacity,
                };
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

exports.create = async function (req, res) {
    try {
        const title = req.body.title;
        const description = req.body.description;
        const categoryIds = req.body.categoryIds;
        const date = req.body.date;
        let isOnline = req.body.isOnline;
        const url = req.body.url;
        const venue = req.body.venue;
        const capacity = req.body.capacity;
        let requiresAttendanceControl = req.body.requiresAttendanceControl;
        let fee = req.body.fee;
        if (isOnline == null) {
            isOnline = false;
        }
        if (requiresAttendanceControl == null) {
            requiresAttendanceControl = false;
        }
        if (fee == null) {
            fee = 0.00;
        }

        const token = req.header('X-Authorization');

        const userListFromToken = await users.getUserFromToken(token);

        let categoryIdsExist = true;

        if (categoryIds != null) {
            const categoryIdsLength = categoryIds.length;
            for (let i = 0; i < categoryIdsLength; i++) {
                let categoryExists = await events.categoryExists(categoryIds[i]);
                if (categoryExists.length === 0) {
                    categoryIdsExist = false;
                }
            }
        }

        if (userListFromToken.length === 0) {
            res.statusMessage = "Unauthorized";
            res.status(401).send();
        } else if (
            title == null || description == null || categoryIds == null ||
            (date != null && new Date(date) < new Date()) || !categoryIdsExist
        ) {
            res.statusMessage = "Bad Request";
            res.status(400).send();
        } else {
            const idFromToken = userListFromToken[0].id;

            const result = await events.createEvent(
                title, description, date, isOnline, url, venue, capacity, requiresAttendanceControl, fee, idFromToken
            );

            const eventId = result.insertId

            const categoryIdsLength = categoryIds.length;
            for (let i = 0; i < categoryIdsLength; i++) {
                await events.createEventCategory(eventId, categoryIds[i]);
            }

            res.statusMessage = "Created";
            res.status(201).send({eventId: eventId});
        }
    } catch (err) {
        console.log(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

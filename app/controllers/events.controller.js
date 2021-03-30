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
            (date != null && new Date(date) < new Date()) || !categoryIdsExist ||
            title === "" || (capacity != null && capacity < 1)
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

exports.retrieve = async function (req, res) {
    try {
        const eventIdFromParam = req.params.id;

        const eventListFromId = await events.getEventFromId(eventIdFromParam);
        if (eventListFromId.length === 0) {
            res.statusMessage = "Not Found";
            res.status(404).send();
        } else {
            const eventFromId = eventListFromId[0];

            let categoryList = [];
            let categories = await events.getCategoriesFromEventId(eventFromId.id);
            const categoriesLength = categories.length;
            for (let i = 0; i < categoriesLength; i++) {
                categoryList.push(categories[i].category_id);
            }

            const organizerFirstLast = await events.getOrganizerFirstLastFromEventId(eventFromId.id);
            const organizerFirstName = organizerFirstLast[0].first_name;
            const organizerLastName = organizerFirstLast[0].last_name;

            let numAcceptedAttendees = await events.getNumAcceptedAttendeesFromEventId(eventFromId.id);
            numAcceptedAttendees = numAcceptedAttendees[0].count

            let isOnline = false;
            if (eventFromId.is_online === 1) {
                isOnline = true;
            }
            let requiresAttendanceControl = false;
            if (eventFromId.requires_attendance_control === 1) {
                requiresAttendanceControl = true;
            }

            res.statusMessage = "OK";
            res.status(200).send(
                {
                    eventId: eventFromId.id,
                    title: eventFromId.title,
                    categories: categoryList,
                    organizerFirstName: organizerFirstName,
                    organizerLastName: organizerLastName,
                    numAcceptedAttendees: numAcceptedAttendees,
                    capacity: eventFromId.capacity,
                    description: eventFromId.description,
                    organizerId: eventFromId.organizer_id,
                    date: eventFromId.date,
                    isOnline: isOnline,
                    url: eventFromId.url,
                    venue: eventFromId.venue,
                    requiresAttendanceControl: requiresAttendanceControl,
                    fee: eventFromId.fee,
                }
            );
        }
    } catch (err) {
        console.log(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

exports.change = async function (req, res) {
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

        const userToken = req.header('X-Authorization');
        const eventIdFromParam = req.params.id;

        const eventListFromId = await events.getEventFromId(eventIdFromParam);

        const userListFromToken = await users.getUserFromToken(userToken);

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

        if (eventListFromId.length === 0) {
            res.statusMessage = "Not Found";
            res.status(404).send();
        } else if (userListFromToken.length === 0) {
            res.statusMessage = "Unauthorized";
            res.status(401).send();
        } else if (userListFromToken[0].id !== eventListFromId[0].organizer_id) {
            res.statusMessage = "Forbidden";
            res.status(403).send();
        } else if (
            new Date(eventListFromId[0].date) < new Date() ||
            (date != null && new Date(date) < new Date()) || !categoryIdsExist ||
            title === "" || (capacity != null && capacity < 1)
        ) {
            res.statusMessage = "Bad Request";
            res.status(400).send();
        } else {
            if (title != null) {
                await events.updateTitleFromId(title, eventIdFromParam);
            }
            if (description != null) {
                await events.updateDescriptionFromId(description, eventIdFromParam);
            }
            if (categoryIds != null) {
                await events.deleteEventCategoriesFromId(eventIdFromParam);

                const categoryIdsLength = categoryIds.length;
                for (let i = 0; i < categoryIdsLength; i++) {
                    await events.createEventCategory(eventIdFromParam, categoryIds[i]);
                }
            }
            if (date != null) {
                await events.updateDateFromId(date, eventIdFromParam);
            }
            if (isOnline != null) {
                await events.updateIsOnlineFromId(isOnline, eventIdFromParam);
            }
            if (url != null) {
                await events.updateUrlFromId(url, eventIdFromParam);
            }
            if (venue != null) {
                await events.updateVenueFromId(venue, eventIdFromParam);
            }
            if (capacity != null) {
                await events.updateCapacityFromId(capacity, eventIdFromParam);
            }
            if (requiresAttendanceControl != null) {
                await events.updateRequiresAttendanceControlFromId(requiresAttendanceControl, eventIdFromParam);
            }
            if (fee != null) {
                await events.updateFeeFromId(fee, eventIdFromParam);
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

exports.delete = async function (req, res) {
    try {
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
        } else {
            await events.deleteEventAttendeesFromId(eventIdFromParam);
            await events.deleteEventCategoriesFromId(eventIdFromParam);
            await events.deleteEventFromId(eventIdFromParam);

            res.statusMessage = "OK";
            res.status(200).send();
        }
    } catch (err) {
        console.log(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

exports.retrieveCategories = async function (req, res) {
    try {
        const categories = await events.getCategories();

        let categoryList = [];
        const categoriesLength = categories.length;
        for (let i = 0; i < categoriesLength; i++) {
            categoryList.push(
                {
                    categoryId: categories[i].id,
                    name: categories[i].name,
                }
            );
        }

        res.statusMessage = "OK";
        res.status(200).send(categoryList);
    } catch (err) {
        console.log(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

const events = require('../models/events.model');
const users = require('../models/users.model');

exports.retrieve = async function (req, res) {
    try {
        const userToken = req.header('X-Authorization');
        const eventIdFromParam = req.params.id;

        const eventListFromId = await events.getEventFromId(eventIdFromParam);

        const userListFromToken = await users.getUserFromToken(userToken);

        if (eventListFromId.length === 0) {
            res.statusMessage = "Not Found";
            res.status(404).send();
        } else {
            const eventAttendeesList = await events.getEventAttendeesFromId(eventIdFromParam);

            let isOrganizer = false;
            if (userListFromToken.length !== 0 && (userListFromToken[0].id === eventListFromId[0].organizer_id)) {
                isOrganizer = true;
            }

            let result = [];
            for (let i = 0; i < eventAttendeesList.length; i++) {
                let status = await events.getAttendeeStatusFromStatusId(eventAttendeesList[i].attendance_status_id);
                status = status[0].name;

                let user = await users.getUserFromId(eventAttendeesList[i].user_id);
                user = user[0];

                let isCurrentUser = false;
                if (userListFromToken.length !== 0 && (userListFromToken[0].id === user.id)) {
                    isCurrentUser = true;
                }

                if (
                    status === "accepted" || isOrganizer ||
                    (isCurrentUser && (status === "pending" || status === "rejected"))
                ) {
                    result.push({
                        attendeeId: eventAttendeesList[i].id,
                        status: status,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        dateOfInterest: eventAttendeesList[i].date_of_interest
                    })
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

exports.request = async function (req, res) {
    try {
        const userToken = req.header('X-Authorization');
        const eventIdFromParam = req.params.id;

        const eventListFromId = await events.getEventFromId(eventIdFromParam);

        const userListFromToken = await users.getUserFromToken(userToken);

        const eventAttendeesList = await events.getEventAttendeesFromId(eventIdFromParam);
        let hasJoined = false;
        if (userListFromToken.length !== 0) {
            for (let i = 0; i < eventAttendeesList.length; i++) {
                if (userListFromToken[0].id === eventAttendeesList[i].user_id) {
                    hasJoined = true;
                }
            }
        }

        if (eventListFromId.length === 0) {
            res.statusMessage = "Not Found";
            res.status(404).send();
        } else if (userListFromToken.length === 0) {
            res.statusMessage = "Unauthorized";
            res.status(401).send();
        } else if (hasJoined || new Date(eventListFromId[0].date) < new Date()) {
            res.statusMessage = "Forbidden";
            res.status(403).send();
        } else {
            await events.createEventAttendee(eventIdFromParam, userListFromToken[0].id);

            res.statusMessage = "Created";
            res.status(201).send();
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

        const eventAttendeesList = await events.getEventAttendeesFromId(eventIdFromParam);
        let hasJoined = false;
        if (userListFromToken.length !== 0) {
            for (let i = 0; i < eventAttendeesList.length; i++) {
                if (userListFromToken[0].id === eventAttendeesList[i].user_id) {
                    hasJoined = true;
                }
            }
        }

        if (eventListFromId.length === 0) {
            res.statusMessage = "Not Found";
            res.status(404).send();
        } else if (userListFromToken.length === 0) {
            res.statusMessage = "Unauthorized";
            res.status(401).send();
        } else if (!hasJoined || new Date(eventListFromId[0].date) < new Date()) {
            res.statusMessage = "Forbidden";
            res.status(403).send();
        } else {
            const eventAttendee = await events.getEventAttendeeFromEventIdUserId(
                eventIdFromParam, userListFromToken[0].id
            );

            let status = await events.getAttendeeStatusFromStatusId(eventAttendee[0].attendance_status_id);
            status = status[0].name;

            if (status === "rejected") {
                res.statusMessage = "Forbidden";
                res.status(403).send();
            } else {
                await events.deleteEventAttendeesFromEventIdUserId(eventIdFromParam, userListFromToken[0].id);

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

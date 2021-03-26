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
            const eventAttendees = await events.getEventAttendeesFromId(eventIdFromParam);

            let isOrganizer = false;
            if (userListFromToken.length !== 0 && (userListFromToken[0].id === eventListFromId[0].organizer_id)) {
                isOrganizer = true;
            }

            let result = [];
            for (let i = 0; i < eventAttendees.length; i++) {
                let status = await events.getAttendeeStatusFromStatusId(eventAttendees[i].attendance_status_id);
                status = status[0].name;

                let user = await users.getUserFromId(eventAttendees[i].user_id);
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
                        attendeeId: eventAttendees[i].id,
                        status: status,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        dateOfInterest: eventAttendees[i].date_of_interest
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

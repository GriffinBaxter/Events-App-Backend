const db = require('../../config/db');

exports.filterAndSort = async function (q, categoryIds, organizerId, sortBy) {
    const conn = await db.getPool().getConnection();

    let ifWhere = false;
    let parameters = [];

    let query = 'SELECT id, title, capacity FROM event ';

    if (q != null) {
        if (!ifWhere) {
            ifWhere = true;
            query += 'WHERE ';
        } else {
            query += 'AND '
        }

        query += "(title LIKE CONCAT( '%',?,'%') OR description LIKE CONCAT( '%',?,'%')) ";
        parameters.push(q, q);
    }

    if (categoryIds != null) {
        if (!ifWhere) {
            ifWhere = true;
            query += 'WHERE ';
        } else {
            query += 'AND '
        }

        if (Array.isArray(categoryIds)) {
            const categoryIdsLength = categoryIds.length;

            query += '(';

            for (let i = 0; i < categoryIdsLength; i++) {
                query += '(id IN (SELECT event_id FROM event_category WHERE category_id = ?)) ';
                if (i !== categoryIdsLength - 1) {
                    query += 'OR ';
                }
                parameters.push(categoryIds[i]);
            }

            query += ') ';
        } else {
            query += '(id IN (SELECT event_id FROM event_category WHERE category_id = ?)) ';
            parameters.push(categoryIds);
        }
    }

    if (organizerId != null) {
        if (!ifWhere) {
            ifWhere = true;
            query += 'WHERE ';
        } else {
            query += 'AND '
        }

        query += '(organizer_id = ?) ';
        parameters.push(organizerId);
    }

    if (sortBy === 'ALPHABETICAL_ASC') {
        query += 'ORDER BY title ASC';
    } else if (sortBy === 'ALPHABETICAL_DESC') {
        query += 'ORDER BY title DESC';
    } else if (sortBy === 'DATE_ASC') {
        query += 'ORDER BY date ASC';
    } else if (sortBy === 'DATE_DESC' || sortBy == null) {
        query += 'ORDER BY date DESC';
    } else if (sortBy === 'ATTENDEES_ASC') {
        query += 'ORDER BY (SELECT COUNT(*) FROM event_attendees ' +
            'WHERE attendance_status_id = 1 AND event_id = event.id) ASC';
    } else if (sortBy === 'ATTENDEES_DESC') {
        query += 'ORDER BY (SELECT COUNT(*) FROM event_attendees ' +
            'WHERE attendance_status_id = 1 AND event_id = event.id) DESC';
    } else if (sortBy === 'CAPACITY_ASC' || sortBy == null) {
        query += 'ORDER BY capacity ASC';
    } else if (sortBy === 'CAPACITY_DESC' || sortBy == null) {
        query += 'ORDER BY capacity DESC';
    }

    const [ result ] = await conn.query(query, parameters);
    conn.release();
    return result;
};

exports.getCategoriesFromEventId = async function (eventId) {
    const conn = await db.getPool().getConnection();
    const query = 'SELECT category_id FROM event_category WHERE event_id = ?';
    const [ rows ] = await conn.query( query, [eventId] );
    conn.release();
    return rows;
}

exports.getOrganizerFirstLastFromEventId = async function (eventId) {
    const conn = await db.getPool().getConnection();
    const query = 'SELECT first_name, last_name FROM event, user WHERE event.id = ? AND event.organizer_id = user.id';
    const [ rows ] = await conn.query( query, [eventId] );
    conn.release();
    return rows;
}

exports.getNumAcceptedAttendeesFromEventId = async function (eventId) {
    const conn = await db.getPool().getConnection();
    const query = 'SELECT COUNT(*) as count FROM event_attendees WHERE event_id = ? AND attendance_status_id = 1';
    const [ rows ] = await conn.query( query, [eventId] );
    conn.release();
    return rows;
}

exports.categoryExists = async function (categoryId) {
    const conn = await db.getPool().getConnection();
    const query = 'SELECT true FROM category WHERE id = ?';
    const [ rows ] = await conn.query( query, [categoryId] );
    conn.release();
    return rows;
}

exports.createEvent = async function (
    title, description, date, isOnline, url, venue, capacity, requiresAttendanceControl, fee, id
) {
    const conn = await db.getPool().getConnection();
    const query = 'insert into event (' +
        'title, description, date, is_online, url, venue, capacity, requires_attendance_control, fee, organizer_id' +
        ') values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const [ result ] = await conn.query(
        query, [title, description, date, isOnline, url, venue, capacity, requiresAttendanceControl, fee, id]
    );
    conn.release();
    return result;
};

exports.createEventCategory = async function (eventId, categoryId) {
    const conn = await db.getPool().getConnection();
    const query = 'insert into event_category (event_id, category_id) values (?, ?)';
    await conn.query(query, [eventId, categoryId]);
    conn.release();
};

exports.deleteEventCategoriesFromId = async function (eventId) {
    const conn = await db.getPool().getConnection();
    const query = 'delete from event_category where event_id = ?';
    await conn.query(query, [eventId]);
    conn.release();
};

exports.getEventFromId = async function (eventId) {
    const conn = await db.getPool().getConnection();
    const query = 'SELECT * FROM event WHERE id = ?';
    const [ rows ] = await conn.query( query, [eventId] );
    conn.release();
    return rows;
}

exports.updateTitleFromId = async function (title, eventId) {
    const conn = await db.getPool().getConnection();
    const query = 'update event set title = ? where id = ?';
    await conn.query(query, [title, eventId])
    conn.release();
};

exports.updateDescriptionFromId = async function (description, eventId) {
    const conn = await db.getPool().getConnection();
    const query = 'update event set description = ? where id = ?';
    await conn.query(query, [description, eventId])
    conn.release();
};

exports.updateDateFromId = async function (date, eventId) {
    const conn = await db.getPool().getConnection();
    const query = 'update event set date = ? where id = ?';
    await conn.query(query, [date, eventId])
    conn.release();
};

exports.updateIsOnlineFromId = async function (isOnline, eventId) {
    const conn = await db.getPool().getConnection();
    const query = 'update event set is_online = ? where id = ?';
    await conn.query(query, [isOnline, eventId])
    conn.release();
};

exports.updateUrlFromId = async function (url, eventId) {
    const conn = await db.getPool().getConnection();
    const query = 'update event set url = ? where id = ?';
    await conn.query(query, [url, eventId])
    conn.release();
};

exports.updateVenueFromId = async function (venue, eventId) {
    const conn = await db.getPool().getConnection();
    const query = 'update event set venue = ? where id = ?';
    await conn.query(query, [venue, eventId])
    conn.release();
};

exports.updateCapacityFromId = async function (capacity, eventId) {
    const conn = await db.getPool().getConnection();
    const query = 'update event set capacity = ? where id = ?';
    await conn.query(query, [capacity, eventId])
    conn.release();
};

exports.updateRequiresAttendanceControlFromId = async function (requiresAttendanceControl, eventId) {
    const conn = await db.getPool().getConnection();
    const query = 'update event set requires_attendance_control = ? where id = ?';
    await conn.query(query, [requiresAttendanceControl, eventId])
    conn.release();
};

exports.updateFeeFromId = async function (fee, eventId) {
    const conn = await db.getPool().getConnection();
    const query = 'update event set fee = ? where id = ?';
    await conn.query(query, [fee, eventId])
    conn.release();
};

exports.deleteEventFromId = async function (eventId) {
    const conn = await db.getPool().getConnection();
    const query = 'delete from event where id = ?';
    await conn.query(query, [eventId]);
    conn.release();
};

exports.deleteEventAttendeesFromId = async function (eventId) {
    const conn = await db.getPool().getConnection();
    const query = 'delete from event_attendees where event_id = ?';
    await conn.query(query, [eventId]);
    conn.release();
};

exports.getCategories = async function () {
    const conn = await db.getPool().getConnection();
    const query = 'select * from category order by id';
    const [ rows ] = await conn.query(query, [])
    conn.release();
    return rows;
};

exports.getImageFilenameFromEventId = async function (id) {
    const conn = await db.getPool().getConnection();
    const query = 'select image_filename from event where id = ?';
    const [ rows ] = await conn.query(query, [id])
    conn.release();
    return rows;
};

exports.updateImageFilenameFromEventId = async function (imageName, id) {
    const conn = await db.getPool().getConnection();
    const query = 'update event set image_filename = ? where id = ?';
    await conn.query(query, [imageName, id])
    conn.release();
};

exports.getEventAttendeesFromId = async function (eventId) {
    const conn = await db.getPool().getConnection();
    const query = 'select * from event_attendees where event_id = ? order by date_of_interest ASC';
    const [ rows ] = await conn.query(query, [eventId])
    conn.release();
    return rows;
};

exports.getAttendeeStatusFromStatusId = async function (statusId) {
    const conn = await db.getPool().getConnection();
    const query = 'select name from attendance_status where id = ?';
    const [ rows ] = await conn.query(query, [statusId])
    conn.release();
    return rows;
};

exports.createEventAttendee = async function (eventId, userId) {
    const conn = await db.getPool().getConnection();
    const query = 'insert into event_attendees (event_id, user_id, attendance_status_id) values (?, ?, ?)';
    await conn.query(query, [eventId, userId, 2]);
    conn.release();
};

exports.getEventAttendeeFromEventIdUserId = async function (eventId, userId) {
    const conn = await db.getPool().getConnection();
    const query = 'select * from event_attendees where event_id = ? and user_id = ?';
    const [ rows ] = await conn.query(query, [eventId, userId])
    conn.release();
    return rows;
};

exports.deleteEventAttendeesFromEventIdUserId = async function (eventId, userId) {
    const conn = await db.getPool().getConnection();
    const query = 'delete from event_attendees where event_id = ? and user_id = ?';
    await conn.query(query, [eventId, userId]);
    conn.release();
};

exports.updateAttendanceStatusIdFromEventIdUserId = async function (statusId, eventId, userId) {
    const conn = await db.getPool().getConnection();
    const query = 'update event_attendees set attendance_status_id = ? where event_id = ? and user_id = ?';
    await conn.query(query, [statusId, eventId, userId])
    conn.release();
};

exports.getAttendeeStatusIdFromStatusName = async function (statusName) {
    const conn = await db.getPool().getConnection();
    const query = 'select id from attendance_status where name = ?';
    const [ rows ] = await conn.query(query, [statusName])
    conn.release();
    return rows;
};

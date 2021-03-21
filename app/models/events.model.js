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

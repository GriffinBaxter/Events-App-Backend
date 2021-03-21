const events = require('../models/events.model');

exports.view = async function (req, res) {
    try {
        const startIndex = req.query.startIndex;
        const count = req.query.count;
        const q = req.query.q;
        const categoryIds = req.query.categoryIds;
        const organizerId = req.query.organizerId;
        const sortBy = req.query.sortBy;

        let categoryIdsExist = true;

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

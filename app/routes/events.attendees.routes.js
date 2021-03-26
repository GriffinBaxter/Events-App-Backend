const events = require('../controllers/events.attendees.controller');

module.exports = function (app) {
    app.route(app.rootUrl + '/events/:id/attendees')
        .get(events.retrieve)
        .post(events.request)
        .delete(events.delete);
};

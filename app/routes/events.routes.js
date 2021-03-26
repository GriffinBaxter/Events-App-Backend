const events = require('../controllers/events.controller');

module.exports = function (app) {
    app.route(app.rootUrl + '/events')
        .get(events.view)
        .post(events.create);

    app.route(app.rootUrl + '/events/:id')
        .get(events.retrieve)
        .patch(events.change);
};

const eventsImages = require('../controllers/events.images.controller');

module.exports = function (app) {
    app.route(app.rootUrl + '/events/:id/image')
        .get(eventsImages.retrieve)
        .put(eventsImages.set)
};

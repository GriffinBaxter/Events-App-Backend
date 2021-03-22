const usersImages = require('../controllers/users.images.controller');

module.exports = function (app) {
    app.route(app.rootUrl + '/users/:id/image')
        .put(usersImages.set);
};

const usersImages = require('../controllers/users.images.controller');

module.exports = function (app) {
    app.route(app.rootUrl + '/users/:id/image')
        .get(usersImages.retrieve)
        .put(usersImages.set)
        .delete(usersImages.delete);
};

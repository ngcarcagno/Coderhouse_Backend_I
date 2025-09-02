const path = require("path");

module.exports = {
    PORT: 8080,
    getFilePath: (filename) => path.join(__dirname, `../data/${filename}`),
    paths:
    {
        views: path.join(__dirname,"../src/views"),
        public: path.join(__dirname,"../public"),
        upload: path.join(__dirname,"../uploads"),
    },
};

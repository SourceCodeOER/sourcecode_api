module.exports = (app, db) => {

    // fast example
    app.get("/hello", (req, res) =>
        // db.author.findByPk(req.params.id).then( (result) => res.json(result))
        res.json({
            "test": true
        })
    )
};
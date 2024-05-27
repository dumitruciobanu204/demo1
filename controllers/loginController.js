exports.loginUser = (req, res) => {
    const { token, email, id } = req.user;

    res.status(200).json({ token, email, id });
};

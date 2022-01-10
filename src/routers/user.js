const express = require('express');
const { route } = require('express/lib/application');
const auth = require('../middleware/auth');
const router = new express.Router();
const User = require('../models/user');
const multer = require('multer');
const sharp = require('sharp');
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account');

router.post('/users', async (req, res) => {
    const user = new User(req.body);
    try {
        const token = await user.generateAuthToken();
        await user.save();
        sendWelcomeEmail(user.email, user.name);
        res.status(201).send({ user, token });
    } catch (e) {
        res.status(400).send(e);
    }
});

router.post('/users/login', async (req, res, next) => {
    try {
        const user = await User.findByCredentials(
            req.body.email,
            req.body.password
        );
        const token = await user.generateAuthToken();
        res.send({ user, token });
    } catch (e) {
        res.status(400).send({ msg: 'Invalid login' });
    }
});

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        });
        await req.user.save();
        res.status(200).json({ msg: 'Logged out' });
    } catch (e) {
        const msg = e || 'Logout failed';
        res.status(400).send({ msg });
    }
});

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.status(200).json({ msg: 'Logged out of all devices' });
    } catch (e) {
        const msg = e || 'Logout failed';
        res.status(400).send({ msg });
    }
});

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
});

router.patch('/users/me', auth, async (req, res) => {
    const { id } = req.params;
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'age', 'password'];

    const isValidOperation = updates.every((update) =>
        allowedUpdates.includes(update)
    );

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        const user = req.user;
        updates.forEach((update) => (user[update] = req.body[update]));
        await user.save();

        res.status(200).send(user);
    } catch (e) {
        res.status(400).send(e);
    }
});

router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove();
        sendCancelationEmail(req.user.email, req.user.name);
        res.status(200).send({
            msg: `User successfully deleted`,
            user: req.user,
        });
    } catch (e) {
        if (e.name === 'CastError') {
            res.status(404).send({ msg: 'User not found' });
        } else {
            res.status(400).send("Can't delete user");
        }
    }
});

const upload = multer({
    limits: {
        fileSize: 1000000,
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            cb(new Error(`File must be an image (ie: jpeg/jpg/png)`));
        }
        cb(undefined, true);
    },
});

router.post(
    '/users/me/avatar',
    auth,
    upload.single('avatar'),
    async (req, res, next) => {
        const buffer = await sharp(req.file.buffer)
            .resize({ width: 250, height: 250 })
            .png()
            .toBuffer();

        req.user.avatar = buffer;

        await req.user.save();

        res.send('Successfully uploaded');
    },
    (error, req, res, next) => {
        res.status(400).send({ msg: error.message });
    }
);

router.delete(
    '/users/me/avatar',
    auth,
    async (req, res) => {
        req.user.avatar = undefined;
        await req.user.save();
        res.send('Avatar successfully deleted');
    },
    (error, req, res, next) => {
        res.status(400).send({ msg: error.message });
    }
);

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || !user.avatar) {
            throw new Error('User not found');
        }
        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    } catch (e) {
        res.status(404).send('Failed to locate avatar');
    }
});

module.exports = router;

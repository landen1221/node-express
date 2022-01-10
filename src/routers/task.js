const express = require('express');
const Task = require('../models/task');
const User = require('../models/user');
const auth = require('../middleware/auth');
const router = new express.Router();

router.post('/tasks', auth, async (req, res) => {
    try {
        const task = new Task({
            ...req.body,
            owner: req.user._id,
        });
        await task.save();
        res.status(201).send(task);
    } catch (e) {
        res.status(400).send(e);
    }
});

// GET /tasks?completed=true
// GET /tasks?limit=10&skip=20
// GET /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
    const { completed, limit, skip, sortBy } = req.query;
    const match = {};
    const sort = {};
    if (completed) {
        match.completed = completed === 'true';
    }

    if (sortBy) {
        const parts = sortBy.split(':');
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    }

    try {
        const user = await User.findById(req.user._id);
        await user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(limit) || 10,
                skip: parseInt(skip) || 0,
                sort,
            },
        });
        if (!user.tasks.length) {
            res.status(200).send('No tasks remaining');
        } else {
            res.status(200).send(user.tasks);
        }
    } catch (e) {
        const error = e || 'No tasks found';
        res.status(500).send(error);
    }
});

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;
    try {
        const task = await Task.findOne({ _id, owner: req.user._id });
        if (!task) {
            res.status(404).send({ msg: 'Task not found' });
        } else {
            res.status(200).send(task);
        }
    } catch (e) {
        if (e.name === 'CastError') {
            res.status(404).send({ msg: 'Task not found' });
        } else {
            res.status(500).send(e);
        }
    }
});

router.patch('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;
    const allowed = ['description', 'completed'];
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every((update) =>
        allowed.includes(update)
    );
    if (!isValidOperation) {
        res.status(400).send({ error: 'Invalid update inputs!' });
    }
    try {
        const task = await Task.findOne({ _id, owner: req.user._id });

        if (!task) {
            return res.status(404).send({ msg: 'Task not found' });
        }

        updates.forEach((update) => (task[update] = req.body[update]));
        await task.save();

        res.status(200).send(task);
    } catch (e) {
        res.status(400).send({ msg: "Didn't work" });
    }
});

router.delete('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;
    try {
        const task = await Task.findOneAndDelete({
            _id,
            owner: req.user._id,
        });
        if (!task) {
            res.status(404).send({ msg: 'Task not found' });
        }
        res.status(200).send(task);
    } catch (e) {
        if (e.name === 'CastError') {
            res.status(404).send({ msg: 'Task not found' });
        }
        res.status(404).send(e);
    }
});

module.exports = router;

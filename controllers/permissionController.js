const Permission = require("../models/permission.model");

exports.createPermission = async(req, res) => {
    try {
        const { name } = req.body;
        const permission = await Permission.create({
            name
        });
        res.status(201).json(permission);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.getAllPermissions = async(req, res) => {
    try {
        const permissions = await Permission.findAll();
        res.status(200).json(permissions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.getPermissionById = async(req, res) => {
    try {
        const { id } = req.params;
        const permission = await Permission.findByPk(id);
        if (!permission) {
            return res.status(404).json({ message: "Permission not found" });
        }
        res.status(200).json(permission);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.updatePermission = async(req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const permission = await Permission.findByPk(id);
        if (!permission) {
            return res.status(404).json({ message: "Permission not found" });
        }
        if (name) permission.name = name;
        await permission.save();
        res.status(200).json(permission);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.deletePermission = async(req, res) => {
    try {
        const { id } = req.params;
        const permission = await Permission.findByPk(id);
        if (!permission) {
            return res.status(404).json({ message: "Permission not found" });
        }
        await permission.destroy();
        res.status(200).json({ message: "Permission deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
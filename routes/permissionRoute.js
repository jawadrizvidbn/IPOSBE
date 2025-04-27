const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');

// Route to register a new user
router.post('/', permissionController.createPermission);

// Route to get all permissions
router.get('/', permissionController.getAllPermissions);

// Route to get a permission by ID
router.get('/:id', permissionController.getPermissionById);

// Route to update a permission
router.put('/:id', permissionController.updatePermission);

// Route to delete a permission
router.delete('/:id', permissionController.deletePermission);

module.exports = router;
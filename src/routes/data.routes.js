const express = require('express');
const router = express.Router();
const { CITIES, LOCATION_TYPES, CULTURAL_THEMES, ADDONS } = require('../constants/data');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const catalogue = require('../services/catalogue.service');
router.get('/catalogue', asyncHandler(async (_req, res) => {
  const [services, packages] = await Promise.all([catalogue.listServices(), catalogue.listPackages()]);
  res.json(new ApiResponse(200, 'Catalogue fetched.', { services, packages, cities: CITIES, themes: CULTURAL_THEMES, addons: ADDONS }));
}));
router.get('/services', asyncHandler(async (_req, res) => {
  res.json(new ApiResponse(200, 'Services fetched.', { services: await catalogue.listServices() }));
}));

/**
 * @desc    Get all cities with areas
 * @route   GET /api/v1/data/cities
 */
router.get('/cities', (req, res) => {
  res.status(200).json(new ApiResponse(200, 'Cities fetched.', { cities: CITIES }));
});

/**
 * @desc    Get location types
 * @route   GET /api/v1/data/location-types
 */
router.get('/location-types', (req, res) => {
  res.status(200).json(new ApiResponse(200, 'Location types fetched.', { locationTypes: LOCATION_TYPES }));
});

/**
 * @desc    Get greeting packages
 * @route   GET /api/v1/data/packages
 */
router.get('/packages', asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, 'Packages fetched.', { packages: await catalogue.listPackages(req.query.serviceId) }));
}));

/**
 * @desc    Get cultural themes
 * @route   GET /api/v1/data/themes
 */
router.get('/themes', (req, res) => {
  res.status(200).json(new ApiResponse(200, 'Themes fetched.', { themes: CULTURAL_THEMES }));
});

/**
 * @desc    Get add-ons
 * @route   GET /api/v1/data/addons
 */
router.get('/addons', (req, res) => {
  res.status(200).json(new ApiResponse(200, 'Add-ons fetched.', { addons: ADDONS }));
});

module.exports = router;

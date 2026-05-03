const express = require('express');
const router = express.Router();
const { CITIES, LOCATION_TYPES, GREETING_PACKAGES, CULTURAL_THEMES, ADDONS } = require('../constants/data');
const ApiResponse = require('../utils/ApiResponse');

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
router.get('/packages', (req, res) => {
  res.status(200).json(new ApiResponse(200, 'Packages fetched.', { packages: GREETING_PACKAGES }));
});

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

const router = require('express').Router();
const Joi = require('joi');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const catalogue = require('../services/catalogue.service');
const serviceSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().trim().max(1000).allow('').default(''),
  kind: Joi.string().valid('airport', 'railway', 'hotel', 'function', 'welcome', 'other').required(),
  active: Joi.boolean().default(true), sortOrder: Joi.number().integer().min(0).default(0),
});
const packageSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().trim().max(1000).allow('').default(''),
  serviceIds: Joi.array().items(Joi.string().trim().required()).min(1).unique().required(),
  price: Joi.number().min(0).precision(2).required(),
  includes: Joi.array().items(Joi.string().trim().min(1).max(200)).max(30).default([]),
  active: Joi.boolean().default(true), popular: Joi.boolean().default(false),
});
router.use(protect, authorize('admin', 'super_admin'));
router.get('/', asyncHandler(async (_req, res) => {
  const [services, packages] = await Promise.all([catalogue.listServices(true), catalogue.listPackages(null, true)]);
  res.json(new ApiResponse(200, 'Catalogue fetched.', { services, packages }));
}));
for (const [path, schema, save, key] of [
  ['services', serviceSchema, catalogue.saveService, 'service'],
  ['packages', packageSchema, catalogue.savePackage, 'package'],
]) {
  router.post(`/${path}`, validate(schema), asyncHandler(async (req, res) => {
    res.status(201).json(new ApiResponse(201, 'Created.', { [key]: await save(null, req.body) }));
  }));
  router.put(`/${path}/:id`, validate(schema), asyncHandler(async (req, res) => {
    res.json(new ApiResponse(200, 'Updated.', { [key]: await save(req.params.id, req.body) }));
  }));
}
module.exports = router;

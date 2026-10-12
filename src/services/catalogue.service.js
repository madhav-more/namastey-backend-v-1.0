const { randomUUID } = require('crypto');
const Service = require('../models/Service.model');
const Package = require('../models/Package.model');
const ApiError = require('../utils/ApiError');
const { GREETING_PACKAGES } = require('../constants/data');

// Insert legacy catalogue once, without overwriting an administrator's changes.
let initialisation;
const initialiseCatalogue = () => {
  if (!initialisation) initialisation = (async () => {
    await Promise.all([Service.init(), Package.init()]);
    const seeds = [
      { id: 'airport', name: 'Airport Welcome', kind: 'airport', description: 'A warm welcome at your arrival airport.' },
      { id: 'railway', name: 'Railway Welcome', kind: 'railway', description: 'Welcome your guests at the railway station.' },
      { id: 'hotel', name: 'Hotel Welcome', kind: 'hotel', description: 'A personal welcome at your hotel.' },
      { id: 'function', name: 'Function Welcome', kind: 'function', description: 'Welcome guests at your function or event.' },
      { id: 'welcome', name: 'Welcome Service', kind: 'welcome', description: 'A welcome experience at your chosen venue.' },
    ];
    await Service.bulkWrite(seeds.map((service, index) => ({ updateOne: {
      filter: { id: service.id }, update: { $setOnInsert: { ...service, sortOrder: index, active: true } }, upsert: true,
    } })));
    await Package.bulkWrite(GREETING_PACKAGES.map((pkg, index) => ({ updateOne: {
      filter: { id: pkg.id }, update: { $setOnInsert: { ...pkg, sortOrder: index, serviceIds: seeds.map(s => s.id), active: true } }, upsert: true,
    } })));
  })().catch(error => { initialisation = null; throw error; });
  return initialisation;
};
const listServices = async (admin = false) => {
  await initialiseCatalogue();
  return Service.find(admin ? {} : { active: true }).sort({ sortOrder: 1, name: 1 }).lean();
};
const listPackages = async (serviceId, admin = false) => {
  await initialiseCatalogue();
  const query = admin ? {} : { active: true };
  if (serviceId) query.serviceIds = serviceId;
  if (!admin) {
    const activeIds = (await Service.find({ active: true }).lean()).map(s => s.id);
    query.serviceIds = serviceId && activeIds.includes(serviceId) ? serviceId : { $in: serviceId ? [] : activeIds };
  }
  return Package.find(query).sort({ sortOrder: 1, createdAt: 1, id: 1 }).lean();
};
const checkServiceIds = async ids => {
  const services = await Service.find({ id: { $in: ids } }).lean();
  if (services.length !== ids.length) throw new ApiError(400, 'Select valid services for this package.');
};
const saveService = async (id, data) => {
  await initialiseCatalogue();
  if (!id) return Service.create({ ...data, id: randomUUID() });
  const result = await Service.findOneAndUpdate({ id }, { $set: data }, { new: true, runValidators: true });
  if (!result) throw new ApiError(404, 'Service not found.');
  return result;
};
const savePackage = async (id, data) => {
  await initialiseCatalogue();
  if (data.serviceIds) await checkServiceIds(data.serviceIds);
  if (!id) return Package.create({ ...data, id: randomUUID() });
  const result = await Package.findOneAndUpdate({ id }, { $set: data }, { new: true, runValidators: true });
  if (!result) throw new ApiError(404, 'Package not found.');
  return result;
};
const resolveSelection = async (serviceId, packageId) => {
  await initialiseCatalogue();
  const [service, pkg] = await Promise.all([
    Service.findOne({ id: serviceId, active: true }).lean(),
    Package.findOne({ id: packageId, active: true, serviceIds: serviceId }).lean(),
  ]);
  if (!service || !pkg) throw new ApiError(400, 'This service or package is no longer available. Refresh the catalogue.');
  return { service, pkg };
};
module.exports = { initialiseCatalogue, listServices, listPackages, saveService, savePackage, resolveSelection };

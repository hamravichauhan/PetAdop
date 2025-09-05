import Pet from "../models/Pet.js";
import { httpError } from "../middleware/error.js";

/** helpers **/

function isAdmin(user) {
  return user?.role === "superadmin" || user?.role === "admin";
}
const getUserId = (req) => req?.user?._id || req?.user?.id;

function parseBool(v) {
  if (v === true || v === false) return v;
  if (typeof v === "string") return v.toLowerCase() === "true";
  return undefined;
}

function extractUploadedPhotoPaths(req) {
  if (!req.files || req.files.length === 0) return [];
  return req.files.map((f) => `/uploads/${f.filename}`);
}

function buildTextFilter(q) {
  if (!q) return {};
  return {
    $or: [
      { $text: { $search: q } },
      { name: { $regex: q, $options: "i" } },
      { breed: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { city: { $regex: q, $options: "i" } },
      { otherSpecies: { $regex: q, $options: "i" } },
    ],
  };
}

/** Controllers **/

// GET /api/pets
export async function listPets(req, res, next) {
  try {
    const {
      q,
      species,
      otherSpecies,
      speciesOther, // legacy
      gender,
      size,
      city,
      status,
      vaccinated,
      dewormed,
      sterilized,
      minAge,
      maxAge,
      mine,
      sort = "-createdAt",
      page = 1,
      limit = 12,
    } = req.query;

    const filter = {};

    if (species) filter.species = species;
    const normalizedOther = otherSpecies ?? speciesOther;
    if (normalizedOther) filter.otherSpecies = { $regex: String(normalizedOther).trim(), $options: "i" };

    if (gender) filter.gender = gender;
    if (size) filter.size = size;
    if (city) filter.city = { $regex: String(city).trim(), $options: "i" };
    if (status) filter.status = status;

    const v1 = parseBool(vaccinated);
    if (v1 !== undefined) filter.vaccinated = v1;
    const v2 = parseBool(dewormed);
    if (v2 !== undefined) filter.dewormed = v2;
    const v3 = parseBool(sterilized);
    if (v3 !== undefined) filter.sterilized = v3;

    const age = {};
    if (minAge !== undefined) age.$gte = Number(minAge);
    if (maxAge !== undefined) age.$lte = Number(maxAge);
    if (Object.keys(age).length) filter.ageMonths = age;

    if (mine === "1") {
      const meId = getUserId(req);
      if (meId) filter.listedBy = meId;
    }

    const textFilter = buildTextFilter(q);
    const finalFilter = Object.keys(textFilter).length ? { $and: [filter, textFilter] } : filter;

    const pageNum = Number(page) || 1;
    const lim = Number(limit) || 12;
    const skip = (pageNum - 1) * lim;

    const [items, total] = await Promise.all([
      Pet.find(finalFilter).sort(sort).skip(skip).limit(lim),
      Pet.countDocuments(finalFilter),
    ]);

    res.json({
      success: true,
      meta: { total, page: pageNum, limit: lim, hasNext: skip + items.length < total },
      data: items,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/pets/:id
export async function getPetById(req, res, next) {
  try {
    const { id } = req.params;
    const pet = await Pet.findById(id);
    if (!pet) return next(httpError(404, "Pet not found"));
    res.json({ success: true, data: pet });
  } catch (err) {
    next(err);
  }
}

// POST /api/pets
export async function createPet(req, res, next) {
  try {
    const body = { ...req.body };

    // Normalize legacy key
    body.otherSpecies = body.otherSpecies ?? body.speciesOther;
    delete body.speciesOther;

    // Convert booleans/number for multipart or string inputs
    ["vaccinated", "dewormed", "sterilized"].forEach((k) => {
      if (body[k] !== undefined) body[k] = parseBool(body[k]);
    });
    if (body.ageMonths !== undefined) body.ageMonths = Number(body.ageMonths);

    if (body.species === "other" && !body.otherSpecies) {
      return next(httpError(400, "otherSpecies is required when species is 'other'"));
    }

    // photos: merge JSON URLs + uploaded files
    const uploaded = extractUploadedPhotoPaths(req);
    const jsonPhotos = Array.isArray(body.photos) ? body.photos : [];
    body.photos = [...jsonPhotos, ...uploaded];

    const doc = await Pet.create({
      ...body,
      listedBy: getUserId(req),
    });

    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/pets/:id
export async function updatePetById(req, res, next) {
  try {
    const { id } = req.params;
    const pet = await Pet.findById(id);
    if (!pet) return next(httpError(404, "Pet not found"));

    const meId = getUserId(req);
    const owner = String(pet.listedBy) === String(meId);
    if (!owner && !isAdmin(req.user)) return next(httpError(403, "Not allowed"));

    const body = { ...req.body };

    // Normalize legacy key
    body.otherSpecies = body.otherSpecies ?? body.speciesOther;
    delete body.speciesOther;

    ["vaccinated", "dewormed", "sterilized"].forEach((k) => {
      if (body[k] !== undefined) body[k] = parseBool(body[k]);
    });
    if (body.ageMonths !== undefined) body.ageMonths = Number(body.ageMonths);

    if (body.species === "other" && (body.otherSpecies ?? pet.otherSpecies) === undefined) {
      return next(httpError(400, "otherSpecies is required when species is 'other'"));
    }

    // Append uploaded photos
    const uploaded = extractUploadedPhotoPaths(req);
    if (uploaded.length) {
      body.photos = Array.isArray(pet.photos) ? [...pet.photos, ...uploaded] : uploaded;
    }

    const allowed = [
      "name", "species", "otherSpecies", "breed", "gender", "ageMonths",
      "size", "city", "vaccinated", "dewormed", "sterilized",
      "description", "photos", "status"
    ];
    const updates = {};
    for (const k of allowed) {
      if (body[k] !== undefined) updates[k] = body[k];
    }

    const updated = await Pet.findByIdAndUpdate(id, updates, { new: true });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/pets/:id/status
export async function updatePetStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const pet = await Pet.findById(id);
    if (!pet) return next(httpError(404, "Pet not found"));

    const meId = getUserId(req);
    const owner = String(pet.listedBy) === String(meId);
    if (!owner && !isAdmin(req.user)) return next(httpError(403, "Not allowed"));

    if (!["available", "reserved", "adopted"].includes(status)) {
      return next(httpError(400, "Invalid status"));
    }

    pet.status = status;
    await pet.save();

    res.json({ success: true, data: { id: pet.id, status: pet.status } });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/pets/:id
export async function deletePetById(req, res, next) {
  try {
    const { id } = req.params;
    const pet = await Pet.findById(id);
    if (!pet) return next(httpError(404, "Pet not found"));

    const meId = getUserId(req);
    const owner = String(pet.listedBy) === String(meId);
    if (!owner && !isAdmin(req.user)) return next(httpError(403, "Not allowed"));

    await Pet.findByIdAndDelete(id);
    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
}

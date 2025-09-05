import { Router } from "express";
import { auth } from "../middleware/auth.js";
import {
  listPets,
  getPetById,
  createPet,
  updatePetById,
  deletePetById,
  updatePetStatus,
} from "../controllers/pets.controller.js";
import {
  listPetsQueryValidator,
  createPetValidator,
  updatePetValidator,
  petIdParamValidator,
  updatePetStatusValidator,
} from "../validations/pet.validation.js";
import { handleValidation } from "../middleware/validate.js";
import { upload } from "../middleware/upload.js"; // ✅ import only `upload`

// Derive multipart handler here to avoid named-export drift
const uploadPetPhotos = upload.array("photos", 5);
function normalizeOtherSpecies(req, _res, next) {
  if (req.body && typeof req.body === "object") {
    if (req.body.speciesOther && !req.body.otherSpecies) {
      req.body.otherSpecies = req.body.speciesOther;
      delete req.body.speciesOther;
    }
  }
  next();
}

const router = Router();

/** Public: list & view */
router.get("/", listPetsQueryValidator, handleValidation, listPets);
router.get("/:id", petIdParamValidator, handleValidation, getPetById);

/** Auth required: create/update/delete (with optional photos upload) */
router.post("/", auth, uploadPetPhotos, createPetValidator, handleValidation, createPet);
router.patch("/:id", auth, uploadPetPhotos, petIdParamValidator, updatePetValidator, handleValidation, updatePetById);
router.delete("/:id", auth, petIdParamValidator, handleValidation, deletePetById);

/** Auth required: status change (available | reserved | adopted) */
router.patch("/:id/status", auth, updatePetStatusValidator, handleValidation, updatePetStatus);

export default router;

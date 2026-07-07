import {Router} from "express";
import {SheetsService} from "../sheets";

export function schoolsRouter(sheets: SheetsService): Router {
  const router = Router();

  router.get("/", async (_req, res, next) => {
    try {
      const schools = await sheets.getSchools();
      res.json(schools.map((school) => ({
        schoolId: school.schoolId,
        ces: school.ces,
        county: school.county,
        suNumber: school.suNumber,
        schoolName: school.schoolName,
        street: school.street,
        cityTown: school.cityTown,
        zipCode: school.zipCode,
        notes: school.notes,
        latitude: school.latitude,
        longitude: school.longitude,
      })));
    } catch (error) {
      next(error);
    }
  });

  return router;
}

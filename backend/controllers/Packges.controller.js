import { db } from "../libs/db.js";

// Create Package
export const createPackage = async (req, res) => {
  try {
    const { title, price, description, inclusions, serviceId } = req.body;

    if (!title || !price || !description || !Array.isArray(inclusions) || !serviceId) {
      return res.status(400).json({ error: 'All fields are required: title, price, description, inclusions (array), serviceId' });
    }

    const newPackage = await db.package.create({
      data: { title, price, description, inclusions, serviceId: Number(serviceId) },
    });

    res.status(201).json(newPackage);
  } catch (err) {
    console.error("Create Package Error:", err);
    res.status(500).json({ error: 'Failed to create package', details: err.message });
  }
};

// Get All Packages
export const getAllPackages = async (req, res) => {
  try {
    const packages = await db.package.findMany();
    res.status(200).json(packages);
  } catch (err) {
    console.error("Fetch All Packages Error:", err);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
};

// Get Single Package
export const getPackageById = async (req, res) => {
  try {
    const { id } = req.params;

    const found = await db.package.findUnique({ where: { id } });

    if (!found) return res.status(404).json({ error: 'Package not found' });

    res.status(200).json(found);
  } catch (err) {
    console.error("Fetch Single Package Error:", err);
    res.status(500).json({ error: 'Failed to fetch package' });
  }
};

// Update Package
export const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, price, description, inclusions, serviceId } = req.body;

    const updated = await db.package.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(price && { price }),
        ...(description && { description }),
        ...(inclusions && Array.isArray(inclusions) && { inclusions }),
        ...(serviceId && { serviceId: Number(serviceId) }),
      },
    });

    res.status(200).json(updated);
  } catch (err) {
    console.error("Update Package Error:", err);
    res.status(500).json({ error: 'Failed to update package' });
  }
};

// Delete Package
export const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;

    await db.package.delete({ where: { id } });

    res.status(200).json({ message: 'Package deleted successfully' });
  } catch (err) {
    console.error("Delete Package Error:", err);
    res.status(500).json({ error: 'Failed to delete package' });
  }
};

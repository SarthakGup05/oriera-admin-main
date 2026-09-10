import { db } from "../libs/db.js";

// POST /api/contact
export const createEnquiry = async (req, res) => {
  try {
    const { name, email, phone, serviceType, message } = req.body;

    const newEnquiry = await db.contact.create({
      data: {
        name,
        email,
        phone,
        serviceType,
        message,
        status: 'NEW', // Default
      },
    });

    res.status(201).json(newEnquiry);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create enquiry', details: err });
  }
};
// GET /api/contact
// GET /api/contact
export const getAllEnquiries = async (req, res) => {
  try {
    const contacts = await db.contact.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(contacts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contacts', details: err });
  }
};

// PUT /api/contact/:id/status
export const updateEnquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // Must be one of: PENDING, CONVERTED, REJECTED

    const updated = await db.contact.update({
      where: { id: Number(id) },
      data: { status },
    });

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status', details: err });
  }
};

//delete enquiry
export const deleteEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    await db.contact.delete({ where: { id: Number(id) } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete enquiry' });
  }
};


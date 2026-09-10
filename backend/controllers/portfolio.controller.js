import {db} from "../libs/db.js";

export const getPortfolioItems = async (req, res) => {
  try {
    const items = await db.portfolioItem.findMany();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch portfolio items' });
  }
};

export const createPortfolioItem = async (req, res) => {
  try {
    const { title, category, image } = req.body;
    const newItem = await db.portfolioItem.create({
      data: { title, category, image },
    });
    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create portfolio item' });
  }
};

export const updatePortfolioItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, category, image } = req.body;
        const updatedItem = await db.portfolioItem.update({
        where: { id: Number(id) },
        data: { title, category, image },
        });
        res.json(updatedItem);
    } catch (err) {
        res.status(400).json({ error: 'Failed to update portfolio item' });
    }
    }

export const deletePortfolioItem = async (req, res) => {
  try {
    const { id } = req.params;
    await db.portfolioItem.delete({ where: { id: Number(id) } });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(404).json({ error: 'Portfolio item not found' });
  }
};
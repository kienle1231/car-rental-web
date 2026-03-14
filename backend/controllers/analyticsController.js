const { calculatePricingSurges } = require('../utils/pricingSurge');

exports.getPricingSurges = async (req, res) => {
  try {
    const surges = await calculatePricingSurges();
    res.json(surges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

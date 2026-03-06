// Reusable middleware — pass any Zod schema to validate req.body
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({ errors });
  }

  req.body = result.data; // replace with parsed & coerced data
  next();
};

export { validate };

import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql'] }) // Chỉ cho phép schema postgresql
    .required()
    .messages({
      'string.uri': 'DATABASE_URL phải là URL hợp lệ.',
      'string.empty': 'DATABASE_URL không được để trống.',
      'any.required': 'DATABASE_URL là bắt buộc.',
    }),
});
